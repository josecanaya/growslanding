import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { CambiarEstadoTareaSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';

// Mapeo de estados del schema a estados de Supabase
const mapearEstadoASupabase = (estado: string): string => {
  const estadoLower = estado.toLowerCase();
  switch (estadoLower) {
    case 'propuesta':
      return 'pendiente';
    case 'presupuestada':
      return 'pendiente';
    case 'asignada':
      return 'pendiente';
    case 'en_ejecucion':
    case 'en ejecución':
      return 'en_progreso';
    case 'terminada':
      return 'finalizado';
    case 'validada':
      return 'validado';
    default:
      return estadoLower;
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validatedData = CambiarEstadoTareaSchema.parse({
      ...body,
      tareaId: id,
    });

    // Verificar permisos según el estado
    let accionPermitida = '';
    switch (validatedData.estadoNuevo) {
      case 'PRESUPUESTADA':
        accionPermitida = 'crear_presupuesto';
        break;
      case 'ASIGNADA':
        accionPermitida = 'asignar_socio';
        break;
      case 'EN_EJECUCION':
        accionPermitida = 'iniciar_tarea';
        break;
      case 'TERMINADA':
        accionPermitida = 'finalizar_tarea';
        break;
      case 'VALIDADA':
        accionPermitida = 'validar_tarea';
        break;
      default:
        accionPermitida = 'actualizar_tarea';
    }

    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      accionPermitida
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: `No tiene permisos para ${accionPermitida}` },
        { status: 403 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Obtener tarea actual para guardar estado anterior
    const { data: tareaAnterior, error: tareaError } = await supabase
      .from('tareas')
      .select('id, estado, org_id')
      .eq('id', id)
      .eq('org_id', organizacionId)
      .single();

    if (tareaError || !tareaAnterior) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Mapear estado nuevo a formato Supabase
    const estadoNuevoSupabase = mapearEstadoASupabase(validatedData.estadoNuevo);
    const estadoAnteriorSupabase = tareaAnterior.estado
      ? mapearEstadoASupabase(tareaAnterior.estado)
      : null;

    // Actualizar estado de la tarea
    const { data: tareaActualizada, error: updateError } = await supabase
      .from('tareas')
      .update({
        estado: estadoNuevoSupabase,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', organizacionId)
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
      .single();

    if (updateError) {
      console.error('Error actualizando estado de tarea:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Insertar registro en tareas_estados
    const { error: estadoInsertError } = await supabase
      .from('tareas_estados')
      .insert({
        tarea_id: id,
        estado_anterior: estadoAnteriorSupabase,
        estado_nuevo: estadoNuevoSupabase,
        actor_tipo: body.actorRol || 'CLIENTE_TECNICO',
        actor_id: usuarioId,
        motivo:
          body.motivo ||
          `Cambio de estado de ${estadoAnteriorSupabase ?? 'SIN_ESTADO'} a ${estadoNuevoSupabase}`,
      });

    if (estadoInsertError) {
      console.error('Error creando registro de estado (no crítico):', estadoInsertError);
      // No fallamos si falla el insert del estado, pero logueamos
    }

    return NextResponse.json({
      success: true,
      data: tareaActualizada,
    });

  } catch (error) {
    console.error('Error en POST /api/tareas/[id]/estado:', error);
    
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
