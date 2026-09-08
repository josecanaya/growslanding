import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';

/** Canvas operativo multinivel — sin geometría BIM; jerarquía, precedencias y tareas locales. */

export type CanvasNivelTipo =
  | 'etapa'
  | 'planta'
  | 'sector'
  | 'ambiente'
  | 'tarea'
  | 'estado';

export type ObraGraphMode = 'obra_plan' | 'proyecto_vivo';

export type TransformKind = 'conocimiento' | 'coordinacion' | 'ejecucion';

export type ExecutorKind = 'humano' | 'empresa' | 'agente' | 'sin_asignar';

export type GraphStatusEstado = 'alcanzado' | 'fantasma';

export type GraphStatusTransformacion = 'propuesta' | 'en_curso' | 'realizada' | 'bloqueada';

export type GraphNodeStatus = GraphStatusEstado | GraphStatusTransformacion;

export function isCanvasTransformacionNode(n: Pick<CanvasNode, 'type'>): boolean {
  return n.type === 'tarea';
}

export function isCanvasEstadoNode(n: Pick<CanvasNode, 'type'>): boolean {
  return n.type === 'estado';
}

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

/**
 * Vocabulario de relaciones productivas del grafo global.
 *
 * Se persiste en `canvas_edges.type`. `precede` (o ausente) se guarda como
 * `'precedencia'`, el valor histórico que consume la publicación a tareas
 * operativas — no renombrar sin migrar ese flujo.
 */
export type CanvasEdgeRelation =
  | 'precede'
  | 'depende_de'
  | 'habilita'
  | 'requiere'
  | 'afecta'
  | 'se_ejecuta_mediante';

export const CANVAS_EDGE_RELATIONS: readonly CanvasEdgeRelation[] = [
  'precede',
  'depende_de',
  'habilita',
  'requiere',
  'afecta',
  'se_ejecuta_mediante',
] as const;

export function isCanvasEdgeRelation(v: unknown): v is CanvasEdgeRelation {
  return typeof v === 'string' && (CANVAS_EDGE_RELATIONS as readonly string[]).includes(v);
}

/**
 * Relación del grafo global entre dos nodos del canvas.
 *
 * NO está limitada a hermanos: puede unir nodos de distintos scopes (p. ej. «Losa P3
 * habilita Columnas P4»). La contención vive aparte, en `CanvasNode.parentId`.
 * La UI decide qué relaciones dibuja según el scope visible (ver `lib/canvas/canvasScope.ts`);
 * el grafo persistido nunca se recorta por navegación.
 */
export type CanvasPrecedenceEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  critical: boolean;
  /** Ausente = `precede` (compatibilidad con lo ya guardado). */
  relation?: CanvasEdgeRelation;
};

export type CanvasBudgetGroup = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  /** Estado en Supabase: borrador | listo_para_enviar | aprobado | aprobado_parcial | enviado (legacy) */
  status?: string;
  scheduledSocioId?: string | null;
  mensajeSocioBorrador?: string | null;
  /** Ventana de cambio post-aprobación: cerrada | abierta_cliente | confirmada_socio */
  changeWindowStatus?: string | null;
  changeWindowNotes?: string | null;
  /** Pliego visible en bolsa (socios fuera de agenda pueden postularse). */
  bolsaPublicada?: boolean;
  publicadoAAgenda?: boolean;
  /** Primera publicación; bloquea re-envío salvo ventana de cambio confirmada. */
  pliegoPublicadoAt?: string | null;
};

export type CanvasNode = {
  id: string;
  /**
   * CONTENCIÓN Y NADA MÁS: «este nodo está dentro de aquel». `null` = raíz de la obra.
   * Nunca precedencia ni dependencia — eso vive en `CanvasPrecedenceEdge`.
   * El Canvas dibuja un único scope: los hijos directos de `parentId === scope`.
   */
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
  /** Agrupación local para futuro módulo de presupuestos (sin API). */
  budgetGroupId?: string;
  /** Auditoría de import Project XML — no mostrar en UI operativa. */
  importSourceUid?: number;
  importOutlineNumber?: string;
  /** Proyecto vivo: semántica transformación (type=tarea) o estado (type=estado) */
  transformKind?: TransformKind;
  fromNodeId?: string;
  toNodeId?: string;
  executorKind?: ExecutorKind;
  executorRef?: string;
  graphStatus?: GraphNodeStatus;
  /** proyecto_vivo: identidad de T (no catálogo Grows). */
  energyUnitId?: string | null;
  /** proyecto_vivo: q en E=qT. */
  energyQuantity?: number | null;
  /** proyecto_vivo: C. No es wallet. */
  capitalAmount?: number | null;
  /** proyecto_vivo: moneda de C; default USD. */
  capitalCurrency?: string | null;
  /** Sugerencia del orquestador. Ausente = creada por humano. */
  orquestador?: {
    origen: 'agente';
    estado: 'pendiente' | 'aceptada';
    formulaId: 'l0' | 'chat';
    /** Texto original del turno de chat (sin PII de más: es lo que el usuario escribió). */
    chatUser?: string;
  };
};

/** v1 obra+nodes+pathIds; v2 + edges; v3 + budgetGroups; v4 + projectKind */
export const CANVAS_MULTINIVEL_STORAGE_VERSION = 4 as const;

export type CanvasMultinivelPersisted = {
  v: typeof CANVAS_MULTINIVEL_STORAGE_VERSION;
  obraNombre: string;
  nodes: CanvasNode[];
  /** Cadena de ids desde la raíz; vacío = vista obra (solo etapas) */
  pathIds: string[];
  /** Precedencias entre hermanos; se filtran por nivel actual en UI */
  edges: CanvasPrecedenceEdge[];
  /** Grupos de presupuesto locales (obra); las tareas referencian por budgetGroupId */
  budgetGroups: CanvasBudgetGroup[];
  projectKind: CanvasProjectKind;
};
