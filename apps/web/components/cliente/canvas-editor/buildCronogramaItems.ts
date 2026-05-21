import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';
import { publicationReviewCategory } from './canvasMultinivelHelpers';

export type CronogramaItem = {
  id: string;
  title: string;
  groupLabel: string;
  estado: string;
  publicada: boolean;
  duracionDias: number;
  startOffset: number;
  endOffset: number;
  isCritical: boolean;
  hasMissingDates: boolean;
};

function getTaskGroupLabel(nodes: CanvasNode[], taskId: string): string {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const parts: string[] = [];
  let cur = byId.get(taskId);
  while (cur?.parentId) {
    const parent = byId.get(cur.parentId);
    if (!parent) break;
    if (parent.type === 'etapa' || parent.type === 'ambiente') {
      parts.unshift(parent.title);
    }
    cur = parent;
  }
  return parts.length > 0 ? parts.join(' · ') : 'Sin agrupar';
}

function taskEdgesForAllTasks(
  tasks: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
): CanvasPrecedenceEdge[] {
  const taskIds = new Set(tasks.map((t) => t.id));
  return edges.filter((e) => taskIds.has(e.sourceId) && taskIds.has(e.targetId));
}

function hierarchyOrder(nodes: CanvasNode[], tasks: CanvasNode[]): CanvasNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depthOf = (id: string): number => {
    let d = 0;
    let cur = byId.get(id);
    while (cur?.parentId) {
      d += 1;
      cur = byId.get(cur.parentId);
    }
    return d;
  };
  return [...tasks].sort((a, b) => {
    const da = depthOf(a.id);
    const db = depthOf(b.id);
    if (da !== db) return da - db;
    if (a.level !== b.level) return a.level - b.level;
    return a.position.x - b.position.x || a.createdAt.localeCompare(b.createdAt);
  });
}

/** Construye ítems de cronograma solo en frontend — sin escribir en DB. */
export function buildCronogramaItems(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null; estado?: string } | undefined>,
): CronogramaItem[] {
  const tasks = nodes.filter((n) => n.type === 'tarea');
  if (tasks.length === 0) return [];

  const taskEdges = taskEdgesForAllTasks(tasks, edges);
  const cpm = computeCanvasTaskCpm(tasks, taskEdges);

  const items: CronogramaItem[] = [];
  let cursor = 0;

  if (cpm) {
    for (const t of tasks) {
      const row = cpm.byId.get(t.id);
      const duracion = Math.max(1, Math.round(t.duracionDias ?? 1));
      const startOffset = row?.es ?? cursor;
      const endOffset = row?.ef ?? startOffset + duracion;
      const cat = publicationReviewCategory(t, tareaPublicacionByNodeId);
      items.push({
        id: t.id,
        title: t.title,
        groupLabel: getTaskGroupLabel(nodes, t.id),
        estado: t.estadoTarea ?? cat ?? 'pendiente',
        publicada: Boolean(tareaPublicacionByNodeId[t.id]?.publishedAt),
        duracionDias: duracion,
        startOffset,
        endOffset,
        isCritical: Boolean(row?.isCritical || t.esCritica),
        hasMissingDates: false,
      });
      cursor = Math.max(cursor, endOffset);
    }
    return items.sort((a, b) => a.startOffset - b.startOffset || a.groupLabel.localeCompare(b.groupLabel));
  }

  const ordered = hierarchyOrder(nodes, tasks);
  for (const t of ordered) {
    const duracion = Math.max(1, Math.round(t.duracionDias ?? 1));
    const startOffset = cursor;
    const endOffset = startOffset + duracion;
    const cat = publicationReviewCategory(t, tareaPublicacionByNodeId);
    items.push({
      id: t.id,
      title: t.title,
      groupLabel: getTaskGroupLabel(nodes, t.id),
      estado: t.estadoTarea ?? cat ?? 'pendiente',
      publicada: Boolean(tareaPublicacionByNodeId[t.id]?.publishedAt),
      duracionDias: duracion,
      startOffset,
      endOffset,
      isCritical: Boolean(t.esCritica),
      hasMissingDates: true,
    });
    cursor = endOffset;
  }
  return items;
}

export function cronogramaSummary(items: CronogramaItem[]) {
  const totalDuration = items.reduce((max, i) => Math.max(max, i.endOffset), 0);
  const published = items.filter((i) => i.publicada).length;
  const missingDates = items.filter((i) => i.hasMissingDates).length;
  const critical = items.filter((i) => i.isCritical).length;
  return { totalDuration, published, missingDates, critical, total: items.length };
}
