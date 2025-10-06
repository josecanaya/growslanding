import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../../lib/services';
import { CrearEvidenciaSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';

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

    // Obtener evidencias de la tarea
    const evidencias = await prisma.tareaEvidencia.findMany({
      where: {
        tareaId: id,
        tarea: {
          elemento: {
            obra: {
              organizacionId,
            },
          },
        },
      },
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
    });

    return NextResponse.json({
      success: true,
      data: evidencias,
    });

  } catch (error) {
    console.error('Error en GET /api/tareas/[id]/evidencias:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

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

    // Verificar permisos
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      'subir_evidencia'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para subir evidencias' },
        { status: 403 }
      );
    }

    // Validar datos
    const validatedData = CrearEvidenciaSchema.parse({
      ...body,
      tareaId: id,
    });

    // Crear evidencia
    const evidencia = await TareaService.crearEvidencia(validatedData, usuarioId, organizacionId);

    return NextResponse.json({
      success: true,
      data: evidencia,
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/tareas/[id]/evidencias:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
