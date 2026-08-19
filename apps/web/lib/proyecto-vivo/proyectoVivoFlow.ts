import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { TareaCPMResultado } from '@/lib/utils/cpm';

const ESTADO_W = 160;
const TRANS_W = 148;
const TRANS_H = 48;
const GAP_X = 72;
const GAP_Y = 40;

export type ProyectoVivoLente = 'crecimiento' | 'tiempo';

export type ProyectoVivoFlowOpts = {
  lente?: ProyectoVivoLente;
  fronteraIds?: Set<string>;
  cpmById?: Map<string, TareaCPMResultado>;
};

export type ProyectoVivoFlowData = {
  nodes: Node[];
  edges: Edge[];
};

function layoutChain(snapshot: CanvasMultinivelPersisted): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const estados = snapshot.nodes.filter(isCanvasEstadoNode);
  const idea = estados.find((e) => e.title.toLowerCase() === 'idea') ?? estados[0];
  if (!idea) return positions;

  const transformsByFrom = new Map<string, CanvasNode[]>();
  for (const t of snapshot.nodes.filter(isCanvasTransformacionNode)) {
    const from = t.fromNodeId ?? '';
    if (!from) continue;
    const list = transformsByFrom.get(from) ?? [];
    list.push(t);
    transformsByFrom.set(from, list);
  }

  let x = 0;
  const queue: string[] = [idea.id];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const estadoId = queue.shift()!;
    if (seen.has(estadoId)) continue;
    seen.add(estadoId);
    const estado = snapshot.nodes.find((n) => n.id === estadoId);
    if (!estado || !isCanvasEstadoNode(estado)) continue;

    positions.set(estadoId, { x, y: 80 });
    const transforms = transformsByFrom.get(estadoId) ?? [];
    let ty = 160;
    for (const tr of transforms) {
      positions.set(tr.id, { x: x + ESTADO_W / 2 - TRANS_W / 2, y: ty });
      ty += TRANS_H + GAP_Y;
      if (tr.toNodeId && !seen.has(tr.toNodeId)) {
        queue.push(tr.toNodeId);
      }
    }
    x += ESTADO_W + GAP_X + TRANS_W + GAP_X;
  }

  let orphanY = 320;
  for (const n of snapshot.nodes) {
    if (positions.has(n.id)) continue;
    positions.set(n.id, { x: 0, y: orphanY });
    orphanY += GAP_Y + 48;
  }

  return positions;
}

export function buildProyectoVivoFlow(
  snapshot: CanvasMultinivelPersisted,
  opts: ProyectoVivoFlowOpts = {},
): ProyectoVivoFlowData {
  const lente = opts.lente ?? 'crecimiento';
  const fronteraIds = opts.fronteraIds ?? new Set<string>();
  const cpmById = opts.cpmById;
  const positions = layoutChain(snapshot);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const producedBy = new Map<string, string>();
  for (const t of snapshot.nodes.filter(isCanvasTransformacionNode)) {
    if (t.toNodeId) producedBy.set(t.toNodeId, t.id);
  }

  for (const n of snapshot.nodes) {
    const pos = positions.get(n.id) ?? n.position;
    if (isCanvasEstadoNode(n)) {
      const producerId = producedBy.get(n.id);
      nodes.push({
        id: n.id,
        type: 'estadoVivo',
        position: { x: pos.x, y: pos.y },
        data: {
          label: n.title,
          graphStatus: n.graphStatus ?? 'fantasma',
          inFrontera: producerId ? fronteraIds.has(producerId) : false,
        },
      });
    } else if (isCanvasTransformacionNode(n)) {
      const cpm = cpmById?.get(n.id);
      const isCritical = lente === 'tiempo' && Boolean(cpm?.isCritical || n.esCritica);
      nodes.push({
        id: n.id,
        type: 'transformacionVivo',
        position: { x: pos.x, y: pos.y },
        data: {
          label: n.title,
          transformKind: n.transformKind ?? 'conocimiento',
          graphStatus: n.graphStatus ?? 'propuesta',
          energyUnitId: n.energyUnitId ?? null,
          energyQuantity: n.energyQuantity ?? null,
          capitalAmount: n.capitalAmount ?? null,
          capitalCurrency: n.capitalCurrency ?? null,
          inFrontera: lente === 'crecimiento' && fronteraIds.has(n.id),
          isCritical,
          es: lente === 'tiempo' ? cpm?.es : undefined,
          ef: lente === 'tiempo' ? cpm?.ef : undefined,
          duracionDias: n.duracionDias ?? null,
        },
      });
    }
  }

  for (const t of snapshot.nodes.filter(isCanvasTransformacionNode)) {
    if (t.fromNodeId) {
      edges.push({
        id: `e-from-${t.id}`,
        source: t.fromNodeId,
        target: t.id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#64748b' },
      });
    }
    if (t.toNodeId) {
      const target = snapshot.nodes.find((n) => n.id === t.toNodeId);
      const dashed = target && isCanvasEstadoNode(target) && target.graphStatus === 'fantasma';
      const frontera = fronteraIds.has(t.id) && lente === 'crecimiento';
      edges.push({
        id: `e-to-${t.id}`,
        source: t.id,
        target: t.toNodeId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: {
          stroke: frontera ? '#d97706' : dashed ? '#94a3b8' : '#0ea5e9',
          strokeDasharray: dashed ? '6 4' : undefined,
          strokeWidth: frontera ? 2.5 : 1.5,
        },
      });
    }
  }

  for (const e of snapshot.edges) {
    const sc = cpmById?.get(e.sourceId);
    const tc = cpmById?.get(e.targetId);
    const critical =
      lente === 'tiempo' && (e.critical || Boolean(sc?.isCritical && tc?.isCritical));
    edges.push({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        stroke: critical ? '#dc2626' : '#cbd5e1',
        strokeWidth: critical ? 2.5 : 1.5,
      },
    });
  }

  return { nodes, edges };
}
