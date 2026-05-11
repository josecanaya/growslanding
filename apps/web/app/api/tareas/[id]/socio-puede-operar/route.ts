import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';
import { SocioTareaOperacionService } from '@/lib/services/socio-tarea-operacion.service';
import { listSocioRecordsForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const runtime = 'nodejs';

/**
 * ¿Puede el SOCIO autenticado operar esta tarea? (misma lógica que POST transition).
 */
export async function GET(
  _request: Request,
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
    if (authError || !user?.email) {
      return NextResponse.json({ allowed: false, code: 'NO_AUTH' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data: tarea, error: tareaErr } = await supabaseAny
      .from('tareas')
      .select(
        'id, org_id, estado, responsable_socio_id, responsable, cuadrilla_id, obra:obras(org_id)',
      )
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaErr || !tarea) {
      return NextResponse.json({ allowed: false, code: 'TAREA_NOT_FOUND' }, { status: 404 });
    }

    const orgId =
      (tarea.org_id as string) || (tarea.obra as { org_id?: string } | null)?.org_id || '';
    if (!orgId) {
      return NextResponse.json(
        { allowed: false, code: 'NO_ORG_ID_EN_TAREA' },
        { status: 400 },
      );
    }
    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    /** `socios` con la sesión puede tener `org_id` null → `obtenerRolEnOrganizacion` devuelve null aun siendo socio. */
    const filasSesionSocio = await listSocioRecordsForAuthUser(supabase, {
      id: user.id,
      email: user.email,
    });
    const cuentaComoSocio =
      rol === 'SOCIO' || filasSesionSocio.length > 0;

    if (!cuentaComoSocio) {
      return NextResponse.json({
        allowed: false,
        code: 'NOT_SOCIO',
        role: rol,
      });
    }

    const { allowed, socioIdEfectivo, debug } =
      await SocioTareaOperacionService.evaluarSocioPuedeOperarTarea(supabase, {
        userId: user.id,
        userEmail: user.email,
        orgId,
        tarea: {
          id: tarea.id,
          estado: tarea.estado,
          responsable_socio_id: tarea.responsable_socio_id,
          responsable: tarea.responsable,
          cuadrilla_id: tarea.cuadrilla_id,
        },
      });

    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json({
      allowed,
      code: allowed ? 'OK' : 'SOCIO_NO_AUTORIZADO_TAREA',
      ...(isDev ? { debug } : {}),
    });
  } catch (e) {
    console.error('[socio-puede-operar]', e);
    return NextResponse.json({ allowed: false, code: 'ERROR' }, { status: 500 });
  }
}
