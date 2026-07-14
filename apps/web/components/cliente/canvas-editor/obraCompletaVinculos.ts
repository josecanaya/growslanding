import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  collectSubtreeIds,
  edgesForSiblingLevel,
  sortSiblingsByPrecedence,
} from './canvasMultinivelHelpers';

function collectDescendantTasks(nodes: CanvasNode[], rootId: string): CanvasNode[] {
  const ids = collectSubtreeIds(nodes, rootId);
  return nodes.filter((n) => n.type === 'tarea' && ids.has(n.id));
}

function bridgeBetweenMacroContainers(
  fromContainerId: string,
  toContainerId: string,
  nodes: CanvasNode[],
  schedule: Map<string, { es: number; ef: number }>,
): CanvasPrecedenceEdge | null {
  const fromTasks = collectDescendantTasks(nodes, fromContainerId);
  const toTasks = collectDescendantTasks(nodes, toContainerId);
  if (fromTasks.length === 0 || toTasks.length === 0) return null;

  let sinkId = fromTasks[0]!.id;
  let maxEf = -Infinity;
  for (const t of fromTasks) {
    const ef = schedule.get(t.id)?.ef ?? 0;
    if (ef > maxEf) {
      maxEf = ef;
      sinkId = t.id;
    }
  }

  let sourceId = toTasks[0]!.id;
  let minEs = Infinity;
  for (const t of toTasks) {
    const es = schedule.get(t.id)?.es ?? 0;
    if (es < minEs) {
      minEs = es;
      sourceId = t.id;
    }
  }

  if (sinkId === sourceId) return null;

  return {
    id: `macro-bridge:${fromContainerId}:${toContainerId}`,
    sourceId: sinkId,
    targetId: sourceId,
    critical: true,
  };
}

function bridgesForChainedSiblings(
  siblings: CanvasNode[],
  parentId: string | null,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  schedule: Map<string, { es: number; ef: number }>,
): CanvasPrecedenceEdge[] {
  if (siblings.length < 2) return [];
  const sorted = sortSiblingsByPrecedence(siblings, edgesForSiblingLevel(parentId, nodes, edges));
  const out: CanvasPrecedenceEdge[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const b = bridgeBetweenMacroContainers(sorted[i - 1]!.id, sorted[i]!.id, nodes, schedule);
    if (b) out.push(b);
  }
  return out;
}

function walkMacroBridges(
  parentId: string | null,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  schedule: Map<string, { es: number; ef: number }>,
  out: CanvasPrecedenceEdge[],
): void {
  const children = nodes.filter((n) => n.parentId === parentId && n.type !== 'tarea');
  const etapas = children.filter((c) => c.type === 'etapa');
  const plantas = children.filter((c) => c.type === 'planta');

  if (etapas.length >= 2) {
    out.push(...bridgesForChainedSiblings(etapas, parentId, nodes, edges, schedule));
  }
  if (plantas.length >= 2) {
    out.push(...bridgesForChainedSiblings(plantas, parentId, nodes, edges, schedule));
  }

  for (const c of children) {
    walkMacroBridges(c.id, nodes, edges, schedule, out);
  }
}

/** Aristas de visualización: fin de macro-contenedor → inicio del siguiente (fase / piso). */
export function collectMacroBridgeTaskEdges(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  schedule: Map<string, { es: number; ef: number }>,
): CanvasPrecedenceEdge[] {
  const out: CanvasPrecedenceEdge[] = [];
  walkMacroBridges(null, nodes, edges, schedule, out);
  return out;
}

export function mergeUniqueEdges(
  ...groups: CanvasPrecedenceEdge[][]
): CanvasPrecedenceEdge[] {
  const seen = new Set<string>();
  const out: CanvasPrecedenceEdge[] = [];
  for (const g of groups) {
    for (const e of g) {
      const k = `${e.sourceId}|${e.targetId}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

/** Cadena FS solo vista entre tareas hermanas (mismo contenedor) si no hay vínculos en el canvas. */
export function collectImplicitAmbienteChainEdges(
  nodes: CanvasNode[],
  userTaskEdges: CanvasPrecedenceEdge[],
): CanvasPrecedenceEdge[] {
  const tasks = nodes.filter((n) => n.type === 'tarea');
  const byParent = new Map<string, CanvasNode[]>();
  for (const t of tasks) {
    const key = t.parentId ?? '__sin_padre__';
    const list = byParent.get(key) ?? [];
    list.push(t);
    byParent.set(key, list);
  }

  const out: CanvasPrecedenceEdge[] = [];
  for (const [parentKey, siblings] of byParent) {
    if (siblings.length < 2) continue;

    const ids = new Set(siblings.map((s) => s.id));
    const localUser = userTaskEdges.filter(
      (e) => ids.has(e.sourceId) && ids.has(e.targetId),
    );
    if (localUser.length > 0) continue;

    const sorted = [...siblings].sort(
      (a, b) =>
        a.position.x - b.position.x ||
        a.position.y - b.position.y ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.title.localeCompare(b.title),
    );

    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1]!;
      const b = sorted[i]!;
      out.push({
        id: `implicit-ambiente:${parentKey}:${a.id}:${b.id}`,
        sourceId: a.id,
        targetId: b.id,
        critical: false,
      });
    }
  }

  return out;
}

export type EdgeKind = 'user' | 'macro' | 'implicit';

export function edgeKind(id: string): EdgeKind {
  if (id.startsWith('macro-bridge:')) return 'macro';
  if (id.startsWith('implicit-ambiente:')) return 'implicit';
  return 'user';
}
