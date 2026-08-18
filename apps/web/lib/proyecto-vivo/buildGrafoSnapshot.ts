import type { CanvasMultinivelPersisted, ObraGraphMode } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { toClientNodeId } from '@/lib/canvas/canvasSupabaseMapper';
import { computeFrontera } from '@/lib/proyecto-vivo/computeFrontera';

export type TareaPuenteRow = {
  id: string;
  canvas_node_id: string | null;
  estado: string | null;
};

export type GrafoSnapshot = {
  obraId: string;
  graph_mode: ObraGraphMode;
  objetivo_texto: string | null;
  estados: Array<{ id: string; title: string; graph_status: string | null }>;
  transformaciones: Array<{
    id: string;
    title: string;
    transform_kind: string | null;
    graph_status: string | null;
    from_node_id: string | null;
    to_node_id: string | null;
    executor_kind: string | null;
    executor_ref: string | null;
    t_value: number | null;
    t_components: Record<string, number> | null;
    tarea_id: string | null;
    tarea_estado: string | null;
    orquestador_estado: 'pendiente' | 'aceptada' | null;
  }>;
  precedencias: Array<{ source: string; target: string }>;
  frontera: ReturnType<typeof computeFrontera>;
  crecimiento: { estadosAlcanzados: number; tSuma: number | null };
};

export function buildGrafoSnapshot(input: {
  obraId: string;
  graphMode: ObraGraphMode;
  objetivoTexto?: string | null;
  canvas: CanvasMultinivelPersisted;
  tareas?: TareaPuenteRow[];
}): GrafoSnapshot {
  const tareaByCanvas = new Map<string, TareaPuenteRow>();
  for (const t of input.tareas ?? []) {
    if (!t.canvas_node_id) continue;
    const key = toClientNodeId(t.canvas_node_id.replace(/^cn-/, '')).toLowerCase();
    tareaByCanvas.set(key, t);
  }

  const estados = input.canvas.nodes
    .filter(isCanvasEstadoNode)
    .map((n) => ({ id: n.id, title: n.title, graph_status: n.graphStatus ?? null }));

  const transformaciones = input.canvas.nodes.filter(isCanvasTransformacionNode).map((n) => {
    const puente = tareaByCanvas.get(n.id.toLowerCase());
    return {
      id: n.id,
      title: n.title,
      transform_kind: n.transformKind ?? null,
      graph_status: n.graphStatus ?? null,
      from_node_id: n.fromNodeId ?? null,
      to_node_id: n.toNodeId ?? null,
      executor_kind: n.executorKind ?? null,
      executor_ref: n.executorRef ?? null,
      t_value: n.tValue ?? null,
      t_components: n.tComponents ?? null,
      tarea_id: puente?.id ?? null,
      tarea_estado: puente?.estado ?? null,
      orquestador_estado: n.orquestador?.estado ?? null,
    };
  });

  const precedencias = input.canvas.edges.map((e) => ({
    source: e.sourceId,
    target: e.targetId,
  }));

  const estadosAlcanzados = input.canvas.nodes.filter(
    (n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado',
  ).length;

  const tValues = transformaciones
    .filter((t) => t.graph_status === 'realizada' && t.t_value != null)
    .map((t) => t.t_value as number);
  const tSuma = tValues.length > 0 ? tValues.reduce((a, b) => a + b, 0) : null;

  const tareaEstadoByCanvasNodeId = new Map<string, string>();
  for (const t of transformaciones) {
    if (t.tarea_estado) tareaEstadoByCanvasNodeId.set(t.id, t.tarea_estado);
  }

  return {
    obraId: input.obraId,
    graph_mode: input.graphMode,
    objetivo_texto: input.objetivoTexto ?? null,
    estados,
    transformaciones,
    precedencias,
    frontera: computeFrontera(input.canvas, { tareaEstadoByCanvasNodeId }),
    crecimiento: { estadosAlcanzados, tSuma },
  };
}
