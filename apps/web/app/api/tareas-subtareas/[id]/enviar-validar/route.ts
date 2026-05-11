import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';

function statusFromMessage(msg: string): number {
  if (msg === 'FORBIDDEN_ACTION' || msg.includes('permiso')) return 403;
  if (msg.includes('evidencia')) return 409;
  if (msg.includes('en progreso')) return 409;
  return 500;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, estado, tareas:tareas(org_id, responsable_socio_id)')
      .eq('id', id)
      .maybeSingle();

    if (!subtarea) {
      return NextResponse.json({ success: false, error: 'Subtarea no encontrada' }, { status: 404 });
    }

    const orgId = subtarea.tareas?.org_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 400 });
    }

    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    if (rol !== 'SOCIO') {
      return NextResponse.json(
        { success: false, error: 'Solo socios pueden enviar bloques a validar' },
        { status: 403 },
      );
    }

    const socioId = await PermisoService.obtenerSocioIdPorUsuario(user.id, orgId);
    if (!socioId) {
      return NextResponse.json({ success: false, error: 'No se encontró tu perfil de socio' }, { status: 403 });
    }

    await SubtareaMvpService.enviarParaValidar(id, {
      id: user.id,
      rol: 'SOCIO',
      socioId,
    });

    const { data: updated } = await supabaseAny
      .from('tareas_subtareas')
      .select(
        `
        *,
        tareas:tareas (
          id,
          title,
          obra_id,
          estado,
          obras:obras (
            id,
            name,
            address
          )
        )
      `,
      )
      .eq('id', id)
      .maybeSingle();

    return NextResponse.json({ success: true, subtarea: updated });
  } catch (error) {
    console.error('[ENVIAR_VALIDAR_SUBTAREA]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: msg }, { status: statusFromMessage(msg) });
  }
}
