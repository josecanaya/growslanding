import type {
  CanvasNode,
  CanvasNivelEstadoLocal,
  CanvasNivelTipo,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  childTypeForContainer,
  newCanvasEdgeId,
  newCanvasNodeId,
  staggerPosition,
} from '@/components/cliente/canvas-editor/canvasMultinivelHelpers';
import type { GrowsImportNodePreview, ProjectImportPreview } from '@/lib/project/importProjectXml';

export type ProjectCanvasImportBundle = {
  obraNombre: string;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
};

const TYPE_ORDER: CanvasNivelTipo[] = ['etapa', 'planta', 'sector', 'ambiente', 'tarea'];

function orderOf(t: CanvasNivelTipo): number {
  return TYPE_ORDER.indexOf(t);
}

function previewToCanvasType(n: GrowsImportNodePreview): CanvasNivelTipo {
  if (n.growsType === 'root') return 'etapa';
  return n.growsType as CanvasNivelTipo;
}

function compareOutline(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function parseParts(n: GrowsImportNodePreview): number[] {
  return n.outlineParts?.length
    ? n.outlineParts
    : n.outlineNumber
        .split('.')
        .map((s) => parseInt(s.trim(), 10))
        .filter((x) => Number.isFinite(x));
}

/** Todas las hojas tarea bajo un UID de preview (incluye nietos) */
function collectLeavesUnder(
  rootUid: number,
  children: Map<number | null, GrowsImportNodePreview[]>,
): GrowsImportNodePreview[] {
  const out: GrowsImportNodePreview[] = [];
  const stack = [...(children.get(rootUid) ?? [])];
  while (stack.length) {
    const x = stack.pop()!;
    const ch = children.get(x.sourceUid) ?? [];
    if (ch.length === 0 && previewToCanvasType(x) === 'tarea') out.push(x);
    else stack.push(...ch);
  }
  return out;
}

function importPreviewMeta(p: GrowsImportNodePreview): {
  importSourceUid: number;
  importOutlineNumber: string;
} {
  return { importSourceUid: p.sourceUid, importOutlineNumber: p.outlineNumber };
}

function compoundTitle(ancestor: GrowsImportNodePreview, leaf: GrowsImportNodePreview): string {
  if (leaf.sourceUid === ancestor.sourceUid) return leaf.name;
  return `${ancestor.name} · ${leaf.name}`;
}

/** Rellena planta→sector→ambiente hasta que el padre pueda colgar targetType */
function resolveCanvasParentForTarget(
  initialParentId: string | null,
  initialParentNode: CanvasNode | null,
  targetType: CanvasNivelTipo,
  fillerLabel: string,
  nodes: CanvasNode[],
  projectKind: CanvasProjectKind,
): { parentId: string | null; parentNode: CanvasNode | null } {
  let pid = initialParentId;
  let pnode = initialParentNode;

  let need = childTypeForContainer(pnode, projectKind);
  while (need != null && need !== targetType) {
    if (orderOf(need) >= orderOf(targetType)) break;
    const sib = nodes.filter((n) => n.parentId === pid).length;
    const id = newCanvasNodeId();
    const level = pnode ? pnode.level + 1 : 1;
    const filler: CanvasNode = {
      id,
      parentId: pid,
      level,
      type: need,
      title: `${fillerLabel} (${need})`,
      position: staggerPosition(sib),
      createdAt: new Date().toISOString(),
      estadoNivel: 'pendiente' as CanvasNivelEstadoLocal,
    };
    nodes.push(filler);
    pid = id;
    pnode = filler;
    need = childTypeForContainer(pnode, projectKind);
  }

  return { parentId: pid, parentNode: pnode };
}

export function buildCanvasImportBundle(
  preview: ProjectImportPreview,
  projectKind: CanvasProjectKind = 'edificio_multifamiliar',
): ProjectCanvasImportBundle {
  const sorted = [...preview.nodesPreview].sort((a, b) => compareOutline(parseParts(a), parseParts(b)));
  const byUid = new Map(sorted.map((n) => [n.sourceUid, n]));
  const children = new Map<number | null, GrowsImportNodePreview[]>();
  for (const n of sorted) {
    const k = n.parentSourceUid ?? null;
    if (!children.has(k)) children.set(k, []);
    children.get(k)!.push(n);
  }
  for (const [, arr] of children) {
    arr.sort((a, b) => compareOutline(parseParts(a), parseParts(b)));
  }

  const nodes: CanvasNode[] = [];
  const uidToCanvasId = new Map<number, string>();

  const getNode = (id: string | null): CanvasNode | null =>
    id ? (nodes.find((x) => x.id === id) ?? null) : null;

  for (const n of sorted) {
    if (uidToCanvasId.has(n.sourceUid)) continue;

    const targetType = previewToCanvasType(n);
    const pPrevUid = n.parentSourceUid;

    let canvasParentId: string | null = pPrevUid != null ? (uidToCanvasId.get(pPrevUid) ?? null) : null;
    let canvasParentNode = getNode(canvasParentId);

    if (pPrevUid != null && !canvasParentId) {
      continue;
    }

    /** Raíz del árbol preview (sin padre MSP) */
    if (pPrevUid == null) {
      if (targetType === 'etapa') {
        const sib = nodes.filter((x) => x.parentId === null).length;
        const id = newCanvasNodeId();
        nodes.push({
          id,
          parentId: null,
          level: 1,
          type: 'etapa',
          title: n.name,
          position: staggerPosition(sib),
          createdAt: new Date().toISOString(),
          estadoNivel: 'pendiente',
          avancePct: n.percentComplete ?? undefined,
        });
        uidToCanvasId.set(n.sourceUid, id);
        continue;
      }
      const r = resolveCanvasParentForTarget(null, null, targetType, n.name, nodes, projectKind);
      canvasParentId = r.parentId;
      canvasParentNode = r.parentNode;
    }

    if (canvasParentId != null && !canvasParentNode) continue;

    /** Project coloca contenedor bajo ambiente Grows: aplanar a tareas */
    if (canvasParentNode?.type === 'ambiente' && targetType !== 'tarea') {
      const leaves = collectLeavesUnder(n.sourceUid, children);
      const ambId = canvasParentNode.id;
      const list = leaves.length > 0 ? leaves : [];
      for (const leaf of list) {
        if (previewToCanvasType(leaf) !== 'tarea') continue;
        if (uidToCanvasId.has(leaf.sourceUid)) continue;
        const sib = nodes.filter((x) => x.parentId === ambId).length;
        const id = newCanvasNodeId();
        nodes.push({
          id,
          parentId: ambId,
          level: canvasParentNode.level + 1,
          type: 'tarea',
          title: compoundTitle(n, leaf),
          position: staggerPosition(sib),
          createdAt: new Date().toISOString(),
          estadoTarea: leaf.status,
          duracionDias: leaf.durationDays ?? 1,
          checklist: [],
          esCritica: false,
          ...importPreviewMeta(leaf),
        });
        uidToCanvasId.set(leaf.sourceUid, id);
      }
      continue;
    }

    let need = childTypeForContainer(canvasParentNode, projectKind);
    if (need == null) continue;

    if (orderOf(targetType) < orderOf(need)) {
      if (need === 'tarea' && !n.isLeaf && canvasParentNode?.type === 'ambiente') {
        const leaves = collectLeavesUnder(n.sourceUid, children);
        const ambId = canvasParentNode.id;
        for (const leaf of leaves) {
          if (uidToCanvasId.has(leaf.sourceUid)) continue;
          const sib = nodes.filter((x) => x.parentId === ambId).length;
          const id = newCanvasNodeId();
          nodes.push({
            id,
            parentId: ambId,
            level: canvasParentNode.level + 1,
            type: 'tarea',
            title: compoundTitle(n, leaf),
            position: staggerPosition(sib),
            createdAt: new Date().toISOString(),
            estadoTarea: leaf.status,
            duracionDias: leaf.durationDays ?? 1,
            checklist: [],
            esCritica: false,
            ...importPreviewMeta(leaf),
          });
          uidToCanvasId.set(leaf.sourceUid, id);
        }
      }
      continue;
    }

    const resolved = resolveCanvasParentForTarget(
      canvasParentId,
      canvasParentNode,
      targetType,
      n.name,
      nodes,
      projectKind,
    );
    canvasParentId = resolved.parentId;
    canvasParentNode = resolved.parentNode;

    need = childTypeForContainer(canvasParentNode, projectKind);
    if (need !== targetType) continue;

    const sib = nodes.filter((x) => x.parentId === canvasParentId).length;
    const id = newCanvasNodeId();
    const level = canvasParentNode ? canvasParentNode.level + 1 : 1;

    if (targetType === 'tarea') {
      nodes.push({
        id,
        parentId: canvasParentId,
        level,
        type: 'tarea',
        title: n.name,
        position: staggerPosition(sib),
        createdAt: new Date().toISOString(),
        estadoTarea: n.status,
        duracionDias: n.durationDays ?? 1,
        checklist: [],
        esCritica: false,
        ...importPreviewMeta(n),
      });
    } else {
      nodes.push({
        id,
        parentId: canvasParentId,
        level,
        type: targetType,
        title: n.name,
        position: staggerPosition(sib),
        createdAt: new Date().toISOString(),
        estadoNivel: 'pendiente',
        avancePct: n.percentComplete ?? undefined,
      });
    }
    uidToCanvasId.set(n.sourceUid, id);
  }

  const edgeSeen = new Set<string>();
  const edges: CanvasPrecedenceEdge[] = [];
  for (const pe of preview.edgesPreview) {
    if (pe.kind !== 'valid') continue;
    const sid = uidToCanvasId.get(pe.sourceUid);
    const tid = uidToCanvasId.get(pe.targetUid);
    if (!sid || !tid) continue;
    const key = `${sid}->${tid}`;
    if (edgeSeen.has(key)) continue;
    edgeSeen.add(key);
    edges.push({
      id: newCanvasEdgeId(),
      sourceId: sid,
      targetId: tid,
      critical: false,
    });
  }

  return {
    obraNombre: preview.projectName,
    nodes,
    edges,
  };
}
