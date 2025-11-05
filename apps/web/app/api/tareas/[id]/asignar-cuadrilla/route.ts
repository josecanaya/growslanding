import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const AsignarCuadrillaSchema = z.object({
  cuadrilla_id: z.string().uuid('cuadrilla_id debe ser un UUID válido'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tareaId } = await params;
    const body = await request.json();
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Validar datos
    const validatedData = AsignarCuadrillaSchema.parse(body);
    const { cuadrilla_id } = validatedData;

    const supabase = createServiceSupabaseClient();

    // Verificar que la tarea existe y pertenece a la organización
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select('id, org_id, estado, cuadrilla_id')
      .eq('id', tareaId)
      .eq('org_id', organizacionId)
      .single();

    if (tareaError || !tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la cuadrilla existe y pertenece a la organización
    // Obtener también el encargado para actualizar el responsable
    const { data: cuadrilla, error: cuadrillaError } = await supabase
      .from('cuadrillas')
      .select('id, org_id, nombre, encargado, email_encargado, telefono_encargado')
      .eq('id', cuadrilla_id)
      .eq('org_id', organizacionId)
      .single();

    if (cuadrillaError || !cuadrilla) {
      console.error('[ERROR_ASIGNAR_CUADRILLA_CUADRILLA]', cuadrillaError);
      return NextResponse.json(
        { success: false, error: 'Cuadrilla no encontrada o no pertenece a la organización' },
        { status: 404 }
      );
    }

    // Determinar el responsable (email o teléfono del encargado)
    const responsable = cuadrilla.email_encargado || cuadrilla.telefono_encargado || cuadrilla.encargado || null;

    console.log('[ASIGNAR_CUADRILLA] Actualizando tarea:', {
      tareaId,
      cuadrilla_id,
      cuadrilla_nombre: cuadrilla.nombre,
      encargado: cuadrilla.encargado,
      responsable,
    });

    // Actualizar tarea con cuadrilla_id y responsable
    const updateData: any = {
      cuadrilla_id: cuadrilla_id,
      updated_at: new Date().toISOString(),
    };

    // Solo actualizar responsable si existe y no es null
    if (responsable) {
      updateData.responsable = responsable;
    }

    const { data: tareaActualizada, error: updateError } = await supabase
      .from('tareas')
      .update(updateData)
      .eq('id', tareaId)
      .eq('org_id', organizacionId)
      .select('id, title, descripcion, estado, cuadrilla_id, responsable, obra_id, elemento_id, updated_at')
      .single();

    if (updateError) {
      console.error('[ERROR_ASIGNAR_CUADRILLA_UPDATE]', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al asignar cuadrilla', details: updateError.message },
        { status: 500 }
      );
    }

    // Registrar en historial de estados (estado no cambia, solo asignación)
    const estadoActual = tarea.estado || 'pendiente';
    const { error: estadoError } = await supabase
      .from('tareas_estados')
      .insert({
        tarea_id: tareaId,
        estado_anterior: estadoActual,
        estado_nuevo: estadoActual, // No cambia el estado, solo la asignación
        actor_tipo: 'CLIENTE_TECNICO',
        actor_id: usuarioId,
        motivo: `Tarea asignada a cuadrilla: ${cuadrilla.nombre}`,
      });

    if (estadoError) {
      // No fallar si el historial falla, solo loguear
      console.warn('[WARNING_ASIGNAR_CUADRILLA_ESTADO]', estadoError);
    }

    return NextResponse.json({
      success: true,
      data: tareaActualizada,
      message: `Tarea asignada correctamente a la cuadrilla ${cuadrilla.nombre}`,
    });
  } catch (error) {
    console.error('[ERROR_ASIGNAR_CUADRILLA]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al asignar cuadrilla',
      },
      { status: 500 }
    );
  }
}

