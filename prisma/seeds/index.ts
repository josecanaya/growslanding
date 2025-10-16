import { PrismaClient } from '@prisma/client';
import { seedPlantillasElementos } from './plantillas-elementos';
import { seedPlantillasTareas } from './plantillas-tareas';
import { seedSuscripciones } from './suscripciones';
import { seedUsuarios } from './usuarios';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando proceso de seed completo...');

  try {
    // Limpiar base de datos
    console.log('🧹 Limpiando base de datos...');
    await prisma.evento.deleteMany({});
    await prisma.tareaLayout.deleteMany({});
    await prisma.tareaCache.deleteMany({});
    await prisma.obraCache.deleteMany({});
    await prisma.pago.deleteMany({});
    await prisma.tareaEvidencia.deleteMany({});
    await prisma.tareaPresupuesto.deleteMany({});
    await prisma.tareaEstado.deleteMany({});
    await prisma.tareaPrecedencia.deleteMany({});
    await prisma.tarea.deleteMany({});
    await prisma.elementoFase.deleteMany({});
    await prisma.elementoObra.deleteMany({});
    await prisma.obra.deleteMany({});
    await prisma.miembroOrganizacion.deleteMany({});
    await prisma.suscripcion.deleteMany({});
    await prisma.organizacion.deleteMany({});
    await prisma.usuario.deleteMany({});

    // Ejecutar seeds en orden
    await seedSuscripciones();
    await seedUsuarios();
    await seedPlantillasTareas();
    await seedPlantillasElementos();

    console.log('🎉 Seed completo finalizado exitosamente!');

  } catch (error) {
    console.error('💥 Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

export { main as seedDatabase };
