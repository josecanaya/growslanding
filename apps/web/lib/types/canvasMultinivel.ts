/** Canvas operativo multinivel — sin geometría BIM; jerarquía, precedencias y tareas locales. */

export type CanvasNivelTipo = 'etapa' | 'planta' | 'sector' | 'ambiente' | 'tarea';

/** Estados de contenedor local (etapa, planta, sector, ambiente). */
export type CanvasNivelEstadoLocal =
  | 'pendiente'
  | 'en_curso'
  | 'completado'
  | 'bloqueado';

/** Estados reducidos para UI local hasta integrar FSM servidor */
export type CanvasTareaEstadoLocal =
  | 'pendiente'
  | 'en_progreso'
  | 'para_validar'
  | 'validada'
  | 'rechazada';

export type CanvasChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

/** Precedencia entre nodos hermanos (mismo `parentId` / mismo nivel del canvas). */
export type CanvasPrecedenceEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  critical: boolean;
};

export type CanvasNode = {
  id: string;
  parentId: string | null;
  /** Profundidad 1 (etapa bajo obra) … 5 (tarea bajo ambiente) */
  level: number;
  type: CanvasNivelTipo;
  title: string;
  position: { x: number; y: number };
  createdAt: string;
  estadoTarea?: CanvasTareaEstadoLocal;
  duracionDias?: number;
  socioLabel?: string;
  /** Sólo en tareas: ítems de checklist */
  checklist?: CanvasChecklistItem[];
  /** Override opcional: resalta la tarea como crítica además del CPM calculado por duración/holgura. */
  esCritica?: boolean;
  /** Metadatos de planificación — persistencia local; no BIM. */
  descripcion?: string;
  notas?: string;
  estadoNivel?: CanvasNivelEstadoLocal;
  /** Avance declarado manualmente para etapas y contenedores (0–100). */
  avancePct?: number;
  /** Etiqueta de tipo opcional (“cocheras”, “núcleo”, etc.). */
  tipoLabel?: string;
  /** Superficie aproximada (m²) — plantas / zonas amplias. */
  superficieM2?: number;
};

/** v1 sólo obraNombre + nodes + pathIds. v2 suma edges. */
export const CANVAS_MULTINIVEL_STORAGE_VERSION = 2 as const;

export type CanvasMultinivelPersisted = {
  v: typeof CANVAS_MULTINIVEL_STORAGE_VERSION;
  obraNombre: string;
  nodes: CanvasNode[];
  /** Cadena de ids desde la raíz; vacío = vista obra (solo etapas) */
  pathIds: string[];
  /** Precedencias entre hermanos; se filtran por nivel actual en UI */
  edges: CanvasPrecedenceEdge[];
};
