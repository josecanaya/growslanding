import type {
  CanvasMultinivelPersisted,
  CanvasNode,
  CanvasPrecedenceEdge,
  TransformKind,
} from '@/lib/types/canvasMultinivel';
import { newCanvasEdgeId, newCanvasNodeId } from '@/lib/proyecto-vivo/ids';

const ETAPA_DEFINICION = '00. Definición del proyecto';

function kindFrom(texto: string): TransformKind {
  const t = texto.toLowerCase();
  if (/\b(ejecut|construir|obra física|levantar muro|hormigon|mampost)\b/.test(t)) return 'ejecucion';
  if (/\b(equipo|socio|convoc|colabor|arquitect|invers)\b/.test(t)) return 'coordinacion';
  return 'conocimiento';
}

export function pasoDesdeHabla(texto: string): {
  verb: string;
  detalle: string;
  transformKind: TransformKind;
} {
  const raw = texto.replace(/\s+/g, ' ').trim();
  const parts = raw.split(/\s*(?:→|->|=>)\s*/).filter(Boolean);
  const verb = (parts[0] ?? raw).slice(0, 80);
  const detalle = (parts[1] ?? verb).slice(0, 200);
  return { verb, detalle, transformKind: kindFrom(raw) };
}

function findOrBuildEtapaDefinicion(
  canvas: CanvasMultinivelPersisted,
  now: string,
): { etapa: CanvasNode; created: boolean } {
  const existing = canvas.nodes.find(
    (n) =>
      n.type === 'etapa' &&
      n.parentId === null &&
      (n.title === ETAPA_DEFINICION || /^00\.\s/i.test(n.title)),
  );
  if (existing) return { etapa: existing, created: false };
  return {
    created: true,
    etapa: {
      id: newCanvasNodeId(),
      parentId: null,
      level: 1,
      type: 'etapa',
      title: ETAPA_DEFINICION,
      position: { x: 40, y: 40 },
      createdAt: now,
      estadoNivel: 'en_curso',
    },
  };
}

/**
 * Un turno de habla → nodos del canvas Organizar (etapa + tarea + precedencia).
 * Misma estructura que Casa nueva / XML, no el grafo IDEA→estado aparte.
 */
export function proponerPasoEnCanvasObra(input: {
  canvas: CanvasMultinivelPersisted;
  mensaje: string;
}): {
  nodos: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  tareaId: string | null;
  motivo: string;
} {
  const paso = pasoDesdeHabla(input.mensaje);
  const now = new Date().toISOString();
  const { etapa, created } = findOrBuildEtapaDefinicion(input.canvas, now);

  const siblings = input.canvas.nodes.filter(
    (n) => n.parentId === etapa.id && n.type === 'tarea',
  );
  const dup = siblings.find((n) => n.title.trim().toLowerCase() === paso.verb.toLowerCase());
  if (dup) {
    return {
      nodos: created ? [etapa] : [],
      edges: [],
      tareaId: dup.id,
      motivo: `Ya estaba la tarea «${paso.verb}» en ${etapa.title}.`,
    };
  }

  const sorted = [...siblings].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const prev = sorted[sorted.length - 1] ?? null;
  const tareaId = newCanvasNodeId();
  const x = 80 + sorted.length * 280;
  const tarea: CanvasNode = {
    id: tareaId,
    parentId: etapa.id,
    level: 2,
    type: 'tarea',
    title: paso.verb,
    position: { x, y: 120 },
    createdAt: now,
    estadoTarea: 'pendiente',
    duracionDias: 1,
    descripcion: paso.detalle,
    transformKind: paso.transformKind,
    graphStatus: 'propuesta',
    executorKind: 'agente',
    orquestador: {
      origen: 'agente',
      estado: 'pendiente',
      formulaId: 'chat',
      chatUser: input.mensaje.trim().slice(0, 4000),
    },
  };

  const nodos: CanvasNode[] = created ? [etapa, tarea] : [tarea];
  const edges: CanvasPrecedenceEdge[] = [];
  if (prev) {
    edges.push({
      id: newCanvasEdgeId(),
      sourceId: prev.id,
      targetId: tareaId,
      critical: true,
    });
  }

  return {
    nodos,
    edges,
    tareaId,
    motivo: `Propuesta en «${etapa.title}»: ${paso.verb} — ${paso.detalle}`,
  };
}
