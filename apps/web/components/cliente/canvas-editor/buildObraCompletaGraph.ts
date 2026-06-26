import type { CanvasNode, CanvasNivelTipo, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

import { computeGlobalTaskSchedule } from './buildCronogramaItems';

export type ObraCompletaTaskMetrics = {
  taskId: string;
  title: string;
  breadcrumb: string;
  duration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  float: number;
  isCritical: boolean;
  code: string;
};

export type ObraCompletaGraph = {
  nodes: Node[];
  edges: Edge[];
  metricsById: Map<string, ObraCompletaTaskMetrics>;
  projectDuration: number;
  taskCount: number;
  edgeCount: number;
};

const NODE_W = 92;
const NODE_H = 76;
/** Píxeles por día de inicio temprano (eje horizontal = tiempo). */
const PX_PER_DAY = 32;
const ROW_GAP_Y = 20;
const PADDING = 48;

function computeTopoRank(
  metrics: ObraCompletaTaskMetrics[],
  taskEdges: CanvasPrecedenceEdge[],
): Map<string, number> {
  const ids = new Set(metrics.map((m) => m.taskId));
  const preds = new Map<string, string[]>();
  for (const m of metrics) preds.set(m.taskId, []);
  for (const e of taskEdges) {
    if (!ids.has(e.sourceId) || !ids.has(e.targetId)) continue;
    preds.get(e.targetId)!.push(e.sourceId);
  }
  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  function depth(id: string): number {
    if (rank.has(id)) return rank.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    let d = 0;
    for (const p of preds.get(id) ?? []) d = Math.max(d, depth(p) + 1);
    visiting.delete(id);
    rank.set(id, d);
    return d;
  }
  for (const m of metrics) depth(m.taskId);
  return rank;
}

/**
 * Eje X = tiempo (ES) + desplazamiento horizontal entre tareas en paralelo.
 * Eje Y = carril por fase (primera parte del breadcrumb) para no apilar toda la obra en una columna.
 */
function layoutHorizontalByTime(
  metrics: ObraCompletaTaskMetrics[],
  taskEdges: CanvasPrecedenceEdge[],
): Map<string, { x: number; y: number }> {
  const topo = computeTopoRank(metrics, taskEdges);
  const etapaLanes = new Map<string, number>();
  let nextLane = 0;
  for (const m of metrics) {
    const fase = m.breadcrumb.split(' · ')[0]?.trim() || 'Obra';
    if (!etapaLanes.has(fase)) etapaLanes.set(fase, nextLane++);
  }

  const sorted = [...metrics].sort(
    (a, b) =>
      a.es - b.es ||
      (etapaLanes.get(a.breadcrumb.split(' · ')[0] ?? '') ?? 0) -
        (etapaLanes.get(b.breadcrumb.split(' · ')[0] ?? '') ?? 0) ||
      a.ef - b.ef ||
      a.title.localeCompare(b.title),
  );

  const staggerInCell = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();

  for (const m of sorted) {
    const fase = m.breadcrumb.split(' · ')[0]?.trim() || 'Obra';
    const lane = etapaLanes.get(fase) ?? 0;
    const cellKey = `${m.es}|${lane}`;
    const idx = staggerInCell.get(cellKey) ?? 0;
    staggerInCell.set(cellKey, idx + 1);

    const topoRank = topo.get(m.taskId) ?? 0;
    positions.set(m.taskId, {
      x: PADDING + m.es * PX_PER_DAY + topoRank * 24 + idx * (NODE_W + 14),
      y: PADDING + lane * (NODE_H + ROW_GAP_Y),
    });
  }

  return positions;
}

function findAncestor(
  byId: Map<string, CanvasNode>,
  nodeId: string,
  type: CanvasNivelTipo,
): CanvasNode | null {
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

function taskCode(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return `T${index + 1}`;
}

function computeLateTimes(
  tasks: CanvasNode[],
  schedule: Map<string, { es: number; ef: number; isCritical: boolean }>,
  taskEdges: CanvasPrecedenceEdge[],
): Map<string, { ls: number; lf: number; float: number }> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const succ = new Map<string, string[]>();
  for (const t of tasks) succ.set(t.id, []);
  for (const e of taskEdges) {
    if (!byId.has(e.sourceId) || !byId.has(e.targetId)) continue;
    const arr = succ.get(e.sourceId) ?? [];
    arr.push(e.targetId);
    succ.set(e.sourceId, arr);
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
    const float = Math.max(0, ls - es);
    late.set(t.id, { ls, lf, float });
  }

  return late;
}

export function buildObraCompletaGraph(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
): ObraCompletaGraph {
  const tasks = nodes.filter((n) => n.type === 'tarea');
  const taskIds = new Set(tasks.map((t) => t.id));
  const taskEdges = edges.filter((e) => taskIds.has(e.sourceId) && taskIds.has(e.targetId));

  if (tasks.length === 0) {
    return {
      nodes: [],
      edges: [],
      metricsById: new Map(),
      projectDuration: 0,
      taskCount: 0,
      edgeCount: 0,
    };
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const schedule = computeGlobalTaskSchedule(nodes, edges);
  const lateMap = computeLateTimes(tasks, schedule, taskEdges);

  const metrics: ObraCompletaTaskMetrics[] = tasks.map((t, idx) => {
    const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
    const row = schedule.get(t.id) ?? { es: 0, ef: dur, isCritical: Boolean(t.esCritica) };
    const late = lateMap.get(t.id) ?? { ls: row.es, lf: row.ef, float: 0 };
    const isCritical = row.isCritical || late.float === 0;
    return {
      taskId: t.id,
      title: t.title,
      breadcrumb: breadcrumbForTask(byId, t.id),
      duration: dur,
      es: row.es,
      ef: row.ef,
      ls: late.ls,
      lf: late.lf,
      float: late.float,
      isCritical,
      code: taskCode(idx),
    };
  });

  let projectDuration = 0;
  for (const m of metrics) projectDuration = Math.max(projectDuration, m.ef);

  const positions = layoutHorizontalByTime(metrics, taskEdges);

  const rfNodes: Node[] = metrics.map((m) => {
    const pos = positions.get(m.taskId) ?? { x: 0, y: 0 };
    return {
      id: m.taskId,
      type: 'pertTask',
      position: pos,
      draggable: false,
      selectable: true,
      connectable: false,
      data: { metrics: m },
    };
  });

  const metricsByEs = new Map(metrics.map((m) => [m.taskId, m]));

  const rfEdges: Edge[] = taskEdges.map((e) => {
    const s = metricsByEs.get(e.sourceId);
    const t = metricsByEs.get(e.targetId);
    const slack = s && t ? Math.max(0, t.es - s.ef) : 0;
    const critical = Boolean(s?.isCritical && t?.isCritical && slack === 0);
    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: 'default',
      animated: false,
      selectable: false,
      focusable: false,
      label: `H=${slack}`,
      labelStyle: { fontSize: 9, fontWeight: 700, fill: critical ? '#15803d' : '#475569' },
      labelBgStyle: { fill: 'rgba(255,255,255,0.92)' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: critical ? '#16a34a' : '#64748b',
        strokeWidth: critical ? 2.5 : 1.25,
        strokeDasharray: critical ? undefined : '6 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: critical ? '#16a34a' : '#64748b',
        width: 18,
        height: 18,
      },
    };
  });

  return {
    nodes: rfNodes,
    edges: rfEdges,
    metricsById: new Map(metrics.map((m) => [m.taskId, m])),
    projectDuration,
    taskCount: tasks.length,
    edgeCount: taskEdges.length,
  };
}

export const OBRA_COMPLETA_NODE_SIZE = { width: NODE_W, height: NODE_H };
