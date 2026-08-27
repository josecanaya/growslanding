import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import { computeGlobalTaskSchedule } from './buildCronogramaItems';
import {
  collectImplicitAmbienteChainEdges,
  collectMacroBridgeTaskEdges,
  edgeKind,
  mergeUniqueEdges,
} from './obraCompletaVinculos';
import { buildFaseColorMap } from './obraCompletaFaseColors';
import type { FaseColorStyle } from './obraCompletaFaseColors';

export type ObraCompletaTaskMetrics = {
  taskId: string;
  title: string;
  breadcrumb: string;
  faseLabel: string;
  faseColor: FaseColorStyle;
  duration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  float: number;
  isCritical: boolean;
};

export type ObraCompletaGraph = {
  nodes: Node[];
  edges: Edge[];
  metricsById: Map<string, ObraCompletaTaskMetrics>;
  projectDuration: number;
  taskCount: number;
  edgeCount: number;
  macroBridgeCount: number;
  implicitAmbienteChainCount: number;
};

const NODE_W = 92;
const NODE_H = 88;
const LAYER_GAP_X = 36;
const ROW_GAP_Y = 14;
const PADDING = 48;

function breadcrumbFase(breadcrumb: string): string {
  return breadcrumb.split(' · ')[0]?.trim() || 'Obra';
}

function computeLayers(
  metrics: ObraCompletaTaskMetrics[],
  edges: CanvasPrecedenceEdge[],
): Map<string, number> {
  const ids = new Set(metrics.map((m) => m.taskId));
  const preds = new Map<string, string[]>();
  for (const m of metrics) preds.set(m.taskId, []);
  for (const e of edges) {
    if (!ids.has(e.sourceId) || !ids.has(e.targetId)) continue;
    preds.get(e.targetId)!.push(e.sourceId);
  }

  const layer = new Map<string, number>();
  const visiting = new Set<string>();
  function depth(id: string): number {
    if (layer.has(id)) return layer.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let d = 0;
    for (const p of preds.get(id) ?? []) d = Math.max(d, depth(p) + 1);
    visiting.delete(id);
    layer.set(id, d);
    return d;
  }
  for (const m of metrics) depth(m.taskId);
  return layer;
}

