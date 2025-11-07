import { PrismaClient } from '@prisma/client';
import { tareasConstructivas } from '../../apps/web/lib/tareas-construccion';

const prisma = new PrismaClient();

export async function seedPlantillasTareas() {
  console.log('🌱 Iniciando seed de plantillas de tareas constructivas...');

  try {
    // Limpiar plantillas de tareas existentes
    await prisma.plantillaTarea.deleteMany({});

    let tareasCreadas = 0;

    for (const tarea of tareasConstructivas) {
      await prisma.plantillaTarea.create({
        data: {
          nombre: tarea.nombre,
          etapa: tarea.fase.toUpperCase() as 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES',
          unidad: tarea.unidad,
          coefOperativo: tarea.coef_operativo,
          duracionDefecto: Math.ceil(tarea.coef_operativo / 8), // Convertir a días (8 horas por día)
          descripcion: `Tarea constructiva: ${tarea.nombre}`,
        },
      });

      tareasCreadas++;
    }

    console.log(`✅ Seed completado: ${tareasCreadas} plantillas de tareas constructivas creadas`);

  } catch (error) {
    console.error('❌ Error en seed de plantillas de tareas:', error);
    throw error;
  }
}
