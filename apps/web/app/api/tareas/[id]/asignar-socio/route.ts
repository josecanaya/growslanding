import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../../lib/services';
import { AsignarSocioSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';

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

    // Verificar permisos
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      'asignar_socio'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para asignar socios' },
        { status: 403 }
      );
    }

    // Validar datos
    const validatedData = AsignarSocioSchema.parse({
      ...body,
      tareaId: id,
    });

    // Asignar socio
    const tarea = await TareaService.asignarSocio(validatedData, organizacionId);

    return NextResponse.json({
      success: true,
      data: tarea,
    });

  } catch (error) {
    console.error('Error en POST /api/tareas/[id]/asignar-socio:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
