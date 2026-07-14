/** Valores obligatorios del socio antes de publicar / enviar al cliente. */
export function presupuestoLineaTieneValoresObligatorios(edit: {
  monto: number | null;
  dias_reales: number | null;
}): boolean {
  const m = edit.monto;
  const d = edit.dias_reales;
  const hasM = m != null && !Number.isNaN(Number(m)) && Number(m) > 0;
  const hasD = d != null && !Number.isNaN(Number(d)) && Number(d) > 0;
  return hasM && hasD;
}
