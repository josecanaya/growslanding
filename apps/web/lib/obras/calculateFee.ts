/**
 * Cálculo de importe de activación de obra por m² cubiertos y plan de pago.
 * Contrato estable para integraciones futuras (checkout / backend).
 */

export const PRECIO_ACTIVACION_OBRA_USD_POR_M2 = 8 as const;

export type PlanPagoActivacion = 'contado' | '3' | '6' | '12';

export type PctPlanActivacion = -10 | 5 | 15 | 35;

export type ResultadoActivacionObraCalculo = {
  subtotalUsd: number;
  totalUsd: number;
  installmentsCount: number;
  installmentUsd: number | null;
  pctAjusteNumerico: PctPlanActivacion;
  ajustePctLabel: string;
  /** Positivo: recargo vs subtotal | Negativo: descuento (ahorro) vs subtotal */
  ahorroORecargoUsd: number;
  plan: PlanPagoActivacion;
};

const MULTIPLICADORES: Record<PlanPagoActivacion, { mult: number; pct: PctPlanActivacion; label: string }> =
  {
    contado: { mult: 0.9, pct: -10, label: '−10%' },
    '3': { mult: 1.05, pct: 5, label: '+5%' },
    '6': { mult: 1.15, pct: 15, label: '+15%' },
    '12': { mult: 1.35, pct: 35, label: '+35%' },
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

export const CALCULO_ACTIVACION_TIPO = 'activacion_obra_usd_m2_plan' as const;

export const PLANES_ACTIVACION_UI: Readonly<
  Array<{ id: PlanPagoActivacion; titulo: string; detallePct: string }>
> = [
  { id: 'contado', titulo: 'Pago único', detallePct: '−10%' },
  { id: '3', titulo: '3 cuotas', detallePct: '+5%' },
  { id: '6', titulo: '6 cuotas', detallePct: '+15%' },
  { id: '12', titulo: '12 cuotas', detallePct: '+35%' },
];
