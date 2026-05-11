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
