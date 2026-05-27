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

/**
 * Fila típica de `tareas_presupuestos` al filtrar por estado aprobado.
 * `Partial` evita exigir columnas no traídas en cada `.select(...)`.
 */
export type FilaPresupuestoConEstado = {
  estado?: string | null | undefined;
} & Partial<{
  id: string;
  socio_id: string | null;
  monto: number;
  dias_reales: number | null;
  cantidad: number | null;
  unidad: string | null;
  notas: string | null;
  tarea_id: string | null;
}>;

/** Primer elemento de lista cuyo presupuesto figura como aprobado (cualquier capitalización). */
export function primeraFilaPresupuestoAprobado(
  rows: FilaPresupuestoConEstado[] | null | undefined,
): FilaPresupuestoConEstado | null {
  if (!rows?.length) return null;
  return rows.find((r) => estadoPresupuestoEsAprobado(r.estado)) ?? null;
}

/** Presupuesto aprobado preferido para operación del socio (responsable → operador → cualquier aprobado). */
export function resolverPresupuestoAprobadoParaOperacion(
  rows: FilaPresupuestoConEstado[] | null | undefined,
  opts?: { responsableSocioId?: string | null; socioOperadorId?: string | null },
): FilaPresupuestoConEstado | null {
  const aprobados = (rows ?? []).filter((r) => estadoPresupuestoEsAprobado(r.estado));
  if (aprobados.length === 0) return null;

  const candidatos = [
    opts?.responsableSocioId,
    opts?.socioOperadorId,
  ].filter((id): id is string => Boolean(id?.trim()));

  for (const socioId of candidatos) {
    const match = aprobados.find((r) => r.socio_id === socioId);
    if (match) return match;
  }

  return aprobados[0] ?? null;
}

export function diasEfectivosDesdePresupuesto(
  presupuesto: FilaPresupuestoConEstado,
): number {
  let diasNotas: number | null = null;
  if (presupuesto.notas) {
    try {
      const parsed =
        typeof presupuesto.notas === 'string'
          ? JSON.parse(presupuesto.notas)
          : presupuesto.notas;
      const valor = Number(
        parsed?.dias_reales ?? parsed?.dias ?? parsed?.bloques_planificados ?? parsed?.bloques,
      );
      diasNotas = Number.isFinite(valor) && valor > 0 ? Math.round(valor) : null;
    } catch {
      diasNotas = null;
    }
  }

  const dias = Number(presupuesto.dias_reales ?? diasNotas ?? 1);
  return Math.max(1, Number.isFinite(dias) ? Math.round(dias) : 1);
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
