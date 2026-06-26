import type { CanvasNode, CanvasNivelTipo, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  collectSubtreeIds,
  edgesForSiblingLevel,
  publicationReviewCategory,
} from './canvasMultinivelHelpers';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';
import {
  absoluteGateForTaskParent,
  computeMacroGateOffsets,
} from './macroGateSchedule';

export type CronogramaItem = {
  id: string;
  title: string;
  faseLabel: string;
  deptLabel: string;
  ambienteLabel: string;
  groupLabel: string;
  estado: string;
  publicada: boolean;
  duracionDias: number;
  startOffset: number;
  endOffset: number;
  isCritical: boolean;
  hasMissingDates: boolean;
  socioLabel?: string;
};

export type CronogramaTreeNode = {
  id: string;
  kind: 'fase' | 'dept' | 'ambiente' | 'tarea';
  label: string;
  depth: number;
  children: CronogramaTreeNode[];
  item?: CronogramaItem;
  startOffset: number;
  endOffset: number;
};

function byIdMap(nodes: CanvasNode[]): Map<string, CanvasNode> {
  return new Map(nodes.map((n) => [n.id, n]));
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

function collectDescendantTasks(nodes: CanvasNode[], rootId: string): CanvasNode[] {
  const ids = collectSubtreeIds(nodes, rootId);
  return nodes.filter((n) => n.type === 'tarea' && ids.has(n.id));
}

function scheduleTasksInContainer(
  containerId: string,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
): Map<string, { es: number; ef: number }> {
  const siblings = nodes.filter((n) => n.parentId === containerId && n.type === 'tarea');
  const result = new Map<string, { es: number; ef: number }>();
  if (siblings.length === 0) return result;

  const localEdges = edgesForSiblingLevel(containerId, nodes, edges);
  const cpm = computeCanvasTaskCpm(siblings, localEdges);

  if (cpm) {
    for (const t of siblings) {
      const row = cpm.byId.get(t.id);
      const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
      const es = row?.es ?? 0;
      result.set(t.id, { es, ef: row?.ef ?? es + dur });
    }
    return result;
  }

  const ordered = [...siblings].sort(
    (a, b) => a.position.x - b.position.x || a.createdAt.localeCompare(b.createdAt),
  );
  let cursor = 0;
  for (const t of ordered) {
    const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
    result.set(t.id, { es: cursor, ef: cursor + dur });
    cursor += dur;
  }
  return result;
}

/** Programación jerárquica: CPM por contenedor de tareas + CPM entre fases. */
export function computeGlobalTaskSchedule(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
): Map<string, { es: number; ef: number; isCritical: boolean }> {
  const tasks = nodes.filter((n) => n.type === 'tarea');
  const byId = byIdMap(nodes);
  const absolute = new Map<string, { es: number; ef: number; isCritical: boolean }>();

  const containerIds = new Set(tasks.map((t) => t.parentId).filter(Boolean) as string[]);
  const localByTask = new Map<string, { es: number; ef: number }>();
  for (const cid of containerIds) {
    for (const [tid, row] of scheduleTasksInContainer(cid, nodes, edges)) {
      localByTask.set(tid, row);
    }
  }

  const gateOffset = computeMacroGateOffsets(nodes, edges, localByTask);

  for (const t of tasks) {
    const dur = Math.max(1, Math.round(t.duracionDias ?? 1));
    const lo = localByTask.get(t.id) ?? { es: 0, ef: dur };
    const gate = absoluteGateForTaskParent(t.parentId, nodes, gateOffset);
    const es = gate + lo.es;
    const ef = gate + lo.ef;
    const containerId = t.parentId;
    let isCritical = Boolean(t.esCritica);
    if (containerId) {
      const localEdges = edgesForSiblingLevel(containerId, nodes, edges);
      const localCpm = computeCanvasTaskCpm(
        nodes.filter((n) => n.parentId === containerId && n.type === 'tarea'),
        localEdges,
      );
      if (localCpm?.byId.get(t.id)?.isCritical) isCritical = true;
    }
    absolute.set(t.id, { es, ef, isCritical });
  }

  return absolute;
}

function labelsForTask(byId: Map<string, CanvasNode>, taskId: string) {
  const etapa = findAncestor(byId, taskId, 'etapa');
  const sector = findAncestor(byId, taskId, 'sector');
  const planta = findAncestor(byId, taskId, 'planta');
  const ambiente = findAncestor(byId, taskId, 'ambiente');
  const dept = sector ?? planta;
  const faseLabel = etapa?.title ?? 'Sin fase';
  const deptLabel = dept?.title ?? 'Sin departamento';
  const ambienteLabel = ambiente?.title ?? 'Sin ambiente';
  const groupLabel = [faseLabel, deptLabel !== faseLabel ? deptLabel : null, ambienteLabel]
    .filter(Boolean)
    .join(' · ');
  return { faseLabel, deptLabel, ambienteLabel, groupLabel };
}

/** Construye ítems de cronograma solo en frontend — sin escribir en DB. */
export function buildCronogramaItems(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null; estado?: string } | undefined>,
): CronogramaItem[] {
  const tasks = nodes.filter((n) => n.type === 'tarea');
  if (tasks.length === 0) return [];

  const byId = byIdMap(nodes);
  const schedule = computeGlobalTaskSchedule(nodes, edges);
  const items: CronogramaItem[] = [];

  for (const t of tasks) {
    const row = schedule.get(t.id);
    const duracion = Math.max(1, Math.round(t.duracionDias ?? 1));
    const startOffset = row?.es ?? 0;
    const endOffset = row?.ef ?? startOffset + duracion;
    const cat = publicationReviewCategory(t, tareaPublicacionByNodeId);
    const labels = labelsForTask(byId, t.id);
    items.push({
      id: t.id,
      title: t.title,
      ...labels,
      estado: t.estadoTarea ?? cat ?? 'pendiente',
      publicada: Boolean(tareaPublicacionByNodeId[t.id]?.publishedAt),
      duracionDias: duracion,
      startOffset,
      endOffset,
      isCritical: Boolean(row?.isCritical),
      hasMissingDates: false,
      socioLabel: t.socioLabel,
    });
  }

  return items.sort(
    (a, b) => a.startOffset - b.startOffset || a.faseLabel.localeCompare(b.faseLabel),
  );
}

