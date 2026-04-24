import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { ActualizarTareaSchema } from '../../../../lib/schemas';
import { PermisoService } from '@/lib/services/permiso.service';
import type { Database } from '@/lib/types/supabase.gen';

// Asegurar que este endpoint siempre devuelva JSON
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await resolveAllowedOrgIds(supabaseAny, user.id);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }

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
      .in('org_id', allowedOrgIds)
      .single();

    if (tareaError || !tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Obtener estados de la tarea
    const { data: estados } = await supabase
      .from('tareas_estados' as any)
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
        .from('tareas_evidencias' as any)
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
        { status: 401 }
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

    const supabaseAny = supabase as any;
    const allowedOrgIds = await resolveAllowedOrgIds(supabaseAny, user.id);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe y pertenece a una organización accesible
    const { data: tareaExistente, error: checkError } = await supabase
      .from('tareas')
      .select('id, org_id')
      .eq('id', id)
      .in('org_id', allowedOrgIds)
      .single();

    if (checkError || !tareaExistente) {
      console.error('[ERROR_CHECK_TAREA]', checkError);
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada', details: checkError?.message },
        { status: 404 }
      );
    }

    const organizacionId = tareaExistente.org_id;
    const rol = await PermisoService.obtenerRolEnOrganizacion(
      user.id,
      organizacionId,
    );
    if (rol !== 'CLIENTE') {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para actualizar tareas' },
        { status: 403 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // ⚠️ OBSOLETO: cuadrilla_id ya no se usa para lógica de tareas
    // Se mantiene el campo en la BD por compatibilidad pero siempre debe ser null
    // Las tareas ahora se asignan directamente por responsable (email)
    
    // Si solo viene cuadrilla_id, ignorarlo (obsoleto)
    const soloCuadrillaId = body.cuadrilla_id !== undefined && Object.keys(body).filter(k => k !== 'cuadrilla_id').length === 0;
    
    if (soloCuadrillaId) {
      // No hacer nada, cuadrilla_id está obsoleto
      console.warn('[PATCH_TAREA] Intento de actualizar cuadrilla_id (obsoleto), ignorado');
      return NextResponse.json(
        { success: false, error: 'cuadrilla_id está obsoleto. Use el campo responsable para asignar tareas.' },
        { status: 400 }
      );
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
        
        // ⚠️ OBSOLETO: No permitir actualizar cuadrilla_id
        // Las tareas se asignan por responsable (email), no por cuadrilla
        if (body.cuadrilla_id !== undefined) {
          console.warn('[PATCH_TAREA] Intento de actualizar cuadrilla_id (obsoleto), ignorado');
          // No actualizar cuadrilla_id, siempre debe ser null
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
        .select('id, title, descripcion, estado, responsable, prioridad, obra_id, elemento_id, updated_at')
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

async function resolveAllowedOrgIds(supabaseAny: any, userId: string): Promise<string[]> {
  const [orgClienteRows, orgSocioRows] = await Promise.all([
    supabaseAny.from('organizations').select('id').eq('user_id', userId),
    supabaseAny.from('socios').select('org_id').eq('user_id', userId),
  ]);

  const orgIds = new Set<string>([
    ...((orgClienteRows.data ?? []) as Array<{ id: string }>).map((o) => o.id),
    ...((orgSocioRows.data ?? []) as Array<{ org_id: string | null }>)
      .map((s) => s.org_id)
      .filter((orgId): orgId is string => Boolean(orgId)),
  ]);

  return Array.from(orgIds);
}