/** X por capa de precedencia (cadena visible); Y por fase + fila en la capa. */
function layoutByPrecedenceLayers(
  metrics: ObraCompletaTaskMetrics[],
  layers: Map<string, number>,
): Map<string, { x: number; y: number }> {
  const faseOrder = new Map<string, number>();
  let nextFase = 0;
  for (const m of metrics) {
    const f = breadcrumbFase(m.breadcrumb);
    if (!faseOrder.has(f)) faseOrder.set(f, nextFase++);
  }

  const byLayer = new Map<number, ObraCompletaTaskMetrics[]>();
  for (const m of metrics) {
    const L = layers.get(m.taskId) ?? 0;
    const list = byLayer.get(L) ?? [];
    list.push(m);
    byLayer.set(L, list);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const rowInLayer = new Map<number, number>();

  for (const L of [...byLayer.keys()].sort((a, b) => a - b)) {
    const list = [...(byLayer.get(L) ?? [])].sort(
      (a, b) =>
        (faseOrder.get(breadcrumbFase(a.breadcrumb)) ?? 0) -
          (faseOrder.get(breadcrumbFase(b.breadcrumb)) ?? 0) ||
        a.es - b.es ||
        a.title.localeCompare(b.title),
    );
    for (const m of list) {
      const lane = faseOrder.get(breadcrumbFase(m.breadcrumb)) ?? 0;
      const row = rowInLayer.get(L) ?? 0;
      rowInLayer.set(L, row + 1);
      positions.set(m.taskId, {
        x: PADDING + L * (NODE_W + LAYER_GAP_X),
        y: PADDING + lane * 120 + row * (NODE_H + ROW_GAP_Y),
      });
    }
  }

  return positions;
}

function findAncestor(
  byId: Map<string, CanvasNode>,
  nodeId: string,
  type: import('@/lib/types/canvasMultinivel').CanvasNivelTipo,
) {
  let cur = byId.get(nodeId);
  while (cur) {
    if (cur.type === type) return cur;
    if (!cur.parentId) break;
    cur = byId.get(cur.parentId);
  }
  return null;
}

function breadcrumbForTask(byId: Map<string, CanvasNode>, taskId: string): string {
  const etapa = findAncestor(byId, taskId, 'etapa');
  const sector = findAncestor(byId, taskId, 'sector');
  const planta = findAncestor(byId, taskId, 'planta');
  const ambiente = findAncestor(byId, taskId, 'ambiente');
  const dept = sector ?? planta;
  return [etapa?.title, dept?.title, ambiente?.title].filter(Boolean).join(' · ') || 'Obra';
}

function defaultFaseColor(label: string): FaseColorStyle {
  return {
    key: label,
    border: '#64748b',
    bg: '#f8fafc',
    bar: '#64748b',
    text: '#334155',
  };
}

function computeLateTimes(
  tasks: CanvasNode[],
  schedule: Map<string, { es: number; ef: number }>,
  allEdges: CanvasPrecedenceEdge[],
): Map<string, { ls: number; lf: number; float: number }> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const succ = new Map<string, string[]>();
  for (const t of tasks) succ.set(t.id, []);
  for (const e of allEdges) {
    if (!byId.has(e.sourceId) || !byId.has(e.targetId)) continue;
    succ.get(e.sourceId)!.push(e.targetId);
  }

  let projectEnd = 0;
  for (const t of tasks) {
    const row = schedule.get(t.id);
    if (row) projectEnd = Math.max(projectEnd, row.ef);
  }
  projectEnd = Math.max(1, projectEnd);

  const ordered = [...tasks].sort(
    (a, b) => (schedule.get(b.id)?.ef ?? 0) - (schedule.get(a.id)?.ef ?? 0),
  );

  const late = new Map<string, { ls: number; lf: number; float: number }>();
  for (const t of ordered) {
    const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
    const es = schedule.get(t.id)?.es ?? 0;
    const successors = succ.get(t.id) ?? [];
    let lf = projectEnd;
    for (const sid of successors) {
      const sLs = late.get(sid)?.ls;
      if (sLs != null) lf = Math.min(lf, sLs);
    }
    const ls = Math.max(es, lf - dur);
    late.set(t.id, { ls, lf, float: Math.max(0, ls - es) });
  }

  return late;
}

