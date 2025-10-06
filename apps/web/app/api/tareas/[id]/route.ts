import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../lib/services';
import { ActualizarTareaSchema } from '../../../../lib/schemas';
import { PermisosService } from '../../../../lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    // Obtener tarea con detalles
    const tarea = await prisma.tarea.findFirst({
      where: {
        id: id,
        elemento: {
          obra: {
            organizacionId,
          },
        },
      },
      include: {
        elemento: {
          include: {
            obra: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        socio: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        plantillaTarea: true,
        estados: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            actor: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
        presupuestos: {
          include: {
            socio: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        evidencias: {
          include: {
            subidoPor: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        pagos: {
          include: {
            aprobador: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tarea,
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
      'actualizar_tarea'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para actualizar tareas' },
        { status: 403 }
      );
    }

    // Validar datos
    const validatedData = ActualizarTareaSchema.parse(body);

    // Actualizar tarea
    const tarea = await TareaService.actualizarTarea(id, validatedData, organizacionId);

    return NextResponse.json({
      success: true,
      data: tarea,
    });

  } catch (error) {
    console.error('Error en PATCH /api/tareas/[id]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
