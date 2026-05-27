import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import {
  GenerarBloquesError,
  SubtareaMvpService,
} from '@/lib/services/subtarea-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { SocioTareaOperacionService } from '@/lib/services/socio-tarea-operacion.service';
import {
  listSocioRecordsForAuthUser,
  resolveSocioParaOperacionDeTarea,
} from '@/lib/socios/resolveSocioForAuthUser';

function statusFromMessage(msg: string): number {
  if (msg === 'FORBIDDEN_ACTION' || msg.includes('permiso')) return 403;
  if (msg.includes('suspendido') || msg.includes('dos bloques')) return 409;
  if (msg.includes('NO_BLOQUE_OPERATIVO') || msg.includes('SIN_BLOQUES')) return 409;
  if (msg.includes('Solo se pueden iniciar')) return 409;
  return 500;
}

/**
 * Flujo atómico del socio: generar bloques → vincular socio → iniciar bloque operativo.
 * Evita depender de lecturas RLS del cliente entre pasos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tareaId } = await params;
    const body = await request.json().catch(() => ({}));
    const subtareaIdPreferida =
      typeof body?.subtareaId === 'string' ? body.subtareaId : null;

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
      return NextResponse.json({ success: false, error: 'Solo socios pueden operar bloques' }, { status: 403 });
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

    const socioResuelto = await resolveSocioParaOperacionDeTarea(
      supabase as any,
      { id: user.id, email: userEmail || null },
      {
        responsableSocioId: tarea.responsable_socio_id,
        orgId,
      },
    );
    const socioId =
      socioResuelto?.id ??
      debug.socioIdEfectivo ??
      (await PermisoService.obtenerSocioIdPorUsuario(user.id, orgId));

    if (!socioId) {
      return NextResponse.json(
        { success: false, error: 'No se encontró tu perfil de socio' },
        { status: 403 },
      );
    }

    const resultado = await SubtareaMvpService.comenzarBloqueOperativoDeTarea(
      tareaId,
      { id: user.id, rol: 'SOCIO', socioId },
      { subtareaIdPreferida },
    );

    return NextResponse.json({
      success: true,
      accion: resultado.accion,
      subtarea: resultado.subtarea,
      bloques: resultado.bloques,
    });
  } catch (error) {
    console.error('[COMENZAR_BLOQUE]', error);
    if (error instanceof GenerarBloquesError) {
      return NextResponse.json(
        {
          success: false,
          error: 'GENERAR_BLOQUES_ERROR',
          message: error.message,
          detail: error.detail ?? null,
          debug: error.debug,
        },
        { status: 500 },
      );
    }
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json(
      { success: false, error: msg, message: msg },
      { status: statusFromMessage(msg) },
    );
  }
}
