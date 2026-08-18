import type { CanvasMultinivelPersisted, CanvasNode, TransformKind } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { newCanvasEdgeId, newCanvasNodeId } from '@/lib/proyecto-vivo/ids';

export type OrquestadorPasoL0 = {
  verb: string;
  estadoB: string;
  transformKind: TransformKind;
};

export type OrquestadorNodoPropuesto = {
  transformacion: CanvasNode;
  estadoB: CanvasNode;
};

export type PropuestaL0Result = {
  fromEstadoId: string | null;
  pasos: OrquestadorPasoL0[];
  nodos: OrquestadorNodoPropuesto[];
  edges: Array<{ id: string; sourceId: string; targetId: string; critical: boolean }>;
  motivo: string;
};

const CONSTRUCCION_RE =
  /\b(casa|vivienda|obra|terreno|excav|fund|mampost|hormigon|techo|terminac)/i;

function pickFromEstado(canvas: CanvasMultinivelPersisted): CanvasNode | null {
  const alcanzados = canvas.nodes.filter(
    (n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado',
  );
  if (alcanzados.length === 0) return null;
  return alcanzados.find((e) => e.title.toLowerCase() === 'idea') ?? alcanzados[0] ?? null;
}

function tituloObjetivo(objetivoTexto: string | null | undefined): string {
  const t = objetivoTexto?.trim();
  return t && t.length > 0 ? t.slice(0, 120) : 'Estado objetivo';
}

function findPasoExistente(
  canvas: CanvasMultinivelPersisted,
  fromId: string,
  verb: string,
  estadoB: string,
): CanvasNode | null {
  const verbNorm = verb.trim().toLowerCase();
  const bNorm = estadoB.trim().toLowerCase();
  for (const n of canvas.nodes) {
    if (!isCanvasTransformacionNode(n)) continue;
    if ((n.fromNodeId ?? '') !== fromId) continue;
    if (n.title.trim().toLowerCase() !== verbNorm) continue;
    const dest = canvas.nodes.find((x) => x.id === n.toNodeId);
    if (dest?.title.trim().toLowerCase() === bNorm) return n;
  }
  return null;
}

/** Receta determinista L0: no LLM, no marca realizada, no toca wallet. */
export function recetaL0(objetivoTexto: string | null | undefined): OrquestadorPasoL0[] {
  const objetivo = tituloObjetivo(objetivoTexto);
  const pasos: OrquestadorPasoL0[] = [
    {
      verb: 'Definir rumbo',
      estadoB: `Alcance de: ${objetivo}`,
      transformKind: 'conocimiento',
    },
    {
      verb: 'Convocar colaboración',
      estadoB: `Equipo para: ${objetivo}`,
      transformKind: 'coordinacion',
    },
  ];
  if (CONSTRUCCION_RE.test(objetivo)) {
    pasos.push({
      verb: 'Ejecutar en obra',
      estadoB: objetivo,
      transformKind: 'ejecucion',
    });
  }
  return pasos;
}

export function proponerL0(input: {
  canvas: CanvasMultinivelPersisted;
  objetivoTexto?: string | null;
}): PropuestaL0Result {
  const from = pickFromEstado(input.canvas);
  if (!from) {
    return {
      fromEstadoId: null,
      pasos: [],
      nodos: [],
      edges: [],
      motivo: 'No hay estado alcanzado desde el cual proponer.',
    };
  }

  const receta = recetaL0(input.objetivoTexto);
  const now = new Date().toISOString();
  const nodos: OrquestadorNodoPropuesto[] = [];
  const edges: PropuestaL0Result['edges'] = [];
  let fromId = from.id;
  let prevTransformId: string | null = null;

  for (const paso of receta) {
    const existente = findPasoExistente(input.canvas, fromId, paso.verb, paso.estadoB);
    if (existente) {
      fromId = existente.toNodeId ?? fromId;
      prevTransformId = existente.id;
      continue;
    }

    const trId = newCanvasNodeId();
    const bId = newCanvasNodeId();
    nodos.push({
      transformacion: {
        id: trId,
        parentId: null,
        level: 1,
        type: 'tarea',
        title: paso.verb,
        position: { x: 0, y: 0 },
        createdAt: now,
        transformKind: paso.transformKind,
        fromNodeId: fromId,
        toNodeId: bId,
        graphStatus: 'propuesta',
        executorKind: 'agente',
        orquestador: { origen: 'agente', estado: 'pendiente', formulaId: 'l0' },
      },
      estadoB: {
        id: bId,
        parentId: null,
        level: 1,
        type: 'estado',
        title: paso.estadoB,
        position: { x: 0, y: 0 },
        createdAt: now,
        graphStatus: 'fantasma',
      },
    });
    if (prevTransformId) {
      edges.push({
        id: newCanvasEdgeId(),
        sourceId: prevTransformId,
        targetId: trId,
        critical: false,
      });
    }
    prevTransformId = trId;
    fromId = bId;
  }

  return {
    fromEstadoId: from.id,
    pasos: receta,
    nodos,
    edges,
    motivo:
      nodos.length === 0
        ? 'Ya existen propuestas equivalentes para este objetivo.'
        : `L0 propone ${nodos.length} transformación(es) desde «${from.title}».`,
  };
}
