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

    console.log('[ASIGNAR_CUADRILLA] Iniciando asignación:', {
      tareaId,
      cuadrilla_id: body.cuadrilla_id,
      organizacionId,
      usuarioId,
    });

    if (!organizacionId || !usuarioId) {
      console.error('[ASIGNAR_CUADRILLA] Faltan headers:', { organizacionId, usuarioId });
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Validar datos
    let validatedData;
    try {
      validatedData = AsignarCuadrillaSchema.parse(body);
    } catch (zodError) {
      console.error('[ASIGNAR_CUADRILLA] Error de validación Zod:', zodError);
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: zodError instanceof z.ZodError ? zodError.errors : String(zodError) },
        { status: 400 }
      );
    }
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
      console.error('[ASIGNAR_CUADRILLA] Error al buscar tarea:', {
        tareaError,
        tareaId,
        organizacionId,
      });
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada', details: tareaError?.message },
        { status: 404 }
      );
    }

    console.log('[ASIGNAR_CUADRILLA] Tarea encontrada:', { tareaId: tarea.id, estado: tarea.estado });

    // Verificar que la cuadrilla (socio) existe y pertenece a la organización
    // Las cuadrillas ahora vienen de la tabla socios
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, telefono, email')
      .eq('id', cuadrilla_id)
      .eq('org_id', organizacionId)
      .single();

    if (socioError || !socio) {
      console.error('[ASIGNAR_CUADRILLA] Error al buscar socio:', {
        socioError,
        cuadrilla_id,
        organizacionId,
        errorCode: socioError?.code,
        errorMessage: socioError?.message,
        errorDetails: socioError?.details,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cuadrilla no encontrada o no pertenece a la organización',
          details: socioError?.message || 'No se encontró el socio en la organización',
        },
        { status: 404 }
      );
    }

    console.log('[ASIGNAR_CUADRILLA] Socio encontrado:', { 
      socioId: socio.id, 
      nombre: socio.nombre,
      org_id: socio.org_id,
    });

    // Determinar el responsable (email o teléfono del socio)
    const responsable = socio.email || socio.telefono || socio.nombre || null;
    
    // Mapear a formato cuadrilla para compatibilidad
    const cuadrilla = {
      id: socio.id,
      nombre: socio.nombre || 'Sin nombre',
      encargado: socio.nombre || 'Sin encargado',
      email_encargado: socio.email || null,
      telefono_encargado: socio.telefono || null,
    };

    console.log('[ASIGNAR_CUADRILLA] Actualizando tarea:', {
      tareaId,
      cuadrilla_id,
      cuadrilla_nombre: cuadrilla.nombre,
      encargado: cuadrilla.encargado,
      responsable,
    });

    // Actualizar tarea
    // NOTA: cuadrilla_id tiene una foreign key a la tabla cuadrillas que ya no existe
    // Necesitas eliminar la constraint en Supabase: ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_cuadrilla_id_fkey;
    // Por ahora, intentamos actualizar cuadrilla_id. Si falla, solo actualizamos responsable
    const updateData: any = {};

    // Intentar actualizar cuadrilla_id (fallará si la FK constraint está activa)
    updateData.cuadrilla_id = cuadrilla_id;

    // Actualizar responsable
    if (responsable) {
      updateData.responsable = responsable;
    }

    console.log('[ASIGNAR_CUADRILLA] Datos a actualizar:', updateData);

    const { data: tareaActualizada, error: updateError } = await supabase
      .from('tareas')
      .update(updateData)
      .eq('id', tareaId)
      .eq('org_id', organizacionId)
      .select('id, title, descripcion, estado, cuadrilla_id, responsable, obra_id, elemento_id')
      .single();

    if (updateError) {
      console.error('[ASIGNAR_CUADRILLA] Error al actualizar tarea:', {
        updateError,
        errorCode: updateError.code,
        errorMessage: updateError.message,
        errorDetails: updateError.details,
        errorHint: updateError.hint,
        tareaId,
        organizacionId,
        updateData,
      });
      
      // Si el error es por foreign key constraint, dar un mensaje más claro
      let errorMessage = updateError.message || updateError.details || 'Error desconocido al actualizar la tarea';
      let errorDetails = updateError.details;
      
      if (updateError.message?.includes('foreign key constraint') || updateError.message?.includes('tareas_cuadrilla_id_fkey')) {
        errorMessage = 'La tabla tareas tiene una restricción de clave foránea que apunta a la tabla cuadrillas (que ya no existe). Necesitas eliminar o modificar la constraint en Supabase.';
        errorDetails = 'Ejecuta este SQL en Supabase: ALTER TABLE tareas DROP CONSTRAINT IF EXISTS tareas_cuadrilla_id_fkey;';
        
        // Intentar actualizar solo responsable si cuadrilla_id falla
        console.log('[ASIGNAR_CUADRILLA] Intentando actualizar solo responsable...');
        const { data: tareaActualizadaSoloResponsable, error: errorSoloResponsable } = await supabase
          .from('tareas')
          .update({ responsable: responsable || null })
          .eq('id', tareaId)
          .eq('org_id', organizacionId)
          .select('id, title, descripcion, estado, cuadrilla_id, responsable, obra_id, elemento_id')
          .single();
        
        if (!errorSoloResponsable && tareaActualizadaSoloResponsable) {
          console.log('[ASIGNAR_CUADRILLA] Actualizado solo responsable (cuadrilla_id no se pudo actualizar por FK constraint)');
          // Continuar con el flujo normal pero con un warning
          return NextResponse.json({
            success: true,
            data: tareaActualizadaSoloResponsable,
            message: `Tarea asignada a ${cuadrilla.nombre} (solo responsable actualizado. Necesitas eliminar la FK constraint para actualizar cuadrilla_id)`,
            warning: 'La constraint tareas_cuadrilla_id_fkey debe ser eliminada en Supabase para actualizar cuadrilla_id',
          });
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al asignar cuadrilla', 
          details: errorMessage,
          hint: errorDetails,
        },
        { status: 500 }
      );
    }

    console.log('[ASIGNAR_CUADRILLA] Tarea actualizada exitosamente:', {
      tareaId: tareaActualizada?.id,
      cuadrilla_id: tareaActualizada?.cuadrilla_id,
    });

    // Registrar en historial de estados (estado no cambia, solo asignación)
    const estadoActual = tarea.estado || 'pendiente';
    const { error: estadoError } = await supabase
      .from('tareas_estados' as any)
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

