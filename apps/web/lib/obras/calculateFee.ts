/**
 * Cálculo de importe de activación de obra por m² cubiertos y plan de pago.
 * Contrato estable para integraciones futuras (checkout / backend).
 */

export const PRECIO_ACTIVACION_OBRA_USD_POR_M2 = 8 as const;

export type PlanPagoActivacion = 'contado' | '3' | '6' | '12';

/** -10 = descuento pago único; 0 = sin ajuste en cuotas */
export type PctPlanActivacion = -10 | 0;

export type ResultadoActivacionObraCalculo = {
  subtotalUsd: number;
  totalUsd: number;
  installmentsCount: number;
  installmentUsd: number | null;
  pctAjusteNumerico: PctPlanActivacion;
  ajustePctLabel: string;
  /** Negativo: ahorro vs subtotal | 0: sin recargo ni descuento */
  ahorroORecargoUsd: number;
  plan: PlanPagoActivacion;
};

const MULTIPLICADORES: Record<
  PlanPagoActivacion,
  { mult: number; pct: PctPlanActivacion; label: string }
> = {
  contado: { mult: 0.9, pct: -10, label: 'Pago único -10%' },
  '3': { mult: 1, pct: 0, label: 'Sin recargo' },
  '6': { mult: 1, pct: 0, label: 'Sin recargo' },
  '12': { mult: 1, pct: 0, label: 'Sin recargo' },
};

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

/** @see ResultadoActivacionObraCalculo */
export function calculateFee(m2: number, paymentPlan: PlanPagoActivacion): ResultadoActivacionObraCalculo {
  const safeM2 = Math.max(0, Number.isFinite(m2) ? m2 : 0);
  const subtotalUsd = roundUsd(safeM2 * PRECIO_ACTIVACION_OBRA_USD_POR_M2);
  const cfg = MULTIPLICADORES[paymentPlan];
  const totalUsd = roundUsd(subtotalUsd * cfg.mult);

  let installmentsCount = 1;
  let installmentUsd: number | null = null;
  if (paymentPlan !== 'contado') {
    const n = Number(paymentPlan);
    installmentsCount = n;
    installmentUsd = roundUsd(totalUsd / n);
  }

  const ahorroORecargoUsd = roundUsd(totalUsd - subtotalUsd);

  return {
    subtotalUsd,
    totalUsd,
    installmentsCount,
    installmentUsd,
    pctAjusteNumerico: cfg.pct,
    ajustePctLabel: cfg.label,
    ahorroORecargoUsd,
    plan: paymentPlan,
  };
}

export const CALCULO_ACTIVACION_TIPO = 'activacion_obra_usd_m2_plan_v2' as const;

export const PLANES_ACTIVACION_UI: Readonly<
  Array<{ id: PlanPagoActivacion; titulo: string; detallePct: string }>
> = [
  { id: 'contado', titulo: 'Pago único', detallePct: '10% de descuento' },
  { id: '3', titulo: '3 cuotas', detallePct: 'sin recargo' },
  { id: '6', titulo: '6 cuotas', detallePct: 'sin recargo' },
  { id: '12', titulo: '12 cuotas', detallePct: 'sin recargo' },
];
