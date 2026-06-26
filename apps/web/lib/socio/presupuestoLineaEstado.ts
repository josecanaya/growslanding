export type LineaEstadoPresupuestoKey =
  | 'sin_presupuestar'
  | 'incompleta'
  | 'lista'
  | 'enviada'
  | 'aprobada';

export function presupuestoLineaEstado(
  estadoRow: string | null | undefined,
  edit: { monto: number | null; dias_reales: number | null },
): { key: LineaEstadoPresupuestoKey; label: string } {
  const est = (estadoRow || '').toUpperCase();
  if (est === 'APROBADO') return { key: 'aprobada', label: 'Aprobada' };
  if (est === 'ENVIADO') return { key: 'enviada', label: 'Enviada' };

  const m = edit.monto;
  const d = edit.dias_reales;
  const hasM = m != null && !Number.isNaN(Number(m)) && Number(m) > 0;
  const hasD = d != null && !Number.isNaN(Number(d)) && Number(d) > 0;

  if (hasM && hasD) return { key: 'lista', label: 'Lista' };
  if (hasM || hasD) return { key: 'incompleta', label: 'Incompleta' };
  return { key: 'sin_presupuestar', label: 'Sin presupuestar' };
}
