import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_NAMES = ['ADMIN', 'CLIENTE_TECNICO', 'SOCIO', 'LIDER'] as const;

async function seedRoles(): Promise<void> {
  const client = prisma as unknown as Record<
    string,
    {
      createMany?: (args: { data: Array<Record<string, unknown>>; skipDuplicates?: boolean }) => Promise<unknown>;
    }
  >;

  const payloadNombre = ROLE_NAMES.map((nombre) => ({ nombre }));
  const payloadName = ROLE_NAMES.map((name) => ({ name }));

  const candidates = [
    { model: 'roles', data: payloadNombre },
    { model: 'roles', data: payloadName },
    { model: 'rol', data: payloadNombre },
    { model: 'rol', data: payloadName },
  ];

  for (const candidate of candidates) {
    const model = client[candidate.model];
    if (model && typeof model.createMany === 'function') {
      try {
        await model.createMany({ data: candidate.data, skipDuplicates: true });
        console.log(`✅ Roles base creados vía prisma.${candidate.model}`);
        return;
      } catch (error) {
        console.warn(
          `   • Falló prisma.${candidate.model}.createMany(): ${(error as Error).message}. Probando alternativa...`,
        );
      }
    }
  }

  const nombreValues = ROLE_NAMES.map((name) => `('${name.replace(/'/g, "''")}')`).join(', ');

  try {
    await prisma.$executeRawUnsafe(
      `insert into public.roles (nombre)
       values ${nombreValues}
       on conflict (nombre) do nothing`,
    );
    console.log('✅ Roles base creados vía SQL en public.roles (columna nombre)');
    return;
  } catch (error) {
    console.warn(`   • Falló inserción por columna nombre: ${(error as Error).message}`);
  }

  try {
    await prisma.$executeRaw(
      Prisma.sql`insert into public.roles (name)
                 values ${Prisma.join(ROLE_NAMES.map((role) => Prisma.sql`(${role})`))}
                 on conflict (name) do nothing`,
    );
    console.log('✅ Roles base creados vía SQL en public.roles (columna name)');
  } catch (error) {
    throw new Error(
      `No se pudieron insertar los roles base. Revisa el nombre del modelo/tabla en tu esquema. Detalle: ${
        (error as Error).message
      }`,
    );
  }
}

async function main(): Promise<void> {
  console.log('🌱 Seed mínima para entorno vacío...');
  await seedRoles();
  console.log('Seed listo.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