function upsertGroup(
  parent: CronogramaTreeNode[],
  id: string,
  kind: CronogramaTreeNode['kind'],
  label: string,
  depth: number,
): CronogramaTreeNode {
  let node = parent.find((n) => n.id === id);
  if (!node) {
    node = { id, kind, label, depth, children: [], startOffset: Infinity, endOffset: 0 };
    parent.push(node);
  }
  return node;
}

function applySpan(node: CronogramaTreeNode, start: number, end: number) {
  node.startOffset = Math.min(node.startOffset, start);
  node.endOffset = Math.max(node.endOffset, end);
  if (!Number.isFinite(node.startOffset)) node.startOffset = start;
}

/** Árbol colapsable: Fase → Departamento → Ambiente → Tareas. */
export function buildCronogramaTree(items: CronogramaItem[]): CronogramaTreeNode[] {
  const roots: CronogramaTreeNode[] = [];

  for (const item of items) {
    const fase = upsertGroup(roots, `fase:${item.faseLabel}`, 'fase', item.faseLabel, 0);
    applySpan(fase, item.startOffset, item.endOffset);

    const dept = upsertGroup(
      fase.children,
      `dept:${item.faseLabel}:${item.deptLabel}`,
      'dept',
      item.deptLabel,
      1,
    );
    applySpan(dept, item.startOffset, item.endOffset);

    const amb =
      item.ambienteLabel !== item.deptLabel
        ? upsertGroup(
            dept.children,
            `amb:${item.faseLabel}:${item.deptLabel}:${item.ambienteLabel}`,
            'ambiente',
            item.ambienteLabel,
            2,
          )
        : dept;

    if (amb.kind === 'ambiente') {
      applySpan(amb, item.startOffset, item.endOffset);
    }

    const taskNode: CronogramaTreeNode = {
      id: item.id,
      kind: 'tarea',
      label: item.title,
      depth: amb.kind === 'ambiente' ? 3 : 2,
      children: [],
      item,
      startOffset: item.startOffset,
      endOffset: item.endOffset,
    };
    amb.children.push(taskNode);
  }

  const sortTree = (nodes: CronogramaTreeNode[]) => {
    nodes.sort((a, b) => a.startOffset - b.startOffset || a.label.localeCompare(b.label));
    for (const n of nodes) {
      if (n.startOffset === Infinity) n.startOffset = 0;
      sortTree(n.children);
    }
  };
  sortTree(roots);
  return roots;
}

export function cronogramaSummary(items: CronogramaItem[]) {
  const totalDuration = items.reduce((max, i) => Math.max(max, i.endOffset), 0);
  const published = items.filter((i) => i.publicada).length;
  const missingDates = items.filter((i) => i.hasMissingDates).length;
  const critical = items.filter((i) => i.isCritical).length;
  const projectEnd = items.reduce((max, i) => Math.max(max, i.endOffset), 0);
  return { totalDuration, published, missingDates, critical, total: items.length, projectEnd };
}

export function offsetToDate(projectStart: Date, offsetDays: number): Date {
  const d = new Date(projectStart);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function formatCronogramaDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function formatCronogramaDateLong(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}
