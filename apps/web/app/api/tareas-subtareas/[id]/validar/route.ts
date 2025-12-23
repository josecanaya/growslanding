import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const metodoPago: 'EFECTIVO' | 'ONLINE' =
      body?.metodoPago === 'ONLINE' ? 'ONLINE' : 'EFECTIVO';
    const accion: 'validar' | 'rechazar' =
      body?.accion === 'rechazar' ? 'rechazar' : 'validar';
    const motivo: string | undefined = typeof body?.motivo === 'string' ? body.motivo : undefined;

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, tareas:tareas(org_id)')
      .eq('id', id)
      .maybeSingle();

    if (!subtarea) {
      return NextResponse.json(
        { success: false, error: 'Subtarea no encontrada' },
        { status: 404 },
      );
    }

    const rol = await PermisoService.obtenerRolEnOrganizacion(
      user.id,
      subtarea.tareas?.org_id || '',
    );

    if (rol !== 'CLIENTE') {
      return NextResponse.json(
        { success: false, error: 'Solo el cliente puede validar o rechazar bloques' },
        { status: 403 },
      );
    }

    const { tareaValidada } = await SubtareaMvpService.validarSubtarea(id, {
      id: user.id,
      rol,
      metodoPago,
      accion,
      motivo,
    });

    return NextResponse.json({ success: true, tareaValidada });
  } catch (error) {
    console.error('[VALIDAR_SUBTAREA] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 },
    );
  }
}
