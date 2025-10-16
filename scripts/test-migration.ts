import { PrismaClient, EstadoTarea, TipoActor } from '@prisma/client';

const prisma = new PrismaClient();

async function testMigration() {
  try {
    console.log('🧪 Iniciando test de migración...');

    // 1. Crear cliente técnico de prueba
    const cliente = await prisma.clienteTecnico.create({
      data: {
        email: 'test@grows.local',
        nombre: 'Cliente Test',
        telefono: '123456789',
      },
    });

    // 2. Crear obra con elementos y tareas
    const obra = await prisma.obra.create({
      data: {
        nombre: 'Casa Test',
        localizacion: 'Test City',
        tipoObra: 'NUEVA',
        fechaInicio: new Date(),
        clienteTecnicoId: cliente.id,
      },
    });

    // 3. Crear elementos
    const elementoEstructura = await prisma.elementoObra.create({
      data: {
        nombre: 'Fundaciones',
        categoria: 'Estructura',
        etapa: 'ESTRUCTURA',
        duracion: 5,
        obraId: obra.id,
      },
    });

    const elementoTerminaciones = await prisma.elementoObra.create({
      data: {
        nombre: 'Pintura',
        categoria: 'Terminaciones',
        etapa: 'TERMINACIONES',
        duracion: 3,
        obraId: obra.id,
      },
    });

    // 4. Crear tareas
    const tarea1 = await prisma.tarea.create({
      data: {
        nombre: 'Excavación',
        descripcion: 'Excavar cimientos',
        duracion: 2,
        etapa: 'ESTRUCTURA',
        elementoId: elementoEstructura.id,
        obraId: obra.id,
      },
    });

    const tarea2 = await prisma.tarea.create({
      data: {
        nombre: 'Hormigón',
        descripcion: 'Vaciado de hormigón',
        duracion: 3,
        etapa: 'ESTRUCTURA',
        precedencias: [tarea1.id],
        elementoId: elementoEstructura.id,
        obraId: obra.id,
      },
    });

    const tarea3 = await prisma.tarea.create({
      data: {
        nombre: 'Pintura Interior',
        descripcion: 'Pintar paredes interiores',
        duracion: 3,
        etapa: 'TERMINACIONES',
        elementoId: elementoTerminaciones.id,
        obraId: obra.id,
      },
    });

    // 5. Crear estados iniciales
    await prisma.tareaEstado.createMany({
      data: [
        {
          tareaId: tarea1.id,
          estadoNuevo: 'RECIBIDO',
          actorTipo: 'SISTEMA',
          comentario: 'Tarea creada',
        },
        {
          tareaId: tarea2.id,
          estadoNuevo: 'RECIBIDO',
          actorTipo: 'SISTEMA',
          comentario: 'Tarea creada',
        },
        {
          tareaId: tarea3.id,
          estadoNuevo: 'RECIBIDO',
          actorTipo: 'SISTEMA',
          comentario: 'Tarea creada',
        },
      ],
    });

    // 6. Simular cambio de estados hasta APROBADO
    const estados = ['PRESUPUESTADO', 'PENDIENTE', 'EN_EJECUCION', 'EJECUTADO', 'APROBADO'];
    
    for (const estado of estados) {
      await prisma.tarea.update({
        where: { id: tarea1.id },
        data: { estado: estado as EstadoTarea },
      });

      await prisma.tareaEstado.create({
        data: {
          tareaId: tarea1.id,
          estadoAnterior: estado === 'PRESUPUESTADO' ? 'RECIBIDO' : (estados[estados.indexOf(estado) - 1] as EstadoTarea),
          estadoNuevo: estado as EstadoTarea,
          actorTipo: estado === 'APROBADO' ? 'CLIENTE_TECNICO' : 'SOCIO_CONSTRUCTOR',
          actorId: estado === 'APROBADO' ? cliente.id : 'socio-test',
          comentario: `Estado cambiado a ${estado}`,
        },
      });
    }

    // 7. Verificar que se creó el pago
    const pagos = await prisma.pago.findMany({
      where: { tareaId: tarea1.id },
    });

    console.log('✅ Test completado exitosamente!');
    console.log(`📊 Tareas creadas: 3`);
    console.log(`📊 Estados en historial: ${await prisma.tareaEstado.count()}`);
    console.log(`📊 Pagos creados: ${pagos.length}`);

    // 8. Verificar panel por etapa
    const tareasEstructura = await prisma.tarea.findMany({
      where: { obraId: obra.id, etapa: 'ESTRUCTURA' },
    });

    const tareasTerminaciones = await prisma.tarea.findMany({
      where: { obraId: obra.id, etapa: 'TERMINACIONES' },
    });

    console.log(`📊 Tareas en ESTRUCTURA: ${tareasEstructura.length}`);
    console.log(`📊 Tareas en TERMINACIONES: ${tareasTerminaciones.length}`);

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();

