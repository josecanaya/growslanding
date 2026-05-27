import {
  ESTADO_BLOQUE_PARA_VALIDAR,
  ESTADO_TAREA_FINAL,
  normalizeEstadoBloqueParaOperacion,
  subtareaEstaCompletadaOficial,
} from '@/lib/domain/estados-core';

const ESTADOS_TAREA_CERRADOS_SOCIO = new Set([
  ESTADO_TAREA_FINAL,
  'validado',
  'para_validar',
  'finalizado',
  'finalizada',
  'terminada',
  'terminado',
  'completada',
  'completado',
  'aprobada',
  'aprobado',
]);

export function normalizeEstadoTareaSocio(estado: string | null | undefined): string {
  return String(estado ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function tareaEstaCerradaParaSocio(estado: string | null | undefined): boolean {
  const n = normalizeEstadoTareaSocio(estado);
  return ESTADOS_TAREA_CERRADOS_SOCIO.has(n);
}

/** Bloque que ya no requiere acción del socio (enviado a cliente o aprobado). */
export function bloqueEstaCerradoParaSocio(estado: string | null | undefined): boolean {
  const n = normalizeEstadoBloqueParaOperacion(estado);
  return (
    subtareaEstaCompletadaOficial(n) ||
    n === ESTADO_BLOQUE_PARA_VALIDAR ||
    n === 'para_validar'
  );
}

/** Bloque que el socio puede iniciar o reanudar. */
export function bloqueEstaOperableParaSocio(estado: string | null | undefined): boolean {
  const n = normalizeEstadoBloqueParaOperacion(estado);
  return n === 'pendiente' || n === 'en_progreso' || n === 'rechazado';
}

export function tareaTieneBloquesOperables(
  bloques: Array<{ estado?: string | null }> | undefined,
): boolean {
  if (!bloques || bloques.length === 0) return true;
  return bloques.some((b) => bloqueEstaOperableParaSocio(b.estado));
}

export function tareaEstaListaComoPredecesora(
  estadoTarea: string | null | undefined,
  bloques: Array<{ estado?: string | null }> | undefined,
): boolean {
  if (tareaEstaCerradaParaSocio(estadoTarea)) return true;
  if (!bloques || bloques.length === 0) return false;
  return bloques.every((b) => bloqueEstaCerradoParaSocio(b.estado));
}

export function filtrarTareasOperativasSocio<
  T extends { id: string; estado?: string | null },
>(
  candidatas: T[],
  opts: {
    /** Todas las tareas del socio (incluye cerradas) para evaluar precedencias. */
    todasLasTareas: T[];
    bloquesPorTarea: Map<string, Array<{ estado?: string | null }>>;
    precedencias?: Array<{ tarea_id: string; depende_de?: string | null }>;
  },
): T[] {
  const { bloquesPorTarea, precedencias = [], todasLasTareas } = opts;

  const tareasListas = new Set<string>();
  for (const t of todasLasTareas) {
    if (tareaEstaListaComoPredecesora(t.estado, bloquesPorTarea.get(t.id))) {
      tareasListas.add(t.id);
    }
  }

  const depsPorTarea = new Map<string, string[]>();
  for (const p of precedencias) {
    const dep = p.depende_de?.trim();
    if (!dep) continue;
    const list = depsPorTarea.get(p.tarea_id) ?? [];
    list.push(dep);
    depsPorTarea.set(p.tarea_id, list);
  }

  return candidatas.filter((t) => {
    if (tareaEstaCerradaParaSocio(t.estado)) return false;
    if (!tareaTieneBloquesOperables(bloquesPorTarea.get(t.id))) return false;

    const deps = depsPorTarea.get(t.id) ?? [];
    if (deps.length === 0) return true;
    return deps.every((depId) => tareasListas.has(depId));
  });
}

export function buildBloquesPorTareaMap(
  rows: Array<{ tarea_id?: string | null; estado?: string | null }> | null | undefined,
): Map<string, Array<{ estado?: string | null }>> {
  const map = new Map<string, Array<{ estado?: string | null }>>();
  for (const row of rows ?? []) {
    const tid = String(row.tarea_id ?? '').trim();
    if (!tid) continue;
    const list = map.get(tid) ?? [];
    list.push({ estado: row.estado });
    map.set(tid, list);
  }
  return map;
}
