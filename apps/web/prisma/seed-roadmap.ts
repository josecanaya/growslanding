import { PrismaClient } from '@prisma/client';
import initialData from '../data/roadmap.initial.json';

const prisma = new PrismaClient();

type RoadmapTareaProgreso = { done: boolean; estado: string };

async function main() {
  console.log('🌱 Sembrando datos del roadmap...');

  // Buscar el proyecto GROWS
  const growsProject = (initialData as any).projects.find(
    (p: any) => p.projectName === 'GROWS'
  );

  if (!growsProject) {
    console.log('❌ No se encontró el proyecto GROWS en roadmap.initial.json');
    return;
  }

  console.log(`📦 Procesando ${growsProject.objectives.length} objetivos...`);

  for (const objective of growsProject.objectives) {
    console.log(`  📌 Creando objetivo: ${objective.title}`);

    // Crear el objetivo
    const objetivoCreado = await prisma.roadmapObjetivo.create({
      data: {
        id: objective.id,
        titulo: objective.title,
        descripcion: objective.description,
        prioridad: objective.priority || 'MEDIA',
        estado: mapStatus(objective.status),
        startWeek: objective.startWeek,
        endWeek: objective.endWeek,
        targetWeeks: objective.targetWeeks,
        dueDate: objective.dueDate,
        collapsed: objective.collapsed || false,
        progreso: 0, // Se calculará después
      },
    });

    // Crear tareas directas (sin grupo)
    if (objective.tasks && objective.tasks.length > 0) {
      console.log(`    ✓ ${objective.tasks.length} tareas directas`);
      for (const task of objective.tasks) {
        await prisma.roadmapTarea.create({
          data: {
            id: task.id,
            texto: task.text,
            descripcion: task.description,
            estado: task.status || 'pending',
            done: task.done || false,
            estimateHrs: task.estimateHrs,
            responsable: task.owner,
            objetivoId: objetivoCreado.id,
          },
        });
      }
    }

    // Crear grupos de tareas
    if (objective.taskGroups && objective.taskGroups.length > 0) {
      console.log(`    ✓ ${objective.taskGroups.length} grupos de tareas`);
      for (const group of objective.taskGroups) {
        const grupoCreado = await prisma.roadmapGrupoTareas.create({
          data: {
            id: group.id,
            titulo: group.title,
            descripcion: group.description,
            objetivoId: objetivoCreado.id,
          },
        });

        // Crear tareas del grupo
        if (group.tasks && group.tasks.length > 0) {
          for (const task of group.tasks) {
            await prisma.roadmapTarea.create({
              data: {
                id: task.id,
                texto: task.text,
                descripcion: task.description,
                estado: task.status || 'pending',
                done: task.done || false,
                estimateHrs: task.estimateHrs,
                responsable: task.owner,
                grupoId: grupoCreado.id,
              },
            });
          }
        }
      }
    }

    // Calcular progreso del objetivo
    const todasLasTareas = await prisma.roadmapTarea.findMany({
      where: {
        OR: [
          { objetivoId: objetivoCreado.id },
          { grupo: { objetivoId: objetivoCreado.id } },
        ],
      },
    });

    const completadas = todasLasTareas.filter(
      (t: RoadmapTareaProgreso) => t.done || t.estado === 'done'
    ).length;
    const progreso =
      todasLasTareas.length > 0
        ? Math.round((completadas / todasLasTareas.length) * 100)
        : 0;

    await prisma.roadmapObjetivo.update({
      where: { id: objetivoCreado.id },
      data: { progreso },
    });

    console.log(`    ✅ Objetivo creado con ${todasLasTareas.length} tareas (${progreso}% completo)`);
  }

  console.log('✅ Seed del roadmap completado!');
}

function mapStatus(status?: string): string {
  if (!status) return 'pending';
  
  switch (status.toUpperCase()) {
    case 'COMPLETO':
      return 'done';
    case 'EN_CURSO':
      return 'inProgress';
    case 'PENDIENTE':
      return 'pending';
    default:
      return 'pending';
  }
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar datos del roadmap:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

