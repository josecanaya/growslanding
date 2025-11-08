import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as PrismaClient & { miembroOrganizacion: any };

async function main() {
  console.log('🌱 Creando datos de prueba...');

  // Crear organización de prueba
  const organizacion = await prisma.organizacion.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      nombre: 'Organización de Prueba',
      email: 'test@organizacion.com',
      telefono: '+54 11 1234-5678',
      direccion: 'Av. Test 123, Buenos Aires',
      onboardingCompleted: true,
    },
  });

  console.log('✅ Organización creada:', organizacion.nombre);

  // Crear usuario de prueba
  const usuario = await prisma.usuario.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      nombre: 'Usuario de Prueba',
      email: 'usuario@test.com',
      telefono: '+54 11 9876-5432',
      activo: true,
    },
  });

  console.log('✅ Usuario creado:', usuario.nombre);

  // Crear membresía
  await prisma.miembroOrganizacion.upsert({
    where: {
      usuarioId_organizacionId: {
        usuarioId: usuario.id,
        organizacionId: organizacion.id,
      },
    },
    update: {},
    create: {
      usuarioId: usuario.id,
      organizacionId: organizacion.id,
      rol: 'ADMIN',
      activo: true,
    },
  });

  console.log('✅ Membresía creada');

  // Crear suscripción
  await prisma.suscripcion.upsert({
    where: { organizacionId: organizacion.id },
    update: {},
    create: {
      organizacionId: organizacion.id,
      plan: 'PREMIUM',
      estado: 'ACTIVA',
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
    },
  });

  console.log('✅ Suscripción creada');

  console.log('🎉 Datos de prueba creados exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
