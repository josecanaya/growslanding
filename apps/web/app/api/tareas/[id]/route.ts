import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { ActualizarTareaSchema } from '../../../../lib/schemas';
import { PermisoService } from '@/lib/services/permiso.service';
import { TareaMetadataService } from '@/lib/tareas';
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

    // Evidencias de bloque (MVP): filas en tareas_subtareas con evidencia_url / evidencia_cargada
    const { data: evidenciasSubtareas, error: evidenciasError } = await supabase
      .from('tareas_subtareas')
      .select(
        'id, tarea_id, estado, evidencia_url, evidencia_cargada, bloque_index, orden, fecha, validado_en_obra_at'
      )
      .eq('tarea_id', id)
      .order('orden', { ascending: true, nullsFirst: false });

    const evidencias = evidenciasError ? [] : evidenciasSubtareas ?? [];

    return NextResponse.json({
      success: true,
      data: {
        ...tarea,
        estados: estados || [],
        presupuestos: presupuestos || [],
        evidencias,
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

    if (body.estado !== undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            'El estado de la tarea no se actualiza por PATCH. Usá POST /api/tareas/[id]/transition o los comandos de bloque.',
        },
        { status: 400 },
      );
    }

    let metadataInput: Parameters<typeof TareaMetadataService.actualizarMetadata>[2] = {};

    const soloCuadrillaId =
      body.cuadrilla_id !== undefined &&
      Object.keys(body).filter((k) => k !== 'cuadrilla_id').length === 0;

    if (soloCuadrillaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'cuadrilla_id está obsoleto. Use el campo responsable para asignar tareas.',
        },
        { status: 400 },
      );
    }

    try {
      const validatedData = ActualizarTareaSchema.parse(body);
      if (validatedData.nombre !== undefined) metadataInput.title = validatedData.nombre;
      if (validatedData.descripcion !== undefined) {
        metadataInput.descripcion = validatedData.descripcion;
      }
      if (validatedData.responsable !== undefined) {
        metadataInput.responsable = validatedData.responsable;
      }
      if (validatedData.prioridad !== undefined) metadataInput.prioridad = validatedData.prioridad;
      if (validatedData.fecha_inicio_estimada !== undefined) {
        metadataInput.fecha_inicio_estimada = validatedData.fecha_inicio_estimada;
      }
      if (validatedData.fecha_fin_estimada !== undefined) {
        metadataInput.fecha_fin_estimada = validatedData.fecha_fin_estimada;
      }
      if (validatedData.fecha_inicio_real !== undefined) {
        metadataInput.fecha_inicio_real = validatedData.fecha_inicio_real;
      }
      if (validatedData.fecha_fin_real !== undefined) {
        metadataInput.fecha_fin_real = validatedData.fecha_fin_real;
      }
      if (validatedData.avance !== undefined) metadataInput.avance = validatedData.avance;
    } catch (schemaError: unknown) {
      console.error('[ERROR_VALIDACION_SCHEMA]', schemaError);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: schemaError instanceof Error ? schemaError.message : schemaError,
        },
        { status: 400 },
      );
    }

    try {
      const tarea = await TareaMetadataService.actualizarMetadata(
        id,
        organizacionId,
        metadataInput,
      );
      return NextResponse.json({ success: true, data: tarea });
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : 'Error al actualizar la tarea';
      const status = msg.includes('No hay cambios') ? 400 : 500;
      return NextResponse.json({ success: false, error: msg }, { status });
    }

  } catch (error: unknown) {
    console.error('[ERROR_PATCH_TAREAS]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 },
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? { stack: error.stack, name: error.name }
            : undefined,
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
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
