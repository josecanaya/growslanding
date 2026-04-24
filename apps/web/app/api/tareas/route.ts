import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { CrearTareaSchema } from '../../../lib/schemas';
import { PermisoService } from '@/lib/services/permiso.service';
import type { Database } from '@/lib/types/supabase.gen';

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validar datos
    const validatedData = CrearTareaSchema.parse(body);

    const supabase = createServiceSupabaseClient();

    // Verificar que el elemento pertenece a la organización
    const { data: elemento, error: elementoError } = await supabase
      .from('elementos')
      .select('id, obra_id, obras!inner(org_id)')
      .eq('id', validatedData.elementoId)
      .single();

    if (elementoError || !elemento) {
      return NextResponse.json(
        { success: false, error: 'Elemento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la obra pertenece a una organización válida
    const obra = (elemento as any).obras;
    if (!obra?.org_id) {
      return NextResponse.json(
        { success: false, error: 'Elemento sin organización asociada' },
        { status: 400 }
      );
    }

    const organizacionId = obra.org_id as string;
    const rol = await PermisoService.obtenerRolEnOrganizacion(
      user.id,
      organizacionId,
    );
    if (rol !== 'CLIENTE') {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para crear tareas en esta organización' },
        { status: 403 }
      );
    }

    // Crear tarea en Supabase
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .insert({
        obra_id: elemento.obra_id,
        elemento_id: validatedData.elementoId,
        title: validatedData.nombre,
        descripcion: validatedData.descripcion || null,
        estado: 'pendiente',
        prioridad: 'MEDIA',
        avance: 0,
        bloques_planificados: validatedData.bloques ?? 0,
        fecha_inicio_estimada: null, // Se puede agregar lógica para calcular desde duracionEstimada si es necesario
        fecha_fin_estimada: validatedData.duracionEstimada ? new Date(Date.now() + validatedData.duracionEstimada * 24 * 60 * 60 * 1000).toISOString() : null,
      } as any)
      .select(`
        id,
        title,
        descripcion,
        bloques_planificados,
        estado,
        responsable,
        prioridad,
        avance,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        elemento_id,
        obra_id,
        created_at,
        updated_at,
        elemento:elementos(id, nombre, categoria, subcategoria)
      `)
      .single();

    if (tareaError) {
      console.error('Error creando tarea:', tareaError);
      return NextResponse.json(
        { success: false, error: tareaError.message },
        { status: 500 }
      );
    }

    // Crear registro de estado inicial en tareas_estados
    const { error: estadoError } = await supabase
      .from('tareas_estados' as any)
      .insert({
        tarea_id: tarea.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        actor_tipo: 'CLIENTE_TECNICO',
        actor_id: user.id,
        motivo: 'Tarea creada',
      });

    if (estadoError) {
      console.error('Error creando estado inicial (no crítico):', estadoError);
      // No fallamos la creación de la tarea si falla el estado
    }

    return NextResponse.json({
      success: true,
      data: tarea,
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/tareas:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('org_id');
    const obraId = searchParams.get('obra_id');
    const elementoId = searchParams.get('elemento_id');
    const estado = searchParams.get('estado');

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: orgClienteRows } = await supabaseAny
      .from('organizations')
      .select('id')
      .eq('user_id', user.id);
    const { data: orgSocioRows } = await supabaseAny
      .from('socios')
      .select('org_id')
      .eq('user_id', user.id);

    const allowedOrgIds = new Set<string>([
      ...(orgClienteRows ?? []).map((org: { id: string }) => org.id),
      ...(orgSocioRows ?? [])
        .map((socio: { org_id: string | null }) => socio.org_id)
        .filter((orgId: string | null): orgId is string => Boolean(orgId)),
    ]);

    if (allowedOrgIds.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }

    const organizacionId = orgIdParam || Array.from(allowedOrgIds)[0];
    if (!allowedOrgIds.has(organizacionId)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para la organización solicitada' },
        { status: 403 }
      );
    }

    // Construir query
    let query = supabase
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
      .eq('org_id', organizacionId);

    // Filtros opcionales
    if (obraId) {
      query = query.eq('obra_id', obraId);
    }

    if (elementoId) {
      query = query.eq('elemento_id', elementoId);
    }

    if (estado) {
      query = query.eq('estado', estado as 'pendiente' | 'en_progreso' | 'para_validar' | 'validada' | 'rechazada');
    }

    // Ordenar por fecha de creación descendente
    query = query.order('created_at', { ascending: false });

    const { data: tareas, error: tareasError } = await query;

    if (tareasError) {
      console.error('Error obteniendo tareas:', tareasError);
      return NextResponse.json(
        { success: false, error: tareasError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tareas || [],
    });

  } catch (error) {
    console.error('Error en GET /api/tareas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
