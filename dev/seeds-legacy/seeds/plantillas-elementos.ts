import { PrismaClient } from '@prisma/client';
import { elementos } from '../../apps/web/lib/elementos-vivienda';

const prisma = new PrismaClient();

export async function seedPlantillasElementos() {
  console.log('🌱 Iniciando seed de plantillas de elementos...');

  try {
    // Limpiar plantillas existentes
    await prisma.plantillaTarea.deleteMany({});
    await prisma.plantillaElemento.deleteMany({});

    let elementosCreados = 0;
    let tareasCreadas = 0;

    for (const elemento of elementos) {
      // Crear plantilla de elemento
      const plantillaElemento = await prisma.plantillaElemento.create({
        data: {
          nombre: elemento.categoria,
          categoria: elemento.categoria,
          version: '1.0',
          descripcion: `Plantilla para elementos de ${elemento.categoria}`,
        },
      });

      elementosCreados++;

      // Crear plantillas de tareas para cada tipo de elemento
      for (const tipo of elemento.tipos) {
        // Crear tareas para estructura
        for (const tareaId of tipo.fases.estructura) {
          await prisma.plantillaTarea.create({
            data: {
              plantillaElementoId: plantillaElemento.id,
              nombre: `Tarea de estructura para ${tipo.nombre}`,
              etapa: 'ESTRUCTURA',
              unidad: 'unidad',
              coefOperativo: 1.0,
              duracionDefecto: 1,
              descripcion: `Tarea de estructura relacionada con ${tipo.nombre}`,
            },
          });
          tareasCreadas++;
        }

        // Crear tareas para obra gris
        for (const tareaId of tipo.fases.obra_gris) {
          await prisma.plantillaTarea.create({
            data: {
              plantillaElementoId: plantillaElemento.id,
              nombre: `Tarea de obra gris para ${tipo.nombre}`,
              etapa: 'OBRA_GRIS',
              unidad: 'unidad',
              coefOperativo: 1.0,
              duracionDefecto: 1,
              descripcion: `Tarea de obra gris relacionada con ${tipo.nombre}`,
            },
          });
          tareasCreadas++;
        }

        // Crear tareas para terminaciones
        for (const tareaId of tipo.fases.terminaciones) {
          await prisma.plantillaTarea.create({
            data: {
              plantillaElementoId: plantillaElemento.id,
              nombre: `Tarea de terminaciones para ${tipo.nombre}`,
              etapa: 'TERMINACIONES',
              unidad: 'unidad',
              coefOperativo: 1.0,
              duracionDefecto: 1,
              descripcion: `Tarea de terminaciones relacionada con ${tipo.nombre}`,
            },
          });
          tareasCreadas++;
        }
      }
    }

    console.log(`✅ Seed completado: ${elementosCreados} plantillas de elementos y ${tareasCreadas} plantillas de tareas creadas`);

  } catch (error) {
    console.error('❌ Error en seed de plantillas de elementos:', error);
    throw error;
  }
}
