// ?? DEPRECATED ? No usar. Reemplazado por servicios Supabase.
import { PrismaClient } from '@prisma/client';

type PlanSuscripcion = 'STARTER' | 'PRO' | 'ENTERPRISE';

const prisma: any = new PrismaClient();

const PLAN_LIMITS: Record<PlanSuscripcion, { obras: number; socios: number }> = {
  STARTER: { obras: 2, socios: 5 },
  PRO: { obras: 10, socios: 25 },
  ENTERPRISE: { obras: Number.MAX_SAFE_INTEGER, socios: Number.MAX_SAFE_INTEGER },
};

type LimiteSuscripcion = {
  plan: PlanSuscripcion;
  obrasMax: number;
  sociosMax: number;
};

async function obtenerOrganizacion(orgId: string) {
  return prisma.organizacion.findUnique({
    where: { id: orgId },
    include: { suscripcion: true },
  });
}

function resolverLimites(
  plan: PlanSuscripcion,
  obrasMax?: number | null,
  sociosMax?: number | null,
): LimiteSuscripcion {
  const defaults = PLAN_LIMITS[plan];
  return {
    plan,
    obrasMax: obrasMax ?? defaults.obras,
    sociosMax: sociosMax ?? defaults.socios,
  };
}

export async function obtenerLimitesSuscripcion(orgId: string): Promise<LimiteSuscripcion> {
  const org = await obtenerOrganizacion(orgId);
  if (!org) {
    throw new Error('Organización inexistente');
  }

  const plan = org.suscripcion?.plan ?? org.plan ?? 'STARTER';
  return resolverLimites(
    plan,
    org.suscripcion?.obrasMax ?? org.obrasMax ?? undefined,
    org.suscripcion?.sociosMax ?? org.sociosMax ?? undefined,
  );
}

export async function assertLimiteObras(orgId: string) {
  const limites = await obtenerLimitesSuscripcion(orgId);

  if (limites.obrasMax === Number.MAX_SAFE_INTEGER) {
    return;
  }

  const activas = await prisma.obra.count({
    where: {
      organizacionId: orgId,
      estado: 'ACTIVA',
    },
  });

  if (activas >= limites.obrasMax) {
    throw new Error('Su plan no permite más obras activas. Actualice su plan.');
  }
}
export class SuscripcionService {
  static async obtenerLimites(orgId: string) {
    return obtenerLimitesSuscripcion(orgId);
  }

  static async validarLimiteObras(orgId: string): Promise<boolean> {
    try {
      await assertLimiteObras(orgId);
      return true;
    } catch {
      return false;
    }
  }

  static async validarLimiteSocios(orgId: string): Promise<boolean> {
    const limites = await obtenerLimitesSuscripcion(orgId);
    if (limites.sociosMax === Number.MAX_SAFE_INTEGER) {
      return true;
    }

    const miembroDelegate = prisma.miembroOrganizacion;
    if (!miembroDelegate) {
      return true;
    }

    const activos = await miembroDelegate.count({
      where: {
        organizacionId: orgId,
        rol: 'SOCIO',
        activo: true,
      },
    });

    return activos < limites.sociosMax;
  }

  static async obtenerPlan(orgId: string) {
    const limites = await obtenerLimitesSuscripcion(orgId);
    return limites.plan;
  }

  static async tienePlanMinimo(orgId: string, planMinimo: PlanSuscripcion) {
    const planActual = await this.obtenerPlan(orgId);
    const ranking: Record<PlanSuscripcion, number> = {
      STARTER: 1,
      PRO: 2,
      ENTERPRISE: 3,
    };

    return ranking[planActual] >= ranking[planMinimo];
  }

  static async crearSuscripcion(data: {
    organizacionId: string;
    plan: PlanSuscripcion;
    obrasMax?: number | null;
    sociosMax?: number | null;
    fechaFin?: Date | null;
  }) {
    const limites = resolverLimites(
      data.plan,
      data.obrasMax ?? null,
      data.sociosMax ?? null,
    );

    const suscripcion = await prisma.suscripcion.upsert({
      where: { organizacionId: data.organizacionId },
      update: {
        plan: data.plan,
        obrasMax: data.obrasMax ?? limites.obrasMax,
        sociosMax: data.sociosMax ?? limites.sociosMax,
        fechaFin: data.fechaFin ?? null,
        estado: 'activa',
        activa: true,
      },
      create: {
        organizacionId: data.organizacionId,
        plan: data.plan,
        obrasMax: data.obrasMax ?? limites.obrasMax,
        sociosMax: data.sociosMax ?? limites.sociosMax,
        fechaFin: data.fechaFin ?? null,
        estado: 'activa',
        activa: true,
      },
    });

    await prisma.organizacion.update({
      where: { id: data.organizacionId },
      data: {
        plan: data.plan,
        obrasMax: limites.obrasMax,
        sociosMax: limites.sociosMax,
      },
    });

    return suscripcion;
  }

  static async obtenerEstadisticasUso(orgId: string) {
    const limites = await obtenerLimitesSuscripcion(orgId);

    const miembroDelegateStats = prisma.miembroOrganizacion;

    const [obrasActuales, sociosActuales] = await Promise.all([
      prisma.obra.count({
        where: {
          organizacionId: orgId,
          estado: { not: 'CANCELADA' },
        },
      }),
      miembroDelegateStats
        ? miembroDelegateStats.count({
            where: {
              organizacionId: orgId,
              rol: 'SOCIO',
              activo: true,
            },
          })
        : Promise.resolve(0),
    ]);

    const obrasMaximo = limites.obrasMax === Number.MAX_SAFE_INTEGER ? null : limites.obrasMax;
    const sociosMaximo = limites.sociosMax === Number.MAX_SAFE_INTEGER ? null : limites.sociosMax;

    return {
      plan: limites.plan,
      obras: {
        actuales: obrasActuales,
        maximo: obrasMaximo,
        porcentaje: obrasMaximo ? Math.round((obrasActuales / obrasMaximo) * 100) : 0,
        disponible: obrasMaximo ? obrasMaximo - obrasActuales : null,
      },
      socios: {
        actuales: sociosActuales,
        maximo: sociosMaximo,
        porcentaje: sociosMaximo ? Math.round((sociosActuales / sociosMaximo) * 100) : 0,
        disponible: sociosMaximo ? sociosMaximo - sociosActuales : null,
      },
    };
  }
}