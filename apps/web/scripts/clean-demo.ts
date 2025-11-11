// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type DeleteTarget = {
  label: string;
  modelCandidates: string[];
  tableCandidates: string[];
};

const DELETE_TARGETS: DeleteTarget[] = [
  {
    label: 'eventos',
    modelCandidates: ['eventos', 'evento'],
    tableCandidates: ['eventos', 'public.eventos'],
  },
  {
    label: 'notificaciones',
    modelCandidates: ['notificaciones', 'notificacion'],
    tableCandidates: ['notificaciones', 'public.notificaciones'],
  },
  {
    label: 'tareas',
    modelCandidates: ['tareas', 'tarea'],
    tableCandidates: ['tareas', 'public.tareas'],
  },
  {
    label: 'obras',
    modelCandidates: ['obras', 'obra'],
    tableCandidates: ['obras', 'public.obras'],
  },
  {
    label: 'socios',
    modelCandidates: ['socios', 'socio'],
    tableCandidates: ['socios', 'public.socios'],
  },
  {
    label: 'presupuestos',
    modelCandidates: ['presupuestos', 'presupuesto', 'tareaPresupuesto', 'tareaPresupuestos'],
    tableCandidates: ['presupuestos', 'public.presupuestos', 'tarea_presupuestos', 'public.tarea_presupuestos'],
  },
];

const BASE_ORG_UUID = '00000000-0000-0000-0000-000000000001';
const BASE_ORG_NUMERIC_ID = 1;
const BASE_ORG_NAME = 'Trigal Constructora';
const BASE_ORG_SLUG = 'trigal';
const BASE_ORG_PLAN = 'dev';

async function deleteUsingModel(modelName: string): Promise<boolean> {
  const client = prisma as unknown as Record<string, { deleteMany?: () => Promise<unknown> }>;
  const model = client[modelName];

  if (!model || typeof model.deleteMany !== 'function') {
    return false;
  }

  await model.deleteMany();
  return true;
}

async function deleteUsingTables(tableNames: string[]): Promise<boolean> {
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      return true;
    } catch (error) {
      // try next candidate
    }
  }

  return false;
}

async function cleanDemoData(): Promise<void> {
  console.log('🧹 Limpiando datos de ejemplo...');

  for (const target of DELETE_TARGETS) {
    let cleaned = false;

    for (const model of target.modelCandidates) {
      if (await deleteUsingModel(model)) {
        console.log(`   • ${target.label}: deleteMany() via prisma.${model}`);
        cleaned = true;
        break;
      }
    }

    if (!cleaned) {
      cleaned = await deleteUsingTables(target.tableCandidates);
      if (cleaned) {
        console.log(`   • ${target.label}: TRUNCATE via SQL (${target.tableCandidates[0]})`);
      } else {
        console.warn(`   • ${target.label}: no se pudo limpiar (verifica el nombre de la tabla/modelo).`);
      }
    }
  }

  console.log('✅ Tablas limpias (o marcadas para revisión).');
}

async function restoreBaseOrganization(): Promise<void> {
  console.log('🏗️ Restaurando organización base...');
  const client = prisma as unknown as Record<
    string,
    {
      upsert?: (args: {
        where: Record<string, unknown>;
        update: Record<string, unknown>;
        create: Record<string, unknown>;
      }) => Promise<unknown>;
    }
  >;

  const organizationModels = [
    {
      model: 'organization',
      args: {
        where: { id: BASE_ORG_UUID },
        update: { name: BASE_ORG_NAME },
        create: { id: BASE_ORG_UUID, name: BASE_ORG_NAME },
      },
      successMessage: 'Organización restaurada vía prisma.organization',
    },
    {
      model: 'organizacion',
      args: {
        where: { id: BASE_ORG_UUID },
        update: { nombre: BASE_ORG_NAME },
        create: { id: BASE_ORG_UUID, nombre: BASE_ORG_NAME },
      },
      successMessage: 'Organización restaurada vía prisma.organizacion',
    },
    {
      model: 'organizaciones',
      args: {
        where: { id: BASE_ORG_NUMERIC_ID },
        update: { nombre: BASE_ORG_NAME, slug: BASE_ORG_SLUG, plan: BASE_ORG_PLAN },
        create: { id: BASE_ORG_NUMERIC_ID, nombre: BASE_ORG_NAME, slug: BASE_ORG_SLUG, plan: BASE_ORG_PLAN },
      },
      successMessage: 'Organización restaurada vía prisma.organizaciones',
    },
  ];

  for (const candidate of organizationModels) {
    const model = client[candidate.model];
    if (model && typeof model.upsert === 'function') {
      try {
        await model.upsert(candidate.args);
        console.log(`✅ ${candidate.successMessage}`);
        return;
      } catch (error) {
        console.warn(`   • Falló prisma.${candidate.model}.upsert(): ${(error as Error).message}`);
      }
    }
  }

  try {
    await prisma.$executeRaw(
      Prisma.sql`insert into public.organizations (id, name)
                 values (${BASE_ORG_UUID}, ${BASE_ORG_NAME})
                 on conflict (id) do update set name = excluded.name`,
    );
    console.log('✅ Organización restaurada vía SQL en public.organizations');
    return;
  } catch (error) {
    console.warn(`   • Falló inserción en public.organizations: ${(error as Error).message}`);
  }

  try {
    const nombre = BASE_ORG_NAME.replace(/'/g, "''");
    const slug = BASE_ORG_SLUG.replace(/'/g, "''");
    const plan = BASE_ORG_PLAN.replace(/'/g, "''");

    await prisma.$executeRawUnsafe(
      `insert into public.organizaciones (id, nombre, slug, plan)
       values (${BASE_ORG_NUMERIC_ID}, '${nombre}', '${slug}', '${plan}')
       on conflict (id) do update
         set nombre = excluded.nombre,
             slug = excluded.slug,
             plan = excluded.plan`,
    );
    console.log('✅ Organización restaurada vía SQL en public.organizaciones');
    return;
  } catch (error) {
    console.warn(`   • Falló inserción en public.organizaciones: ${(error as Error).message}`);
  }

  throw new Error('No se pudo restaurar la organización base. Ajusta el script para que coincida con tu esquema.');
}

async function main(): Promise<void> {
  try {
    await cleanDemoData();
    await restoreBaseOrganization();
    console.log('✨ Limpieza completa.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
