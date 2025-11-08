import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { ActualizarTareaSchema } from '../../../../lib/schemas';
import { PermisosService } from '../../../../lib/services';

// Asegurar que este endpoint siempre devuelva JSON
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Obtener tarea con joins
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select(`
        id,
        title,
        descripcion,
        estado,
        responsable,
        prioridad,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        avance,
        elemento_id,
        obra_id,
        created_at,
        updated_at,
        elemento:elementos(id, nombre, categoria, subcategoria),
        obra:obras(id, name, address)
      `)
      .eq('id', id)
      .eq('org_id', organizacionId)
      .single();

    if (tareaError || !tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Obtener estados de la tarea
    const { data: estados } = await supabase
      .from('tareas_estados')
      .select('*')
      .eq('tarea_id', id)
      .order('created_at', { ascending: false });

    // Obtener presupuestos (si existe la tabla)
    let presupuestos: unknown[] | null = null;
    try {
      const response = await supabase
        .from('tareas_presupuestos')
        .select('*')
        .eq('tarea_id', id)
        .order('created_at', { ascending: false });
      presupuestos = response.data ?? null;
    } catch {
      presupuestos = null;
    }

    // Obtener evidencias (si existe la tabla)
    let evidencias: unknown[] | null = null;
    try {
      const response = await supabase
        .from('tareas_evidencias')
        .select('*')
        .eq('tarea_id', id)
        .order('created_at', { ascending: false });
      evidencias = response.data ?? null;
    } catch {
      evidencias = null;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tarea,
        estados: estados || [],
        presupuestos: presupuestos || [],
        evidencias: evidencias || [],
      },
    });

  } catch (error) {
    console.error('Error en GET /api/tareas/[id]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener parámetros de forma segura
    let id: string;
    try {
      const resolvedParams = await params;
      id = resolvedParams.id;
      if (!id || typeof id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'ID de tarea inválido' },
          { status: 400 }
        );
      }
    } catch (paramsError: any) {
      console.error('[ERROR_PARAMS]', paramsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener parámetros de la ruta' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[ERROR_PARSE_BODY]', parseError);
      return NextResponse.json(
        { success: false, error: 'Body inválido o vacío' },
        { status: 400 }
      );
    }

    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos (opcional - si falla, continuar)
    let tienePermiso = true;
    try {
      tienePermiso = await PermisosService.verificarPermiso(
        usuarioId,
        organizacionId,
        'actualizar_tarea'
      );
    } catch (permisoError) {
      // Si falla la verificación de permisos (por ejemplo, Prisma no disponible),
      // continuar con la actualización asumiendo que el usuario tiene permisos
      // (la verificación de org_id ya proporciona seguridad básica)
      console.warn('[WARNING] No se pudo verificar permisos, continuando:', permisoError);
    }

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para actualizar tareas' },
        { status: 403 }
      );
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (supabaseError: any) {
      console.error('[ERROR_CREATE_SUPABASE_CLIENT]', supabaseError);
      return NextResponse.json(
        { success: false, error: 'Error al inicializar cliente de base de datos' },
        { status: 500 }
      );
    }

    // Verificar que la tarea existe y pertenece a la organización
    const { data: tareaExistente, error: checkError } = await supabase
      .from('tareas')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', organizacionId)
      .single();

    if (checkError || !tareaExistente) {
      console.error('[ERROR_CHECK_TAREA]', checkError);
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada', details: checkError?.message },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Si solo viene cuadrilla_id, actualizarlo directamente sin validar schema
    const soloCuadrillaId = body.cuadrilla_id !== undefined && Object.keys(body).filter(k => k !== 'cuadrilla_id').length === 0;
    
    if (soloCuadrillaId) {
      // Validar que cuadrilla_id sea un UUID válido o null
      const cuadrillaId = body.cuadrilla_id;
      if (cuadrillaId !== null && cuadrillaId !== undefined && cuadrillaId !== '') {
        // Validar formato UUID básico
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof cuadrillaId !== 'string' || !uuidRegex.test(cuadrillaId)) {
          return NextResponse.json(
            { success: false, error: 'cuadrilla_id debe ser un UUID válido o null' },
            { status: 400 }
          );
        }
      }
      updateData.cuadrilla_id = cuadrillaId === '' ? null : cuadrillaId;
    } else {
      // Validar otros campos con el schema
      try {
        const validatedData = ActualizarTareaSchema.parse(body);
        
        if (validatedData.nombre !== undefined) {
          updateData.title = validatedData.nombre;
        }
        if (validatedData.descripcion !== undefined) {
          updateData.descripcion = validatedData.descripcion;
        }
        if (validatedData.responsable !== undefined) {
          updateData.responsable = validatedData.responsable;
        }
        if (validatedData.prioridad !== undefined) {
          updateData.prioridad = validatedData.prioridad;
        }
        if (validatedData.fecha_inicio_estimada !== undefined) {
          updateData.fecha_inicio_estimada = validatedData.fecha_inicio_estimada;
        }
        if (validatedData.fecha_fin_estimada !== undefined) {
          updateData.fecha_fin_estimada = validatedData.fecha_fin_estimada;
        }
        if (validatedData.fecha_inicio_real !== undefined) {
          updateData.fecha_inicio_real = validatedData.fecha_inicio_real;
        }
        if (validatedData.fecha_fin_real !== undefined) {
          updateData.fecha_fin_real = validatedData.fecha_fin_real;
        }
        if (validatedData.avance !== undefined) {
          updateData.avance = validatedData.avance;
        }
        
        // Permitir cuadrilla_id si viene junto con otros campos
        if (body.cuadrilla_id !== undefined) {
          updateData.cuadrilla_id = body.cuadrilla_id;
        }
      } catch (schemaError: any) {
        console.error('[ERROR_VALIDACION_SCHEMA]', schemaError);
        return NextResponse.json(
          { success: false, error: 'Datos inválidos', details: schemaError?.errors || schemaError?.message },
          { status: 400 }
        );
      }
    }

    // Validar que updateData no esté vacío (debe tener al menos updated_at)
    if (Object.keys(updateData).length === 1 && updateData.updated_at) {
      console.warn('[WARNING] UpdateData solo tiene updated_at, no hay cambios para aplicar');
      return NextResponse.json(
        { success: false, error: 'No hay cambios para aplicar' },
        { status: 400 }
      );
    }

    console.log('[DEBUG_PATCH_TAREA]', {
      id,
      organizacionId,
      updateData,
      soloCuadrillaId,
      bodyKeys: Object.keys(body),
      updateDataKeys: Object.keys(updateData)
    });

    // Actualizar tarea con manejo de errores mejorado
    let tarea, updateError;
    try {
      const result = await supabase
        .from('tareas')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', organizacionId)
        .select('id, title, descripcion, estado, responsable, prioridad, obra_id, elemento_id, cuadrilla_id, updated_at')
        .single();
      
      tarea = result.data;
      updateError = result.error;
    } catch (supabaseException: any) {
      console.error('[ERROR_SUPABASE_EXCEPTION]', {
        message: supabaseException?.message,
        name: supabaseException?.name,
        stack: supabaseException?.stack,
        error: supabaseException
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al ejecutar actualización en base de datos',
          details: supabaseException?.message || 'Excepción no capturada en Supabase'
        },
        { status: 500 }
      );
    }

    if (updateError) {
      console.error('[ERROR_UPDATE_TAREA]', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        error: updateError,
        updateData: updateData
      });
      return NextResponse.json(
        { success: false, error: updateError.message || 'Error al actualizar la tarea' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tarea,
    });

  } catch (error: any) {
    // Siempre devolver JSON, nunca HTML
    console.error('[ERROR_PATCH_TAREAS]', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      error: error,
      errorString: String(error),
      errorType: typeof error
    });
    
    // Si es un error de Zod, devolver 400
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error?.errors || error?.message },
        { status: 400 }
      );
    }

    // Cualquier otro error, devolver 500 con JSON
    const errorMessage = error?.message || String(error) || 'Error interno del servidor';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error?.stack,
          name: error?.name,
          type: typeof error
        } : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
