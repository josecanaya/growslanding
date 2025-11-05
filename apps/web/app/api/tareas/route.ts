import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { CrearTareaSchema } from '../../../lib/schemas';
import { PermisosService } from '../../../lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      'crear_tarea'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para crear tareas' },
        { status: 403 }
      );
    }

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

    // Verificar que la obra pertenece a la organización
    const obra = (elemento as any).obras;
    if (!obra || obra.org_id !== organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Elemento no pertenece a la organización' },
        { status: 403 }
      );
    }

    // Crear tarea en Supabase
    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .insert({
        org_id: organizacionId,
        obra_id: elemento.obra_id,
        elemento_id: validatedData.elementoId,
        title: validatedData.nombre,
        descripcion: validatedData.descripcion || null,
        estado: 'pendiente',
        prioridad: 'MEDIA',
        avance: 0,
        fecha_inicio_estimada: null, // Se puede agregar lógica para calcular desde duracionEstimada si es necesario
        fecha_fin_estimada: validatedData.duracionEstimada ? new Date(Date.now() + validatedData.duracionEstimada * 24 * 60 * 60 * 1000).toISOString() : null,
      })
      .select(`
        id,
        title,
        descripcion,
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
      .from('tareas_estados')
      .insert({
        tarea_id: tarea.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        actor_tipo: 'CLIENTE_TECNICO',
        actor_id: usuarioId,
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
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const obraId = searchParams.get('obra_id');
    const elementoId = searchParams.get('elemento_id');
    const estado = searchParams.get('estado');

    const supabase = createServiceSupabaseClient();

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
      query = query.eq('estado', estado);
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