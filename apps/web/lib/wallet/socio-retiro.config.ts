/** Política de retiros y liquidaciones automáticas del socio. */
export const SOCIO_RETIRO_CONFIG = {
  /** Monto mínimo por retiro manual (ARS). */
  montoMinimo: 5_000,
  /** Tope por operación manual (ARS). */
  montoMaximoPorOperacion: 500_000,
  /** Tope acumulado por día calendario (ARS). */
  montoMaximoDiario: 1_000_000,
  /** Cada cuántos días se liquida el saldo completo a cuenta bancaria. */
  diasLiquidacionAutomatica: 15,
  moneda: 'ARS' as const,
} as const;

export function sumarDiasLiquidacion(desde: Date = new Date()): Date {
  const d = new Date(desde);
  d.setDate(d.getDate() + SOCIO_RETIRO_CONFIG.diasLiquidacionAutomatica);
  return d;
}
