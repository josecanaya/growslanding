import { NextRequest, NextResponse } from 'next/server';
import initialData from '@/data/roadmap.initial.json';
import { prisma } from '@/lib/prisma';

// Función para calcular el progreso real basado en tareas completadas
function calculateRealProgress(obj: any): number {
  // Si el estado es COMPLETO, devolver 100%
  if (obj.status === 'COMPLETO') {
    return 100;
  }

  if (!obj.taskGroups || obj.taskGroups.length === 0) {
    return obj.status === 'EN_CURSO' ? 50 : 0;
  }

  const totalTasks = obj.taskGroups.reduce((sum: number, group: any) => 
    sum + (group.tasks?.length || 0), 0
  );
  
  if (totalTasks === 0) return 0;
  
  const completedTasks = obj.taskGroups.reduce((sum: number, group: any) => 
    sum + (group.tasks?.filter((task: any) => task.done).length || 0), 0
  );
  
  return Math.round((completedTasks / totalTasks) * 100);
}

// GET - Obtener todos los objetivos con sus tareas
export async function GET() {
  try {
    // Usar los datos originales del roadmap
    const roadmapData = initialData as {
      projects: Array<{
        projectName: string;
        updatedAt?: string;
        objectives: any[];
      }>;
    };

    const growsProject = roadmapData.projects.find(p => p.projectName === 'GROWS');
    if (!growsProject) {
      throw new Error('Proyecto GROWS no encontrado');
    }

    // Convertir los objetivos del formato inicial al formato esperado por la API
    const objetivos = growsProject.objectives.map((obj: any) => ({
      id: obj.id,
      titulo: obj.title,
      descripcion: obj.description,
      prioridad: obj.priority,
      estado: obj.status,
      progreso: calculateRealProgress(obj),
      startWeek: obj.startWeek || null,
      endWeek: obj.endWeek || null,
      targetWeeks: obj.targetWeeks || null,
      dueDate: obj.dueDate || null,
      collapsed: false,
      createdAt: growsProject.updatedAt,
      updatedAt: growsProject.updatedAt,
      tareas: obj.taskGroups?.flatMap((group: any) => 
        group.tasks?.map((task: any) => ({
          id: task.id,
          texto: task.text,
          descripcion: task.description || '',
          estado: task.done ? 'completed' : 'pending',
          done: task.done,
          estimateHrs: task.estimateHrs,
          responsable: task.owner,
          objetivoId: obj.id,
          grupoId: group.id,
          createdAt: growsProject.updatedAt,
          updatedAt: growsProject.updatedAt,
        })) || []
      ) || [],
      gruposTareas: obj.taskGroups?.map((group: any) => ({
        id: group.id,
        titulo: group.title,
        descripcion: group.description,
        tareas: group.tasks?.map((task: any) => ({
          id: task.id,
          texto: task.text,
          descripcion: task.description || '',
          estado: task.done ? 'completed' : 'pending',
          done: task.done,
          estimateHrs: task.estimateHrs,
          responsable: task.owner,
          objetivoId: obj.id,
          grupoId: group.id,
          createdAt: growsProject.updatedAt,
          updatedAt: growsProject.updatedAt,
        })) || [],
      })) || [],
    }));

    return NextResponse.json(objetivos);
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    const details =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: 'Error al obtener objetivos', details },
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
        // startWeek: data.startWeek,     // Temporalmente comentado
        // endWeek: data.endWeek,         // Temporalmente comentado
        // targetWeeks: data.targetWeeks, // Temporalmente comentado
        // dueDate: data.dueDate,        // Temporalmente comentado
        collapsed: data.collapsed || false,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        estado: true,
        progreso: true,
        collapsed: true,
        createdAt: true,
        updatedAt: true,
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
        // startWeek: data.startWeek,     // Temporalmente comentado
        // endWeek: data.endWeek,         // Temporalmente comentado
        // targetWeeks: data.targetWeeks, // Temporalmente comentado
        // dueDate: data.dueDate,        // Temporalmente comentado
        collapsed: data.collapsed,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        prioridad: true,
        estado: true,
        progreso: true,
        collapsed: true,
        createdAt: true,
        updatedAt: true,
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


