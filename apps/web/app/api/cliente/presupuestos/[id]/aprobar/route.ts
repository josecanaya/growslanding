import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { sincronizarTareaTrasPresupuestoAprobado } from '@/lib/services/sync-tarea-presupuesto-aprobado.service';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/cliente/presupuestos/[id]/aprobar
 * Aprueba un único presupuesto (tareas_presupuestos), asigna la tarea al socio y rechaza rivales.
 * Solo el titular de la organización (organizations.user_id) puede ejecutar esta acción.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: presupuestoId } = await context.params;
    if (!presupuestoId) {
      return NextResponse.json({ success: false, error: 'Falta id de presupuesto' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: presupRow, error: presupErr } = await supabaseAny
      .from('tareas_presupuestos')
      .select(
        `
        id,
        tarea_id,
        socio_id,
        estado,
        tareas!inner (
          id,
          title,
          org_id,
          obra_id
        )
      `,
      )
      .eq('id', presupuestoId)
      .maybeSingle();

    if (presupErr || !presupRow) {
      return NextResponse.json(
        { success: false, error: presupErr?.message ?? 'Presupuesto no encontrado' },
        { status: 404 },
      );
    }

    const tarea = presupRow.tareas as {
      id: string;
      title: string | null;
      org_id: string;
      obra_id: string | null;
    };
    const orgId = tarea.org_id;
    const obraId = tarea.obra_id;

    const { data: orgRow, error: orgErr } = await supabaseAny
      .from('organizations')
      .select('user_id')
      .eq('id', orgId)
      .maybeSingle();

    if (orgErr || !orgRow || orgRow.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tenés permiso para aprobar presupuestos de esta organización' },
        { status: 403 },
      );
    }

    const estado = String(presupRow.estado ?? '').toUpperCase();
    if (!['ENVIADO', 'PENDIENTE'].includes(estado)) {
      return NextResponse.json(
        { success: false, error: 'Este presupuesto no está pendiente de respuesta' },
        { status: 400 },
      );
    }

    const socioId = presupRow.socio_id as string | null;
    if (!socioId || !presupRow.tarea_id || !obraId) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos en el presupuesto' },
        { status: 400 },
      );
    }

    let { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, org_id')
      .eq('id', socioId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (socioError) {
      return NextResponse.json(
        { success: false, error: socioError.message ?? 'Error al cargar el socio' },
        { status: 500 },
      );
    }

    if (!socioData) {
      const fb = await supabaseAny
        .from('socios')
        .select('id, nombre, email, org_id')
        .eq('id', socioId)
        .maybeSingle();
      if (fb.error) {
        return NextResponse.json(
          { success: false, error: fb.error.message ?? 'Error al cargar el socio' },
          { status: 500 },
        );
      }
      socioData = fb.data;
    }

    if (!socioData) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado para este presupuesto' },
        { status: 404 },
      );
    }

    if (socioData.org_id && socioData.org_id !== orgId) {
      console.warn(
        '[POST /api/cliente/presupuestos/[id]/aprobar] socio.org_id no coincide con tareas.org_id; se aprueba igual (presupuesto ya asociado a la tarea de esta org)',
        { socioId, socioOrg: socioData.org_id, tareaOrg: orgId },
      );
    }

    const { error: updatePresupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'APROBADO',
        updated_at: new Date().toISOString(),
      })
      .eq('id', presupuestoId);

    if (updatePresupuestoError) {
      return NextResponse.json(
        { success: false, error: updatePresupuestoError.message },
        { status: 500 },
      );
    }

    const syncTarea = await sincronizarTareaTrasPresupuestoAprobado(supabaseAny, {
      tareaId: tarea.id,
      socioId,
    });

    if (!syncTarea.ok) {
      return NextResponse.json(
        { success: false, error: syncTarea.error },
        { status: 500 },
      );
    }

    await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'RECHAZADO',
        updated_at: new Date().toISOString(),
      })
      .eq('tarea_id', presupRow.tarea_id)
      .neq('socio_id', socioId);

    const { error: eventoError } = await supabaseAny.from('eventos').insert({
      tarea_id: tarea.id,
      org_id: orgId,
      obra_id: obraId,
      actor_name: user.email ?? 'Sistema',
      actor_role: 'Cliente',
      actor_method: 'login',
      notas: `Tarea asignada a ${socioData.nombre ?? 'socio'} (presupuesto aprobado)`,
      checklist: null,
      has_nc: false,
      nuevo_estado: 'pendiente' as const,
      snapshot_json: null,
      created_at: new Date().toISOString(),
    });

    if (eventoError) {
      console.warn('[POST /api/cliente/presupuestos/[id]/aprobar] evento:', eventoError);
    }

    const destinatarioNotif = socioId;

    const notifFull = {
      org_id: orgId,
      obra_id: obraId,
      tarea_id: tarea.id,
      remitente_id: user.id,
      destinatario_id: destinatarioNotif,
      socio_id: socioId,
      tipo: 'presupuesto_aprobado',
      titulo: 'Presupuesto aprobado',
      mensaje: `Tu presupuesto para la tarea «${tarea.title ?? 'Tarea'}» fue aprobado y la tarea te quedó asignada.`,
      leida: false,
      created_at: new Date().toISOString(),
    };
    let notifError = (await supabaseAny.from('notificaciones').insert(notifFull)).error;
    if (
      notifError &&
      (notifError.code === '42703' ||
        String(notifError.message).includes('destinatario_id') ||
        String(notifError.message).includes('remitente_id'))
    ) {
      notifError = (
        await supabaseAny.from('notificaciones').insert({
          org_id: orgId,
          obra_id: obraId,
          tarea_id: tarea.id,
          socio_id: socioId,
          tipo: 'presupuesto_aprobado',
          titulo: 'Presupuesto aprobado',
          mensaje: `Tu presupuesto para la tarea «${tarea.title ?? 'Tarea'}» fue aprobado y la tarea te quedó asignada.`,
          leida: false,
          created_at: new Date().toISOString(),
        })
      ).error;
    }
    if (notifError) {
      console.error('[POST /api/cliente/presupuestos/[id]/aprobar] notificación:', notifError);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/cliente/presupuestos/[id]/aprobar]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
