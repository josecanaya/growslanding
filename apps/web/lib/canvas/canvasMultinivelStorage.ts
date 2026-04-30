import type {
  CanvasMultinivelPersisted,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import { CANVAS_MULTINIVEL_STORAGE_VERSION } from '@/lib/types/canvasMultinivel';

/** Una clave estable por obra: la versión va dentro del JSON (`v`). */
export const canvasMultinivelStorageKey = (obraId: string) => `grows:canvas-multinivel:${obraId}`;

function newLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeNode(n: CanvasNode): CanvasNode {
  if (n.type === 'tarea') {
    const checklist = Array.isArray(n.checklist)
      ? n.checklist.map((c) => ({
          ...c,
          id: typeof c?.id === 'string' ? c.id : newLocalId('cl'),
          label: typeof c?.label === 'string' ? c.label : 'Ítem',
          done: Boolean(c?.done),
        }))
      : [];
    return { ...n, checklist, esCritica: Boolean(n.esCritica) };
  }
  const { checklist: _chk, esCritica: _crit, ...rest } = n;
  return rest;
}

/** Lee JSON guardado con `v` 1 o 2 y devuelve siempre estado v2. */
export function loadCanvasMultinivel(obraId: string): CanvasMultinivelPersisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(canvasMultinivelStorageKey(obraId));
    if (!raw) return tryMigrateLegacyV1Key(obraId);
    const parsed = JSON.parse(raw) as {
      v?: number;
      obraNombre?: string;
      nodes?: CanvasNode[];
      pathIds?: string[];
      edges?: CanvasPrecedenceEdge[];
    };
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.pathIds)) return null;

    let next: CanvasMultinivelPersisted;
    if (parsed.v === 1) {
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION as 2,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map((n) => normalizeNode({ ...n, checklist: [], esCritica: false })),
        pathIds: parsed.pathIds,
        edges: [],
      };
    } else if (parsed.v === CANVAS_MULTINIVEL_STORAGE_VERSION) {
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map(normalizeNode),
        pathIds: parsed.pathIds,
        edges: Array.isArray(parsed.edges) ? sanitizeEdges(parsed.nodes, parsed.edges) : [],
      };
    } else {
      return null;
    }

    const sanitized = sanitizePersisted(next);
    if (parsed.v === 1) {
      queueMicrotask(() => saveCanvasMultinivel(obraId, sanitized));
    }
    return sanitized;
  } catch {
    return null;
  }
}

/** Soporte primera iteración guardada como `…:v1:${obraId}`. */
function tryMigrateLegacyV1Key(obraId: string): CanvasMultinivelPersisted | null {
  try {
    const legacy = localStorage.getItem(`grows:canvas-multinivel:v1:${obraId}`);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy) as {
      obraNombre?: string;
      nodes: CanvasNode[];
      pathIds: string[];
    };
    if (!parsed?.nodes || !parsed.pathIds) return null;
    const next: CanvasMultinivelPersisted = {
      v: CANVAS_MULTINIVEL_STORAGE_VERSION,
      obraNombre: parsed.obraNombre ?? 'Obra',
      nodes: parsed.nodes.map((n) => normalizeNode({ ...n, checklist: [], esCritica: false })),
      pathIds: parsed.pathIds,
      edges: [],
    };
    const sanitized = sanitizePersisted(next);
    queueMicrotask(() => {
      saveCanvasMultinivel(obraId, sanitized);
      localStorage.removeItem(`grows:canvas-multinivel:v1:${obraId}`);
    });
    return sanitized;
  } catch {
    return null;
  }
}

export function saveCanvasMultinivel(obraId: string, data: CanvasMultinivelPersisted): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CanvasMultinivelPersisted = {
      ...data,
      v: CANVAS_MULTINIVEL_STORAGE_VERSION,
      nodes: data.nodes.map(normalizeNode),
      edges: sanitizeEdges(data.nodes, data.edges ?? []),
    };
    localStorage.setItem(canvasMultinivelStorageKey(obraId), JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

function sanitizeEdges(nodes: CanvasNode[], edges: CanvasPrecedenceEdge[]): CanvasPrecedenceEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ok: CanvasPrecedenceEdge[] = [];
  const seen = new Set<string>();
  for (const e of edges) {
    if (!e?.id || !e.sourceId || !e.targetId) continue;
    if (e.sourceId === e.targetId) continue;
    const s = byId.get(e.sourceId);
    const t = byId.get(e.targetId);
    if (!s || !t) continue;
    if (s.parentId !== t.parentId) continue;
    const dupK = `${e.sourceId}->${e.targetId}`;
    if (seen.has(dupK)) continue;
    seen.add(dupK);
    ok.push({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, critical: Boolean(e.critical) });
  }
  return ok;
}

/** Eliminar path inválido o nodos rotos tras borrados */
function sanitizePersisted(data: CanvasMultinivelPersisted): CanvasMultinivelPersisted {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const pathIds: string[] = [];
  for (const id of data.pathIds) {
    const n = byId.get(id);
    if (!n) break;
    if (pathIds.length === 0) {
      if (n.parentId === null && n.type === 'etapa') pathIds.push(id);
      else break;
      continue;
    }
    const parent = byId.get(pathIds[pathIds.length - 1]!);
    if (!parent || n.parentId !== parent.id) break;
    pathIds.push(id);
  }
  const nodesFiltered = data.nodes.filter((n) => n.id);
  const edges = sanitizeEdges(nodesFiltered, data.edges ?? []);
  return {
    ...data,
    nodes: nodesFiltered.map(normalizeNode),
    pathIds,
    edges,
  };
}

export function clearCanvasMultinivelStorage(obraId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(canvasMultinivelStorageKey(obraId));
}

export type CanvasMultinivelSnapshot = CanvasMultinivelPersisted;

export function countChildren(nodes: CanvasNode[], parentId: string | null): number {
  return nodes.filter((n) => n.parentId === parentId).length;
}
