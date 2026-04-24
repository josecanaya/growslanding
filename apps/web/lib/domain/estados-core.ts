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
