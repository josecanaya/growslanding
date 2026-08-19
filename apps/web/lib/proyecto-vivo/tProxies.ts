/**
 * OBSOLETO (2026-08-19): no es F(f)=(qT,C).
 * gamma/criticidad/sigma no son identidad energética. No usar en proyecto_vivo.
 * Conservado solo para no romper imports; no llamar desde UI ni APIs.
 */
import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { computeFrontera } from '@/lib/proyecto-vivo/computeFrontera';

export type TProxiesV0 = {
  gamma: number;
  criticidad: number;
  sigma: number;
};

export function proxies_v0(
  transformacion: CanvasNode,
  grafo: CanvasMultinivelPersisted,
): TProxiesV0 {
  if (!isCanvasTransformacionNode(transformacion)) {
    return { gamma: 0, criticidad: 0, sigma: 0 };
  }

  const fronteraHoy = new Set(computeFrontera(grafo).map((f) => f.transformacionId));
  const simulado: CanvasMultinivelPersisted = {
    ...grafo,
    nodes: grafo.nodes.map((n) => {
      if (n.id !== transformacion.id) return n;
      return { ...n, graphStatus: 'realizada' };
    }),
  };
  if (transformacion.toNodeId) {
    simulado.nodes = simulado.nodes.map((n) => {
      if (n.id !== transformacion.toNodeId) return n;
      if (!isCanvasEstadoNode(n)) return n;
      return { ...n, graphStatus: 'alcanzado' };
    });
  }
  const fronteraDespues = computeFrontera(simulado);
  const gamma = fronteraDespues.filter((f) => !fronteraHoy.has(f.transformacionId)).length;

  const toNode = transformacion.toNodeId
    ? grafo.nodes.find((n) => n.id === transformacion.toNodeId)
    : undefined;
  const sigma =
    toNode && isCanvasEstadoNode(toNode) && toNode.graphStatus !== 'alcanzado' ? 1 : 0;

  const idea = grafo.nodes.find((n) => isCanvasEstadoNode(n) && n.title.toLowerCase() === 'idea');
  let criticidad = 0;
  if (idea && transformacion.fromNodeId) {
    criticidad = transformacion.fromNodeId === idea.id || transformacion.toNodeId ? 1 : 0;
  }

  return { gamma, criticidad, sigma };
}
