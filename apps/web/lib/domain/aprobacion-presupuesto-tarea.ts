/**
 * Normaliza estado de presupuesto (tareas_presupuestos.estado): mayúsculas/minúsculas en BD.
 */
export function estadoPresupuestoEsAprobado(estado: string | null | undefined): boolean {
  return String(estado ?? '')
    .trim()
    .toUpperCase()
    === 'APROBADO';
}

/** Tareas que ya están en ciclo fuera de «solo pendiente de arrancar». */
export const ESTADOS_TAREA_YA_EN_EJECUCION_O_CIERRRE = new Set([
  'en_progreso',
  'en_ejecucion',
  'para_validar',
  'validada',
  'validado',
  'finalizado',
  'finalizada',
]);

export function tareaYaInicioEjecucion(estadoTarea: string | null | undefined): boolean {
  return ESTADOS_TAREA_YA_EN_EJECUCION_O_CIERRRE.has(String(estadoTarea ?? '').trim().toLowerCase());
}

/** Primer elemento de lista cuyo presupuesto figura como aprobado (cualquier capitalización). */
export function primeraFilaPresupuestoAprobado<T extends { estado?: string | null }>(
  rows: T[] | null | undefined,
): T | null {
  if (!rows?.length) return null;
  return rows.find((r) => estadoPresupuestoEsAprobado(r.estado)) ?? null;
}

/**
 * Patch consistente para tareas cuando se aprueba un presupuesto a un socio:
 * FK + texto responsable + (opcional) estado pendiente si la tarea todavía no arrancó.
 */
export function patchTareaTrasPresupuestoAprobado(opts: {
  socioId: string;
  socioEmail?: string | null;
  socioNombre?: string | null;
  estadoTareaActual?: string | null;
}): Record<string, unknown> {
  const responsable =
    (opts.socioEmail && String(opts.socioEmail).trim()) ||
    (opts.socioNombre && String(opts.socioNombre).trim()) ||
    'Socio';

  const patch: Record<string, unknown> = {
    responsable_socio_id: opts.socioId,
    cuadrilla_id: opts.socioId,
    responsable,
    updated_at: new Date().toISOString(),
  };

  if (!tareaYaInicioEjecucion(opts.estadoTareaActual ?? null)) {
    patch.estado = 'pendiente';
  }

  return patch;
}
