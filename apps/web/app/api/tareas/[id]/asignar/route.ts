import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tareaId } = await params;
    const body = await request.json();
    const { socio_id, aprobado_por, fecha_aprobacion } = body;

    if (!socio_id) {
      return NextResponse.json(
        { success: false, error: 'socio_id es requerido' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener datos de la tarea
    const { data: tareaData, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, org_id, obra_id, responsable')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tareaData) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const okContacto = await socioEsContactoDeOrg(supabase, socio_id, tareaData.org_id as string);
    if (!okContacto) {
      return NextResponse.json(
        {
          success: false,
          error: 'El socio no está en tu agenda o no corresponde a esta organización.',
        },
        { status: 403 },
      );
    }

    const { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, telefono, org_id')
      .eq('id', socio_id)
      .maybeSingle();

    const responsableText =
      socioData?.email || socioData?.telefono || socioData?.nombre || null;

    if (socioError || !socioData || !responsableText) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado o sin datos de contacto' },
        { status: 404 }
      );
    }

    // Actualizar la tarea
    const { error: updateError } = await supabaseAny
      .from('tareas')
      .update({
        responsable: responsableText,
        responsable_socio_id: socio_id,
        cuadrilla_id: socio_id,
      })
      .eq('id', tareaId)
      .eq('org_id', tareaData.org_id);

    if (updateError) {
      console.error('[PATCH /api/tareas/[id]/asignar] Error actualizando tarea:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Actualizar presupuesto a APROBADO
    const { error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'APROBADO',
        updated_at: new Date().toISOString(),
      })
      .eq('tarea_id', tareaId)
      .eq('socio_id', socio_id);

    if (presupuestoError) {
      console.error('[PATCH /api/tareas/[id]/asignar] Error actualizando presupuesto:', presupuestoError);
      // No fallar si el presupuesto no existe
    }

    // Rechazar otros presupuestos de la misma tarea
    const { error: rejectError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'RECHAZADO',
        updated_at: new Date().toISOString(),
      })
      .eq('tarea_id', tareaId)
      .neq('socio_id', socio_id);

    if (rejectError) {
      console.warn('[PATCH /api/tareas/[id]/asignar] Error rechazando otros presupuestos:', rejectError);
    }

    // Crear evento en eventos
    const { error: eventoError } = await supabaseAny
      .from('eventos')
      .insert({
        tarea_id: tareaId,
        org_id: tareaData.org_id, // Requerido por la tabla (NOT NULL)
        obra_id: tareaData.obra_id, // Agregar después de ejecutar la migración SQL
        actor_name: user.email ?? 'Sistema',
        actor_role: 'Cliente',
        actor_method: 'login',
        notas: `Tarea asignada a ${socioData.nombre ?? 'socio'}`,
        checklist: null,
        has_nc: false,
        nuevo_estado: 'pendiente' as const,
        snapshot_json: null,
        created_at: new Date().toISOString(),
      });

    if (eventoError) {
      console.warn('[PATCH /api/tareas/[id]/asignar] Error creando evento:', eventoError);
    }

    // Crear notificación para el socio
    // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id)
    const { error: notifError } = await supabaseAny
      .from('notificaciones')
      .insert({
        org_id: tareaData.org_id,
        remitente_id: user.id,          // quien asigna
        destinatario_id: socio_id,      // socio al que se le asigna
        obra_id: tareaData.obra_id,
        tarea_id: tareaId,
        titulo: 'Tarea asignada',
        mensaje: `Te asignaron una nueva tarea en la obra.`,
        tipo: 'asignacion',
        leida: false,
        created_at: new Date().toISOString(),
      });

    if (notifError) {
      console.warn('[PATCH /api/tareas/[id]/asignar] Error creando notificación:', notifError);
    }

    return NextResponse.json({
      success: true,
      tarea_id: tareaId,
      socio_id: socio_id,
      socio_nombre: socioData.nombre,
    });
  } catch (error: any) {
    console.error('[PATCH /api/tareas/[id]/asignar] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}

