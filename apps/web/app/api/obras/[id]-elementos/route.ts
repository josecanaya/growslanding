import { NextRequest, NextResponse } from 'next/server';
import { CrearElementoObraSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    // Verificar que la obra pertenece a la organización
    const obra = await prisma.obra.findFirst({
      where: {
        id: obraId,
        organizacionId,
      },
    });

    if (!obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    // Obtener elementos
    const elementos = await prisma.elementoObra.findMany({
      where: {
        obraId: obraId,
      },
      include: {
        plantillaElemento: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
        tareas: {
          select: {
            id: true,
            nombre: true,
            estado: true,
            socioId: true,
          },
        },
        _count: {
          select: {
            tareas: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: elementos,
    });

  } catch (error) {
    console.error('Error en GET /api/obras/[id]/elementos:', error);
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
    const { id: obraId } = await params;
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
      'crear_elemento'
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para crear elementos' },
        { status: 403 }
      );
    }

    // Verificar que la obra pertenece a la organización
    const obra = await prisma.obra.findFirst({
      where: {
        id: obraId,
        organizacionId,
      },
    });

    if (!obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    // Validar datos
    const validatedData = CrearElementoObraSchema.parse({
      ...body,
      obraId: obraId,
    });

    // Crear elemento
    const elemento = await prisma.elementoObra.create({
      data: validatedData,
      include: {
        plantillaElemento: {
          select: {
            id: true,
            nombre: true,
            categoria: true,
          },
        },
      },
    });

    // Crear evento
    await prisma.evento.create({
      data: {
        obraId: obraId,
        tipoEvento: 'ELEMENTO_AGREGADO',
        payloadJson: {
          elementoId: elemento.id,
          nombre: elemento.nombre,
          categoria: elemento.categoria,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: elemento,
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/obras/[id]/elementos:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
