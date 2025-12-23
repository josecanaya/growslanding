import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { PermisoService } from '@/lib/services/permiso.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
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

    const orgId = subtarea.tareas?.org_id;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo determinar la organización' },
        { status: 400 },
      );
    }

    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);

    if (rol !== 'SOCIO') {
      return NextResponse.json(
        { success: false, error: 'Solo el socio puede iniciar bloques' },
        { status: 403 },
      );
    }

    // Obtener socio_id del usuario
    const { data: socio } = await supabaseAny
      .from('socios')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    await SubtareaMvpService.iniciarBloque(id, {
      id: user.id,
      rol: 'SOCIO',
      socioId: socio?.id || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INICIAR_BLOQUE] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno';
    
    // Mapear errores específicos a códigos
    let errorCode = 'UNKNOWN_ERROR';
    let statusCode = 500;
    
    if (errorMessage.includes('dos bloques en ejecucion') || errorMessage.includes('dos bloques en progreso')) {
      errorCode = 'SOCIO_TIENE_2_BLOQUES_EN_PROGRESO';
      statusCode = 400;
    } else if (errorMessage.includes('SOCIO_SUSPENDIDO') || errorMessage.includes('suspendido')) {
      errorCode = 'SOCIO_SUSPENDIDO';
      statusCode = 403;
    } else if (errorMessage.includes('FORBIDDEN')) {
      errorCode = 'FORBIDDEN_ACTION';
      statusCode = 403;
    } else if (errorMessage.includes('Solo se pueden iniciar')) {
      errorCode = 'TRANSICIÓN_NO_PERMITIDA';
      statusCode = 400;
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorCode,
      },
      { status: statusCode },
    );
  }
}










