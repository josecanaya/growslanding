import type { CanvasNode, CanvasNivelTipo, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  collectSubtreeIds,
  edgesForSiblingLevel,
  sortSiblingsByPrecedence,
} from './canvasMultinivelHelpers';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';

/** Fases y pisos siempre en cadena fin-a-inicio (además de vínculos explícitos del canvas). */
const MACRO_CHAIN_TYPES = new Set<CanvasNivelTipo>(['etapa', 'planta']);

function collectDescendantTasks(nodes: CanvasNode[], rootId: string): CanvasNode[] {
  const ids = collectSubtreeIds(nodes, rootId);
  return nodes.filter((n) => n.type === 'tarea' && ids.has(n.id));
}

function subtreeSpanDays(
  nodeId: string,
  nodes: CanvasNode[],
  localByTask: Map<string, { es: number; ef: number }>,
): number {
  const tasks = collectDescendantTasks(nodes, nodeId);
  let maxEf = 0;
  for (const t of tasks) {
    const lo = localByTask.get(t.id);
    if (lo) maxEf = Math.max(maxEf, lo.ef);
  }
  return Math.max(1, maxEf);
}

function mandatoryChainEdges(sorted: CanvasNode[]): CanvasPrecedenceEdge[] {
  const out: CanvasPrecedenceEdge[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    out.push({
      id: `macro-chain:${a.id}:${b.id}`,
      sourceId: a.id,
      targetId: b.id,
      critical: false,
    });
  }
  return out;
}

function mergePrecedenceEdges(
  explicit: CanvasPrecedenceEdge[],
  extra: CanvasPrecedenceEdge[],
): CanvasPrecedenceEdge[] {
  const seen = new Set<string>();
  const out: CanvasPrecedenceEdge[] = [];
  for (const e of [...explicit, ...extra]) {
    const k = `${e.sourceId}|${e.targetId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

/**
 * Programa hermanos etapa/planta: CPM con aristas del usuario + cadena obligatoria en orden del lienzo.
 */
function scheduleChainedMacroSiblings(
  siblings: CanvasNode[],
  parentId: string | null,
  parentAbs: number,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  localByTask: Map<string, { es: number; ef: number }>,
  gateOffset: Map<string, number>,
): void {
  if (siblings.length === 0) return;

  const siblingIds = new Set(siblings.map((s) => s.id));
  const sorted = sortSiblingsByPrecedence(
    siblings,
    edgesForSiblingLevel(parentId, nodes, edges),
  );
  const explicit = edgesForSiblingLevel(parentId, nodes, edges).filter(
    (e) => siblingIds.has(e.sourceId) && siblingIds.has(e.targetId),
  );
  const merged = mergePrecedenceEdges(explicit, mandatoryChainEdges(sorted));

  const pseudo: CanvasNode[] = sorted.map((s) => ({
    ...s,
    duracionDias: subtreeSpanDays(s.id, nodes, localByTask),
  }));
  const cpm = computeCanvasTaskCpm(pseudo, merged);

  for (const s of sorted) {
    const rel = cpm?.byId.get(s.id)?.es ?? 0;
    const abs = parentAbs + rel;
    gateOffset.set(s.id, abs);
    propagateGateIntoSubtree(s.id, abs, nodes, edges, localByTask, gateOffset);
  }
}

/** Baja por la jerarquía aplicando cadena en pisos y paralelismo en sectores/ambientes. */
function propagateGateIntoSubtree(
  containerId: string,
  containerAbs: number,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  localByTask: Map<string, { es: number; ef: number }>,
  gateOffset: Map<string, number>,
): void {
  const children = nodes.filter((n) => n.parentId === containerId && n.type !== 'tarea');
  const plantas = children.filter((c) => c.type === 'planta');
  const etapasHijas = children.filter((c) => c.type === 'etapa');

  if (etapasHijas.length) {
    scheduleChainedMacroSiblings(
      etapasHijas,
      containerId,
      containerAbs,
      nodes,
      edges,
      localByTask,
      gateOffset,
    );
  }
  if (plantas.length) {
    scheduleChainedMacroSiblings(
      plantas,
      containerId,
      containerAbs,
      nodes,
      edges,
      localByTask,
      gateOffset,
    );
  }

  const chainedIds = new Set([...plantas, ...etapasHijas].map((x) => x.id));
  for (const c of children) {
    if (chainedIds.has(c.id)) continue;
    gateOffset.set(c.id, containerAbs);
    propagateGateIntoSubtree(c.id, containerAbs, nodes, edges, localByTask, gateOffset);
  }
}

function gateForTaskParent(
  parentId: string | null,
  byId: Map<string, CanvasNode>,
  gateOffset: Map<string, number>,
): number {
  let cur = parentId;
  while (cur) {
    const g = gateOffset.get(cur);
    if (g != null) return g;
    cur = byId.get(cur)?.parentId ?? null;
  }
  return 0;
}

export function computeMacroGateOffsets(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  localByTask: Map<string, { es: number; ef: number }>,
): Map<string, number> {
  const gateOffset = new Map<string, number>();
  const rootEtapas = nodes.filter((n) => n.type === 'etapa' && n.parentId == null);
  scheduleChainedMacroSiblings(rootEtapas, null, 0, nodes, edges, localByTask, gateOffset);
  return gateOffset;
}

export function absoluteGateForTaskParent(
  parentId: string | null,
  nodes: CanvasNode[],
  gateOffset: Map<string, number>,
): number {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return gateForTaskParent(parentId, byId, gateOffset);
}

export function isMacroChainType(type: CanvasNivelTipo): boolean {
  return MACRO_CHAIN_TYPES.has(type);
}
