import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../../lib/services';
import { CambiarEstadoTareaSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Cambiar estado de la tarea
    const tarea = await TareaService.cambiarEstadoTarea(validatedData, usuarioId, organizacionId);

    return NextResponse.json({
      success: true,
      data: tarea,
    });

  } catch (error) {
    console.error('Error en POST /api/tareas/[id]/estado:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
