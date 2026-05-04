import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Subconjunto usado al recalcular progreso (tareas directas o de grupo). */
type RoadmapTareaProgreso = { done: boolean; estado: string };

// POST - Crear nueva tarea
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.texto) {
      return NextResponse.json(
        { error: 'El texto de la tarea es requerido' },
        { status: 400 }
      );
    }

    const nuevaTarea = await prisma.roadmapTarea.create({
      data: {
        texto: data.texto,
        descripcion: data.descripcion,
        estado: data.estado || 'pending',
        done: data.done || false,
        estimateHrs: data.estimateHrs,
        responsable: data.responsable,
        objetivoId: data.objetivoId,
        grupoId: data.grupoId,
      },
    });

    // Recalcular progreso del objetivo si está asociado
    if (data.objetivoId) {
      await recalcularProgresoObjetivo(data.objetivoId);
    }

    return NextResponse.json(nuevaTarea);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar tarea existente
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID de la tarea requerido' },
        { status: 400 }
      );
    }

    const tareaActualizada = await prisma.roadmapTarea.update({
      where: { id: data.id },
      data: {
        texto: data.texto,
        descripcion: data.descripcion,
        estado: data.estado,
        done: data.done,
        estimateHrs: data.estimateHrs,
        responsable: data.responsable,
      },
    });

    // Recalcular progreso del objetivo
    if (tareaActualizada.objetivoId) {
      await recalcularProgresoObjetivo(tareaActualizada.objetivoId);
    }

    return NextResponse.json(tareaActualizada);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la tarea requerido' },
        { status: 400 }
      );
    }

    const tarea = await prisma.roadmapTarea.findUnique({
      where: { id },
    });

    await prisma.roadmapTarea.delete({
      where: { id },
    });

    // Recalcular progreso del objetivo
    if (tarea?.objetivoId) {
      await recalcularProgresoObjetivo(tarea.objetivoId);
    }

    return NextResponse.json({ ok: true, message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}

// Función helper para recalcular el progreso de un objetivo
async function recalcularProgresoObjetivo(objetivoId: string) {
  const objetivo = await prisma.roadmapObjetivo.findUnique({
    where: { id: objetivoId },
    include: {
      tareas: true,
      gruposTareas: {
        include: {
          tareas: true,
        },
      },
    },
  });

  if (!objetivo) return;

  // Obtener todas las tareas (directas + de grupos)
  const todasLasTareas = [
    ...(objetivo.tareas || []),
    ...(objetivo.gruposTareas?.flatMap((g: { tareas: RoadmapTareaProgreso[] }) => g.tareas) || []),
  ];

  const total = todasLasTareas.length;
  const completadas = todasLasTareas.filter((t: RoadmapTareaProgreso) => t.done || t.estado === 'done').length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  // Determinar estado automáticamente
  let estado = 'pending';
  if (progreso === 100) {
    estado = 'done';
  } else if (progreso > 0) {
    estado = 'inProgress';
  }

  await prisma.roadmapObjetivo.update({
    where: { id: objetivoId },
    data: { progreso, estado },
  });
}


