import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';
import { socioPuedeAccederDatosObra } from '@/lib/socios/agenda-access';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  presupuesto_id: z.string().uuid(),
  monto_propuesto: z.number().positive(),
  motivo: z.string().trim().min(10).max(2000),
});

/**
 * POST /api/socio/presupuestos/solicitar-cambio
 * Solicita revisión de monto en presupuesto ya aprobado (sin mutar monto vigente).
 */
export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const socio = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });

    if (!socio) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    const { data: presupuesto, error: presErr } = await supabase
      .from('tareas_presupuestos')
      .select('id, socio_id, estado, monto, tarea_id')
      .eq('id', body.presupuesto_id)
      .eq('socio_id', socio.id)
      .maybeSingle();

    if (presErr || !presupuesto) {
      return NextResponse.json({ message: 'Presupuesto no encontrado' }, { status: 404 });
    }

    if (!estadoPresupuestoEsAprobado(presupuesto.estado)) {
      return NextResponse.json(
        { message: 'Solo podés solicitar cambio en presupuestos ya aprobados por el cliente.' },
        { status: 400 },
      );
    }

    const { data: tarea, error: tareaErr } = await supabase
      .from('tareas')
      .select('id, obra_id')
      .eq('id', presupuesto.tarea_id)
      .maybeSingle();

    if (tareaErr || !tarea?.obra_id) {
      return NextResponse.json({ message: 'Tarea no encontrada' }, { status: 404 });
    }

    const { data: obra } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', tarea.obra_id)
      .maybeSingle();

    if (!obra?.org_id) {
      return NextResponse.json({ message: 'Obra sin organización' }, { status: 400 });
    }

    const puede = await socioPuedeAccederDatosObra(supabase, socio.id, {
      id: obra.id,
      org_id: obra.org_id as string,
    });
    if (!puede) {
      return NextResponse.json({ message: 'Sin acceso a esta obra' }, { status: 403 });
    }

    const { data: pendiente } = await supabaseAny
      .from('presupuesto_solicitudes_cambio')
      .select('id')
      .eq('presupuesto_id', presupuesto.id)
      .eq('estado', 'pendiente')
      .maybeSingle();

    if (pendiente) {
      return NextResponse.json(
        { message: 'Ya tenés una solicitud de cambio pendiente para este presupuesto.' },
        { status: 409 },
      );
    }

    const montoActual = Number(presupuesto.monto ?? 0);
    if (body.monto_propuesto === montoActual) {
      return NextResponse.json(
        { message: 'El monto propuesto debe ser distinto al monto aprobado.' },
        { status: 400 },
      );
    }

    const { data: inserted, error: insErr } = await supabaseAny
      .from('presupuesto_solicitudes_cambio')
      .insert({
        presupuesto_id: presupuesto.id,
        socio_id: socio.id,
        monto_actual: montoActual,
        monto_propuesto: body.monto_propuesto,
        motivo: body.motivo,
        estado: 'pendiente',
      })
      .select('id, estado, created_at')
      .single();

    if (insErr) {
      console.error('[SOLICITAR_CAMBIO_PRESUPUESTO]', insErr);
      return NextResponse.json(
        { message: insErr.message || 'No se pudo registrar la solicitud' },
        { status: 500 },
      );
    }

    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('user_id')
        .eq('id', obra.org_id)
        .maybeSingle();
      const ownerUserId = (orgData as { user_id?: string | null } | null)?.user_id;
      if (ownerUserId) {
        await supabaseAny.from('notificaciones').insert({
          remitente_id: user.id,
          destinatario_id: ownerUserId,
          tipo: 'presupuesto_cambio',
          titulo: 'Solicitud de revisión de presupuesto',
          mensaje: `Un socio solicitó revisar el monto aprobado (${montoActual} → ${body.monto_propuesto}).`,
          metadata: { presupuesto_id: presupuesto.id, solicitud_id: inserted.id },
        });
      }
    } catch (notifErr) {
      console.warn('[SOLICITAR_CAMBIO_PRESUPUESTO] notificación:', notifErr);
    }

    return NextResponse.json({
      success: true,
      solicitud: inserted,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ message: 'Datos inválidos', details: e.flatten() }, { status: 400 });
    }
    console.error('[SOLICITAR_CAMBIO_PRESUPUESTO]', e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
