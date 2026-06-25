import { createServiceSupabaseClient } from '../supabase-server';

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PlanConfig {
  plan: PlanType;
  comisionMin: number; // Porcentaje mínimo (0-1)
  comisionMax: number; // Porcentaje máximo (0-1)
  comisionFija: number | null; // Porcentaje fijo si aplica (0-1), null si es variable
  limiteObras: number; // Número máximo de obras activas
  costoMensual: number; // USD por mes
  costoObraExtra: number | null; // USD por obra extra si aplica, null si no
}

/**
 * Configuraciones de los planes modernos
 */
const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  FREE: {
    plan: 'FREE',
    comisionMin: 0.10,
    comisionMax: 0.15,
    comisionFija: null,
    limiteObras: 5,
    costoMensual: 0,
    costoObraExtra: null,
  },
  PRO: {
    plan: 'PRO',
    comisionMin: 0.075,
    comisionMax: 0.075,
    comisionFija: 0.075,
    limiteObras: 10,
    costoMensual: 100,
    costoObraExtra: null,
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    comisionMin: 0.04,
    comisionMax: 0.04,
    comisionFija: 0.04,
    limiteObras: 20,
    costoMensual: 200,
    costoObraExtra: 20,
  },
};

/**
 * Obtiene la configuración completa del plan de una organización
 */
export async function obtenerConfigPlan(orgId: string): Promise<PlanConfig> {
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  // Fuente canónica: organizations. Fallback temporal para esquemas legacy.
  let { data: org, error } = await supabaseAny
    .from('organizations')
    .select('plan_actual')
    .eq('id', orgId)
    .maybeSingle();

  if (error && error.code === '42P01') {
    const legacy = await supabaseAny
      .from('organizaciones')
      .select('plan_actual')
      .eq('id', orgId)
      .maybeSingle();
    org = legacy.data;
    error = legacy.error;
  }

  if (error || !org) {
    console.warn(`[obtenerConfigPlan] Organización no encontrada: ${orgId}, usando FREE por defecto`);
    return PLAN_CONFIGS.FREE;
  }

  const planActual = (org.plan_actual || 'FREE').toUpperCase() as PlanType;

  // Validar que el plan sea válido
  if (!PLAN_CONFIGS[planActual]) {
    console.warn(`[obtenerConfigPlan] Plan inválido: ${planActual}, usando FREE por defecto`);
    return PLAN_CONFIGS.FREE;
  }

  return PLAN_CONFIGS[planActual];
}

export function calcularPorcentajePlan(
  planConfig: PlanConfig,
  options?: { reputacion?: number; ofertaDemanda?: number },
): number {
  if (planConfig.comisionFija !== null) {
    return planConfig.comisionFija;
  }

  const reputacion = clamp01(options?.reputacion ?? 0.5);
  const oferta = clamp01(options?.ofertaDemanda ?? 0.5);
  const factor = (reputacion + oferta) / 2;
  return planConfig.comisionMin + (planConfig.comisionMax - planConfig.comisionMin) * factor;
}

/**
 * Calcula la comisión según el plan y el monto.
 */
export function calcularComision(
  monto: number,
  planConfig: PlanConfig,
  options?: { reputacion?: number; ofertaDemanda?: number },
): number {
  const porcentaje = calcularPorcentajePlan(planConfig, options);
  return monto * porcentaje;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Valida si una organización puede crear más obras
 */
export async function validarLimiteObras(orgId: string): Promise<{
  puedeCrear: boolean;
  obrasActivas: number;
  limiteObras: number;
  mensaje?: string;
}> {
  const planConfig = await obtenerConfigPlan(orgId);
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const { count, error } = await supabaseAny
    .from('obras')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('estado', 'ACTIVA');

  if (error) {
    console.error('[validarLimiteObras] Error contando obras:', error);
    return {
      puedeCrear: true,
      obrasActivas: 0,
      limiteObras: planConfig.limiteObras,
    };
  }

  const obrasActivas = count || 0;

  return {
    puedeCrear: true,
    obrasActivas,
    limiteObras: planConfig.limiteObras,
  };
}

/**
 * Obtiene el costo de obras extras para ENTERPRISE
 */
export async function obtenerCostoObrasExtras(orgId: string): Promise<{
  tieneExtras: boolean;
  cantidadExtras: number;
  costoTotal: number;
}> {
  const planConfig = await obtenerConfigPlan(orgId);

  if (planConfig.plan !== 'ENTERPRISE' || planConfig.costoObraExtra === null) {
    return {
      tieneExtras: false,
      cantidadExtras: 0,
      costoTotal: 0,
    };
  }

  const validacion = await validarLimiteObras(orgId);
  const cantidadExtras = Math.max(0, validacion.obrasActivas - planConfig.limiteObras);

  return {
    tieneExtras: cantidadExtras > 0,
    cantidadExtras,
    costoTotal: cantidadExtras * planConfig.costoObraExtra,
  };
}

