export function buildObraCompletaGraph(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  opts?: { editable?: boolean },
): ObraCompletaGraph {
  const editable = Boolean(opts?.editable);
  const tasks = nodes.filter((n) => n.type === 'tarea');
  const taskIds = new Set(tasks.map((t) => t.id));
  const userTaskEdges = edges.filter((e) => taskIds.has(e.sourceId) && taskIds.has(e.targetId));

  if (tasks.length === 0) {
    return {
      nodes: [],
      edges: [],
      metricsById: new Map(),
      projectDuration: 0,
      taskCount: 0,
      edgeCount: 0,
      macroBridgeCount: 0,
      implicitAmbienteChainCount: 0,
    };
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const schedule = computeGlobalTaskSchedule(nodes, edges);
  const macroBridges = collectMacroBridgeTaskEdges(nodes, edges, schedule);
  const implicitChains = collectImplicitAmbienteChainEdges(nodes, userTaskEdges);
  const allEdges = mergeUniqueEdges(userTaskEdges, macroBridges, implicitChains);
  const lateMap = computeLateTimes(tasks, schedule, allEdges);

  const faseNames = tasks.map((t) => breadcrumbFase(breadcrumbForTask(byId, t.id)));
  const faseColors = buildFaseColorMap(faseNames);

  const metrics: ObraCompletaTaskMetrics[] = tasks.map((t) => {
    const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
    const row = schedule.get(t.id) ?? { es: 0, ef: dur };
    const late = lateMap.get(t.id) ?? { ls: row.es, lf: row.ef, float: 0 };
    const manual = Boolean(t.esCritica);
    const breadcrumb = breadcrumbForTask(byId, t.id);
    const faseLabel = breadcrumbFase(breadcrumb);
    const faseColor = faseColors.get(faseLabel) ?? defaultFaseColor(faseLabel);
    return {
      taskId: t.id,
      title: t.title,
      breadcrumb,
      faseLabel,
      faseColor,
      duration: dur,
      es: row.es,
      ef: row.ef,
      ls: late.ls,
      lf: late.lf,
      float: late.float,
      isCritical: manual || late.float === 0,
    };
  });

  let projectDuration = 0;
  for (const m of metrics) projectDuration = Math.max(projectDuration, m.ef);

  const layers = computeLayers(metrics, allEdges);
  const positions = layoutByPrecedenceLayers(metrics, layers);

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const rfNodes: Node[] = metrics.map((m) => {
    const layoutPos = positions.get(m.taskId) ?? { x: 0, y: 0 };
    // Editable: la posición manual del workflow (`wfPos`) manda; si no hay, cae al auto-layout.
    const wf = taskById.get(m.taskId)?.wfPos;
    const pos = editable && wf ? { x: wf.x, y: wf.y } : layoutPos;
    return {
      id: m.taskId,
      type: 'pertTask',
      position: pos,
      draggable: editable,
      selectable: true,
      connectable: editable,
      deletable: false,
      data: { metrics: m },
    };
  });

  const metricsById = new Map(metrics.map((m) => [m.taskId, m]));

  const rfEdges: Edge[] = allEdges.map((e) => {
    const s = metricsById.get(e.sourceId);
    const t = metricsById.get(e.targetId);
    const slack = s && t ? Math.max(0, t.es - s.ef) : 0;
    const kind = edgeKind(e.id);
    // Sólo las precedencias reales (`user`) son editables: seleccionables + borrables.
    const isUserEdge = kind === 'user';
    const critical =
      kind === 'macro' ||
      (kind === 'user' && Boolean(s?.isCritical && t?.isCritical && slack === 0));
    const stroke =
      kind === 'macro' ? '#d97706' : kind === 'implicit' ? '#64748b' : critical ? '#16a34a' : '#94a3b8';
    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: 'smoothstep',
      pathOptions: { offset: 16, borderRadius: 10 },
      animated: false,
      selectable: editable && isUserEdge,
      deletable: editable && isUserEdge,
      focusable: editable && isUserEdge,
      label:
        kind === 'macro' ? 'FS' : kind === 'implicit' ? '→' : slack === 0 ? 'H0' : `H${slack}`,
      labelStyle: {
        fontSize: 9,
        fontWeight: 700,
        fill: kind === 'macro' ? '#b45309' : kind === 'implicit' ? '#64748b' : critical ? '#15803d' : '#475569',
      },
      labelBgStyle: { fill: 'rgba(255,255,255,0.92)' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke,
        strokeWidth: kind === 'macro' ? 2.5 : kind === 'implicit' ? 1.5 : critical ? 2 : 1.25,
        strokeDasharray: kind === 'macro' ? '8 4' : kind === 'implicit' ? '4 3' : critical ? undefined : '5 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: stroke,
        width: 16,
        height: 16,
      },
      zIndex: kind === 'macro' ? 2 : 1,
    };
  });

  return {
    nodes: rfNodes,
    edges: rfEdges,
    metricsById,
    projectDuration,
    taskCount: tasks.length,
    edgeCount: userTaskEdges.length,
    macroBridgeCount: macroBridges.length,
    implicitAmbienteChainCount: implicitChains.length,
  };
}

export const OBRA_COMPLETA_NODE_SIZE = { width: NODE_W, height: NODE_H };
