import type {
  CanvasNode,
  CanvasNivelEstadoLocal,
  CanvasNivelTipo,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  newCanvasEdgeId,
  newCanvasNodeId,
  staggerPosition,
} from '@/components/cliente/canvas-editor/canvasMultinivelHelpers';
import type { GrowsImportNodePreview, ProjectImportPreview } from '@/lib/project/importProjectXml';

export type ProjectCanvasImportBundle = {
  obraNombre: string;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  /** Perfil de canvas inferido desde la jerarquía OutlineNumber del MSP (chain consistente). */
  projectKind: CanvasProjectKind;
};

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

function importPreviewMeta(p: GrowsImportNodePreview): {
  importSourceUid: number;
  importOutlineNumber: string;
} {
  return { importSourceUid: p.sourceUid, importOutlineNumber: p.outlineNumber };
}

/**
 * Crea nodos de canvas desde el preview sin rellenos: el padre en MSP debe existir antes (orden OutlineNumber).
 */
export function buildCanvasImportBundle(preview: ProjectImportPreview): ProjectCanvasImportBundle {
  const sorted = [...preview.nodesPreview].sort((a, b) => compareOutline(parseParts(a), parseParts(b)));
  const uidToCanvasId = new Map<number, string>();
  const nodes: CanvasNode[] = [];

  for (const n of sorted) {
    if (uidToCanvasId.has(n.sourceUid)) continue;

    const pPrevUid = n.parentSourceUid;
    let canvasParentId: string | null =
      pPrevUid != null ? (uidToCanvasId.get(pPrevUid) ?? null) : null;

    /** Padre aún no importado: saltar hasta que llegue una fila válida precedente (MSP inconsistente). */
    if (pPrevUid != null && canvasParentId == null) {
      continue;
    }

    let parentNode = canvasParentId ? (nodes.find((x) => x.id === canvasParentId) ?? null) : null;
    const targetType = previewToCanvasType(n);

    /** Profundidad: raíz obra = nivel 1. */
    const level = canvasParentId == null ? 1 : (parentNode?.level ?? 0) + 1;
    const sib = nodes.filter((x) => x.parentId === canvasParentId).length;
    const id = newCanvasNodeId();

    const tipoOpt = n.semanticHint ? { tipoLabel: n.semanticHint } : {};

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
        ...tipoOpt,
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
        estadoNivel: 'pendiente' as CanvasNivelEstadoLocal,
        avancePct: n.percentComplete ?? undefined,
        ...tipoOpt,
        ...importPreviewMeta(n),
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
    projectKind: preview.adaptiveImportKind,
  };
}
