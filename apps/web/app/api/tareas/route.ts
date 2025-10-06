import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../lib/services';
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

    // Crear tarea
    const tarea = await TareaService.crearTarea(validatedData, organizacionId);

    return NextResponse.json({
      success: true,
      data: tarea,
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/tareas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}