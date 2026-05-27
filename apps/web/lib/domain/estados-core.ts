export const ESTADOS_TAREA = [
  'pendiente',
  'en_progreso',
  'para_validar',
  'validada',
  'rechazada',
] as const;

export type EstadoTareaCore = (typeof ESTADOS_TAREA)[number];

export const ESTADOS_BLOQUE = [
  'pendiente',
  'en_progreso',
  'para_validar',
  'validado',
  'rechazado',
] as const;

export type EstadoBloqueCore = (typeof ESTADOS_BLOQUE)[number];

export const ESTADO_TAREA_FINAL = 'validada' as const;
export const ESTADO_BLOQUE_FINAL = 'validado' as const;
export const ESTADO_BLOQUE_PARA_VALIDAR = 'para_validar' as const;

/** Estados de subtarea/bloque que cuentan como “completado” en métricas (solo oficiales; PostgREST). */
export const ESTADOS_SUBTAREA_COMPLETADOS_FILTRO = [ESTADO_BLOQUE_FINAL] as const;

/** Etiquetas legacy en DB/UI (no usar en .eq() contra enum oficial). */
const SUBTAREA_COMPLETADA_LEGACY = new Set(['validada', 'finalizada', 'finalizado', 'completado', 'completo']);

export function subtareaEstaCompletadaOficial(estado: string | null | undefined): boolean {
  return (estado || '').toLowerCase() === ESTADO_BLOQUE_FINAL;
}

/** Solo para mostrar datos viejos; nunca para armar filtros a Supabase. */
export function subtareaEstaCompletadaConLegacy(estado: string | null | undefined): boolean {
  const n = (estado || '').toLowerCase();
  return subtareaEstaCompletadaOficial(n) || SUBTAREA_COMPLETADA_LEGACY.has(n);
}

/**
 * Unifica variantes de PostgREST / legacy (espacios, mayúsculas, alias) para lógica de bloques en servicios.
 */
export function normalizeEstadoBloqueParaOperacion(estado: string | null | undefined): string {
  const n = String(estado ?? '').trim().toLowerCase().replace(/\s+/g, '_');
  if (n === 'en_ejecucion' || n === 'en_curso') {
    return 'en_progreso';
  }
  if (n === 'rechazada') {
    return 'rechazado';
  }
  if (n === 'validada') {
    return 'validado';
  }
  /** Algún contenido viejo/UI copia estado de la tarea (en_revision → para_validar a nivel obra) sobre el bloque. */
  if (n === 'en_revision' || n === 'revision' || n === 'pendiente_de_validacion' || n === 'pendiente_de_validación') {
    return ESTADO_BLOQUE_PARA_VALIDAR;
  }
  if (!n || n === 'asignada' || n === 'asignado' || n === 'nuevo') {
    return 'pendiente';
  }
  return n;
}
