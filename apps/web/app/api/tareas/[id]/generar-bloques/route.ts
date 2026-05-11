import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { SocioTareaOperacionService } from '@/lib/services/socio-tarea-operacion.service';

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
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Usuario sin email' }, { status: 400 });
    }

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

    const orgId = tarea.org_id as string;
    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    if (rol !== 'SOCIO') {
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
        role: rol,
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

    await SubtareaMvpService.generarBloquesDesdePresupuesto(tareaId);

    const { data: bloques, error: listErr } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, orden, bloque_index, estado')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });

    if (listErr) {
      return NextResponse.json({ success: true, bloques: [], warning: listErr.message });
    }

    return NextResponse.json({ success: true, bloques: bloques ?? [] });
  } catch (error) {
    console.error('[GENERAR_BLOQUES]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
