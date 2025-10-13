import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Obtener todos los objetivos con sus tareas
export async function GET() {
  try {
    const objetivos = await prisma.roadmapObjetivo.findMany({
      include: {
        tareas: true,
        gruposTareas: {
          include: {
            tareas: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(objetivos);
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    return NextResponse.json(
      { error: 'Error al obtener objetivos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo objetivo
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const nuevoObjetivo = await prisma.roadmapObjetivo.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad || 'MEDIA',
        estado: data.estado || 'pending',
        progreso: data.progreso || 0,
        startWeek: data.startWeek,
        endWeek: data.endWeek,
        targetWeeks: data.targetWeeks,
        dueDate: data.dueDate,
        collapsed: data.collapsed || false,
      },
      include: {
        tareas: true,
        gruposTareas: {
          include: {
            tareas: true,
          },
        },
      },
    });

    return NextResponse.json(nuevoObjetivo);
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    return NextResponse.json(
      { error: 'Error al crear objetivo' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar objetivo existente
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID del objetivo requerido' },
        { status: 400 }
      );
    }

    const objetivoActualizado = await prisma.roadmapObjetivo.update({
      where: { id: data.id },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        estado: data.estado,
        progreso: data.progreso,
        startWeek: data.startWeek,
        endWeek: data.endWeek,
        targetWeeks: data.targetWeeks,
        dueDate: data.dueDate,
        collapsed: data.collapsed,
      },
      include: {
        tareas: true,
        gruposTareas: {
          include: {
            tareas: true,
          },
        },
      },
    });

    return NextResponse.json(objetivoActualizado);
  } catch (error) {
    console.error('Error al actualizar objetivo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar objetivo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar objetivo
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del objetivo requerido' },
        { status: 400 }
      );
    }

    await prisma.roadmapObjetivo.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: 'Objetivo eliminado' });
  } catch (error) {
    console.error('Error al eliminar objetivo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar objetivo' },
      { status: 500 }
    );
  }
}


