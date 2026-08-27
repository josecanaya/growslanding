import type {
  CanvasBudgetGroup,
  CanvasMultinivelPersisted,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import { CANVAS_MULTINIVEL_STORAGE_VERSION, isCanvasEstadoNode } from '@/lib/types/canvasMultinivel';
import { normalizeCanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';

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
    const out: CanvasNode = { ...n, checklist, esCritica: Boolean(n.esCritica) };
    if (n.budgetGroupId) out.budgetGroupId = n.budgetGroupId;
    if (n.importSourceUid != null) out.importSourceUid = n.importSourceUid;
    if (n.importOutlineNumber) out.importOutlineNumber = n.importOutlineNumber;
    if (n.transformKind) out.transformKind = n.transformKind;
    if (n.fromNodeId) out.fromNodeId = n.fromNodeId;
    if (n.toNodeId) out.toNodeId = n.toNodeId;
    if (n.executorKind) out.executorKind = n.executorKind;
    if (n.executorRef) out.executorRef = n.executorRef;
    if (n.graphStatus) out.graphStatus = n.graphStatus;
    if (n.energyUnitId) out.energyUnitId = n.energyUnitId;
    if (n.energyQuantity != null) out.energyQuantity = n.energyQuantity;
    if (n.capitalAmount != null) out.capitalAmount = n.capitalAmount;
    if (n.capitalCurrency) out.capitalCurrency = n.capitalCurrency;
    if (n.orquestador) out.orquestador = { ...n.orquestador };
    return out;
  }
  if (isCanvasEstadoNode(n)) {
    return {
      ...n,
      graphStatus: n.graphStatus ?? 'fantasma',
    };
  }
  const { checklist: _chk, esCritica: _crit, budgetGroupId: _bg, importSourceUid: _iu, importOutlineNumber: _io, wfPos: _wf, ...rest } = n;
  return rest;
}

function sanitizeBudgetGroups(groups: unknown): CanvasBudgetGroup[] {
  if (!Array.isArray(groups)) return [];
  const seen = new Set<string>();
  const out: CanvasBudgetGroup[] = [];
  for (const g of groups) {
    if (!g || typeof g !== 'object') continue;
    const id = typeof (g as { id?: unknown }).id === 'string' ? (g as { id: string }).id : '';
    const name = typeof (g as { name?: unknown }).name === 'string' ? (g as { name: string }).name : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const description =
      typeof (g as { description?: unknown }).description === 'string'
        ? (g as { description: string }).description
        : undefined;
    const createdAt =
      typeof (g as { createdAt?: unknown }).createdAt === 'string'
        ? (g as { createdAt: string }).createdAt
        : new Date().toISOString();
    out.push({ id, name: name.trim() || 'Grupo', description, createdAt });
  }
  return out;
}

/** Lee JSON guardado v1–v4 y devuelve estado v4. */
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
      budgetGroups?: unknown;
      projectKind?: string;
    };
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.pathIds)) return null;

    let next: CanvasMultinivelPersisted;
    if (parsed.v === 1) {
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map((n) => normalizeNode({ ...n, checklist: [], esCritica: false })),
        pathIds: parsed.pathIds,
        edges: [],
        budgetGroups: [],
        projectKind: 'edificio_multifamiliar',
      };
    } else if (parsed.v === 2) {
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map(normalizeNode),
        pathIds: parsed.pathIds,
        edges: Array.isArray(parsed.edges) ? sanitizeEdges(parsed.nodes, parsed.edges) : [],
        budgetGroups: [],
        projectKind: 'edificio_multifamiliar',
      };
    } else if (parsed.v === 3) {
      const rawGroups =
        'budgetGroups' in parsed && Array.isArray(parsed.budgetGroups) ? parsed.budgetGroups : [];
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map(normalizeNode),
        pathIds: parsed.pathIds,
        edges: Array.isArray(parsed.edges) ? sanitizeEdges(parsed.nodes, parsed.edges) : [],
        budgetGroups: sanitizeBudgetGroups(rawGroups),
        projectKind: 'edificio_multifamiliar',
      };
    } else if (parsed.v === CANVAS_MULTINIVEL_STORAGE_VERSION) {
      const rawGroups =
        'budgetGroups' in parsed && Array.isArray((parsed as { budgetGroups?: unknown }).budgetGroups)
          ? sanitizeBudgetGroups((parsed as { budgetGroups: unknown[] }).budgetGroups)
          : [];
      next = {
        v: CANVAS_MULTINIVEL_STORAGE_VERSION,
        obraNombre: parsed.obraNombre ?? 'Obra',
        nodes: parsed.nodes.map(normalizeNode),
        pathIds: parsed.pathIds,
        edges: Array.isArray(parsed.edges) ? sanitizeEdges(parsed.nodes, parsed.edges) : [],
        budgetGroups: rawGroups,
        projectKind: normalizeCanvasProjectKind(parsed.projectKind),
      };
    } else {
      return null;
    }

    const sanitized = sanitizePersisted(next);
    if (parsed.v === 1 || parsed.v === 2 || parsed.v === 3) {
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
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
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
    const nodesNorm = data.nodes.map(normalizeNode);
    const groups = sanitizeBudgetGroups(data.budgetGroups ?? []);
    const payload: CanvasMultinivelPersisted = {
      ...data,
      v: CANVAS_MULTINIVEL_STORAGE_VERSION,
      nodes: nodesNorm,
      pathIds: data.pathIds,
      edges: sanitizeEdges(nodesNorm, data.edges ?? []),
      budgetGroups: groups,
      projectKind: normalizeCanvasProjectKind(data.projectKind),
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
    // Precedencias entre hermanos (mismo padre) O precedencias globales tarea→tarea
    // (vista "Obra completa": permiten conectar tareas de distintos contenedores).
    const bothTasks = s.type === 'tarea' && t.type === 'tarea';
    if (!bothTasks && s.parentId !== t.parentId) continue;
    const dupK = `${e.sourceId}->${e.targetId}`;
    if (seen.has(dupK)) continue;
    seen.add(dupK);
    ok.push({ id: e.id, sourceId: e.sourceId, targetId: e.targetId, critical: Boolean(e.critical) });
  }
  return ok;
}

/** Arma un snapshot v4 saneado listo para persistir (local o API). */
export function composeCanvasPersisted(partial: {
  obraNombre: string;
  nodes: CanvasNode[];
  pathIds: string[];
  edges: CanvasPrecedenceEdge[];
  budgetGroups: CanvasBudgetGroup[];
  projectKind: string;
}): CanvasMultinivelPersisted {
  return sanitizePersisted({
    v: CANVAS_MULTINIVEL_STORAGE_VERSION,
    obraNombre: partial.obraNombre,
    nodes: partial.nodes,
    pathIds: partial.pathIds,
    edges: partial.edges ?? [],
    budgetGroups: partial.budgetGroups ?? [],
    projectKind: normalizeCanvasProjectKind(partial.projectKind),
  });
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
  const nodesNorm = nodesFiltered.map(normalizeNode);
  const groups = sanitizeBudgetGroups(data.budgetGroups ?? []);
  return {
    ...data,
    v: CANVAS_MULTINIVEL_STORAGE_VERSION,
    nodes: nodesNorm,
    pathIds,
    edges,
    budgetGroups: groups,
    projectKind: normalizeCanvasProjectKind(data.projectKind),
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
