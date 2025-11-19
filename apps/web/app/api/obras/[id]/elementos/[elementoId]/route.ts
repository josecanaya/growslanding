import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/obras/[id]/elementos/[elementoId]
 * Actualiza un elemento existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; elementoId: string }> }
) {
  try {
    const { id: obraId, elementoId } = await params;
    const body = await request.json();

    if (!obraId || !elementoId) {
      return NextResponse.json(
        { success: false, error: 'obraId y elementoId son requeridos' },
        { status: 400 }
      );
    }

    // Validar sesión
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar cliente de servicio
    const supabase = createServiceSupabaseClient();

    // Verificar que la obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError || !obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el elemento existe y pertenece a la obra
    const { data: elementoExistente, error: elementoError } = await supabase
      .from('elementos')
      .select('id, obra_id')
      .eq('id', elementoId)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (elementoError || !elementoExistente) {
      return NextResponse.json(
        { success: false, error: 'Elemento no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};

    if (body.cantidad !== undefined) updateData.cantidad = body.cantidad;
    if (body.unidad !== undefined) updateData.unidad = body.unidad;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.costo_unitario !== undefined) updateData.costo_unitario = body.costo_unitario;
    if (body.duracion_estimada !== undefined) updateData.duracion_estimada = body.duracion_estimada;

    // Actualizar elemento
    const { data: elementoActualizado, error: updateError } = await supabase
      .from('elementos')
      .update(updateData)
      .eq('id', elementoId)
      .select()
      .single();

    if (updateError) {
      console.error('[PUT_ELEMENTO] Error actualizando:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar elemento', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: elementoActualizado,
    });
  } catch (error) {
    console.error('[PUT_ELEMENTO] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

