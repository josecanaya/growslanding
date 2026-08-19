/**
 * Energía de una transformación en proyecto_vivo: F(f)=(qT, C).
 * No es wallet, no es comisión, no es score. Identidades distintas no se suman.
 */

export type EnergiaFf = {
  energyUnitId: string | null;
  energyQuantity: number | null;
  capitalAmount: number | null;
  capitalCurrency: string | null;
};

export const CAPITAL_CURRENCY_DEFAULT = 'USD';

export function parseCantidad(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Suma q solo dentro de la misma identidad T. */
export function sumarQPorUnidad(
  items: Array<{ energyUnitId?: string | null; energyQuantity?: number | null }>,
): Array<{ energy_unit_id: string; q: number }> {
  const map = new Map<string, number>();
  for (const it of items) {
    const id = it.energyUnitId?.trim();
    const q = it.energyQuantity;
    if (!id || q == null) continue;
    map.set(id, (map.get(id) ?? 0) + q);
  }
  return [...map.entries()].map(([energy_unit_id, q]) => ({ energy_unit_id, q }));
}

/** Suma C solo si la moneda coincide (MVP: USD). */
export function sumarCapital(
  items: Array<{ capitalAmount?: number | null; capitalCurrency?: string | null }>,
  currency = CAPITAL_CURRENCY_DEFAULT,
): number | null {
  const want = currency.trim().toUpperCase();
  let sum = 0;
  let n = 0;
  for (const it of items) {
    const cur = (it.capitalCurrency ?? CAPITAL_CURRENCY_DEFAULT).trim().toUpperCase();
    if (cur !== want || it.capitalAmount == null) continue;
    sum += it.capitalAmount;
    n += 1;
  }
  return n > 0 ? sum : null;
}
