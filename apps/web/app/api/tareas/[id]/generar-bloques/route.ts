import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { GenerarBloquesError, SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { SocioTareaOperacionService } from '@/lib/services/socio-tarea-operacion.service';
import { listSocioRecordsForAuthUser, resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';

function statusFromGenerarBloquesError(debug: Record<string, unknown> | undefined): number {
  const motivo = String(debug?.motivo ?? '');
  if (motivo === 'PRESUPUESTO_APROBADO_NO_ENCONTRADO') return 422;
  if (motivo === 'YA_EXISTEN_BLOQUES') return 200;
  if (
    motivo.includes('No se pueden crear más de') ||
    motivo === 'SYNC_BLOQUES_PLANIFICADOS_ERROR'
  ) {
    return 409;
  }
  return 500;
}

/**
 * Genera bloques (tareas_subtareas) desde presupuesto aprobado — misma lógica que SubtareaMvpService.
 * No inserta filas incompletas desde el cliente.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tareaId } = await params;

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const userEmail = user.email ?? '';

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error: tareaErr } = await supabaseAny
      .from('tareas')
      .select('id, org_id, estado, responsable_socio_id, responsable, cuadrilla_id')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaErr || !tarea) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada' }, { status: 404 });
    }

    const orgId = String((tarea as { org_id?: string }).org_id ?? '');
    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    const cuentaComoSocio =
      rol === 'SOCIO' ||
      (await listSocioRecordsForAuthUser(supabase as any, {
        id: user.id,
        email: userEmail || null,
      })).length > 0;

    if (!cuentaComoSocio) {
      return NextResponse.json({ success: false, error: 'Solo socios pueden generar bloques' }, { status: 403 });
    }

    const { allowed, debug } = await SocioTareaOperacionService.evaluarSocioPuedeOperarTarea(supabase, {
      userId: user.id,
      userEmail,
      orgId,
      tarea: {
        id: tarea.id,
        estado: tarea.estado,
        responsable_socio_id: tarea.responsable_socio_id,
        responsable: tarea.responsable,
        cuadrilla_id: tarea.cuadrilla_id,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[generar-bloques auth debug]', {
        userId: user.id,
        userEmail,
        rolEnOrg: rol,
        cuentaComoSocio,
        tareaId,
        allowed,
        checks: debug.checks,
        motivo403: allowed ? null : debug.motivoDenegacion,
      });
    }

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta tarea no está asignada a tu perfil de socio',
          errorCode: 'SOCIO_NO_AUTORIZADO_TAREA',
          ...(process.env.NODE_ENV === 'development' ? { debug } : {}),
        },
        { status: 403 },
      );
    }

    const socioResuelto = await resolveSocioParaOperacionDeTarea(supabase as any, {
      id: user.id,
      email: userEmail || null,
    }, {
      responsableSocioId: tarea.responsable_socio_id,
      orgId,
    });
    const socioIdSesion = socioResuelto?.id ?? debug.socioIdEfectivo ?? null;

    const generation = await SubtareaMvpService.generarBloquesDesdePresupuesto(tareaId, {
      socioIdOperador: socioIdSesion,
    });

    if (socioIdSesion) {
      const ahora = new Date().toISOString();
      await supabaseAny
        .from('tareas_subtareas')
        .update({ socio_id: socioIdSesion, updated_at: ahora })
        .eq('tarea_id', tareaId)
        .is('socio_id', null);
      await supabaseAny
        .from('tareas_subtareas')
        .update({ socio_id: socioIdSesion, updated_at: ahora })
        .eq('tarea_id', tareaId)
        .neq('socio_id', socioIdSesion);
    }

    const { data: bloques, error: listErr } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, orden, bloque_index, estado, socio_id, presupuesto_id, cantidad, unidad, evidencia_obligatoria, evidencia_cargada')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });

    if (listErr) {
      return NextResponse.json(
        {
          success: false,
          error: 'GENERAR_BLOQUES_ERROR',
          message: 'Los bloques se generaron, pero no se pudieron listar',
          detail: listErr.details ?? null,
          debug: {
            tareaId,
            supabaseError: listErr,
          },
        },
        { status: 500 },
      );
    }

    const listaBloques = bloques ?? [];
    const normEstado = (s: string | null | undefined) => String(s ?? '').toLowerCase();
    const pick =
      listaBloques.find((s: { estado?: string | null }) => normEstado(s.estado) === 'en_progreso') ||
      listaBloques.find((s: { estado?: string | null }) => normEstado(s.estado) === 'para_validar') ||
      listaBloques.find((s: { estado?: string | null }) => normEstado(s.estado) === 'pendiente') ||
      listaBloques.find((s: { estado?: string | null }) => normEstado(s.estado) === 'rechazado') ||
      listaBloques.find((s: { estado?: string | null }) => normEstado(s.estado) === 'rechazada') ||
      null;

    let subtareaOperativa = null;
    if (pick?.id) {
      const { data: subtareaFull } = await supabaseAny
        .from('tareas_subtareas')
        .select(
          `
          *,
          tareas:tareas (
            id,
            title,
            obra_id,
            estado,
            responsable_socio_id,
            obras:obras (
              id,
              name,
              address
            )
          )
        `,
        )
        .eq('id', pick.id)
        .maybeSingle();
      subtareaOperativa = subtareaFull ?? null;
    }

    return NextResponse.json({
      success: true,
      ...generation,
      bloques: listaBloques,
      subtareaOperativa,
    });
  } catch (error) {
    console.error('[GENERAR_BLOQUES]', error);
    if (error instanceof GenerarBloquesError) {
      const motivo = String((error.debug as { motivo?: string })?.motivo ?? '');
      const status = statusFromGenerarBloquesError(error.debug);
      return NextResponse.json(
        {
          success: false,
          error: motivo || 'GENERAR_BLOQUES_ERROR',
          errorCode: motivo || 'GENERAR_BLOQUES_ERROR',
          message: error.message,
          detail: error.detail ?? null,
          debug: error.debug,
        },
        { status },
      );
    }
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      {
        success: false,
        error: 'GENERAR_BLOQUES_ERROR',
        message: msg,
        detail: null,
        debug: {
          motivo: 'ERROR_NO_CLASIFICADO',
        },
      },
      { status: 500 },
    );
  }
}
