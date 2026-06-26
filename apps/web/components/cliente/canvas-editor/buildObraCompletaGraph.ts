import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
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
/** Escala horizontal: 1 día de calendario → píxeles (eje X = tiempo). */
const PX_PER_DAY = 22;
const ROW_IN_LANE = 10;
const LANE_BAND = 300;
const PADDING = 40;

function breadcrumbFase(breadcrumb: string): string {
  return breadcrumb.split(' · ')[0]?.trim() || 'Obra';
}

/**
 * X = solo ES (tiempo). Y = franja por fase + filas para tareas que se solapan en el tiempo.
 */
function layoutTimelineSwimlanes(
  metrics: ObraCompletaTaskMetrics[],
): Map<string, { x: number; y: number }> {
  const faseOrder = new Map<string, number>();
  let nextFase = 0;
  for (const m of metrics) {
    const f = breadcrumbFase(m.breadcrumb);
    if (!faseOrder.has(f)) faseOrder.set(f, nextFase++);
  }

  const sorted = [...metrics].sort(
    (a, b) =>
      a.es - b.es ||
      (faseOrder.get(breadcrumbFase(a.breadcrumb)) ?? 0) -
        (faseOrder.get(breadcrumbFase(b.breadcrumb)) ?? 0) ||
      a.ef - b.ef ||
      a.title.localeCompare(b.title),
  );

  const rowEndsByLane = new Map<number, number[]>();
  const positions = new Map<string, { x: number; y: number }>();

  for (const m of sorted) {
    const lane = faseOrder.get(breadcrumbFase(m.breadcrumb)) ?? 0;
    const ends = rowEndsByLane.get(lane) ?? [];
    let row = 0;
    while (row < ends.length && (ends[row] ?? 0) > m.es) row += 1;
    if (row === ends.length) ends.push(m.ef);
    else ends[row] = Math.max(ends[row] ?? 0, m.ef);
    rowEndsByLane.set(lane, ends);

    const laneTop = PADDING + lane * LANE_BAND;
    positions.set(m.taskId, {
      x: PADDING + m.es * PX_PER_DAY,
      y: laneTop + row * (NODE_H + ROW_IN_LANE),
    });
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

function taskCode(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return `T${index + 1}`;
}

/** Holgura total con pasada atrás solo sobre aristas entre tareas (PERT). */
function computeLateTimes(
  tasks: CanvasNode[],
  schedule: Map<string, { es: number; ef: number }>,
  taskEdges: CanvasPrecedenceEdge[],
): Map<string, { ls: number; lf: number; float: number }> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const succ = new Map<string, string[]>();
  for (const t of tasks) succ.set(t.id, []);
  for (const e of taskEdges) {
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
    const row = schedule.get(t.id) ?? { es: 0, ef: dur, isCritical: false };
    const late = lateMap.get(t.id) ?? { ls: row.es, lf: row.ef, float: 0 };
    const manual = Boolean(t.esCritica);
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
      isCritical: manual || late.float === 0,
      code: taskCode(idx),
    };
  });

  let projectDuration = 0;
  for (const m of metrics) projectDuration = Math.max(projectDuration, m.ef);

  const positions = layoutTimelineSwimlanes(metrics);

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

  const metricsById = new Map(metrics.map((m) => [m.taskId, m]));

  const rfEdges: Edge[] = taskEdges.map((e) => {
    const s = metricsById.get(e.sourceId);
    const t = metricsById.get(e.targetId);
    const slack = s && t ? Math.max(0, t.es - s.ef) : 0;
    const critical = Boolean(s?.isCritical && t?.isCritical && slack === 0);
    return {
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: 'smoothstep',
      pathOptions: { offset: 12, borderRadius: 8 },
      animated: false,
      selectable: false,
      focusable: false,
      label: slack === 0 ? 'H0' : `H${slack}`,
      labelStyle: { fontSize: 9, fontWeight: 700, fill: critical ? '#15803d' : '#475569' },
      labelBgStyle: { fill: 'rgba(255,255,255,0.92)' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: critical ? '#16a34a' : '#94a3b8',
        strokeWidth: critical ? 2.5 : 1.25,
        strokeDasharray: critical ? undefined : '5 4',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: critical ? '#16a34a' : '#94a3b8',
        width: 16,
        height: 16,
      },
    };
  });

  return {
    nodes: rfNodes,
    edges: rfEdges,
    metricsById,
    projectDuration,
    taskCount: tasks.length,
    edgeCount: taskEdges.length,
  };
}

export const OBRA_COMPLETA_NODE_SIZE = { width: NODE_W, height: NODE_H };
