import { buildCanvasFromTaskTemplate } from '@/lib/canvas/buildCanvasFromTaskTemplate';
import type { CanvasTaskTemplateDef } from '@/lib/canvas/canvasTemplateTypes';
import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { newCanvasEdgeId, newCanvasNodeId } from '@/lib/canvas/canvasIdUtils';

function newClientNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `cn-${crypto.randomUUID()}`;
  }
  return newCanvasNodeId();
}

function newClientEdgeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `ce-${crypto.randomUUID()}`;
  }
  return newCanvasEdgeId();
}

/**
 * Agrega las tareas de un template al canvas actual (misma etapa raíz o una nueva).
 */
export function mergeTemplateIntoCanvas(
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  template: CanvasTaskTemplateDef,
): { nodes: CanvasNode[]; edges: CanvasPrecedenceEdge[]; pathIds: string[] } {
  const built = buildCanvasFromTaskTemplate(template, template.nombre);
  const builtEtapa = built.nodes.find((n) => n.type === 'etapa' && n.parentId === null);
  const builtTasks = built.nodes.filter((n) => n.type === 'tarea');

  let etapa =
    nodes.find((n) => n.type === 'etapa' && n.parentId === null) ?? null;

  const nextNodes = [...nodes];
  const nextEdges = [...edges];

  if (!etapa) {
    etapa = builtEtapa
      ? { ...builtEtapa, id: newClientNodeId() }
      : {
          id: newClientNodeId(),
          parentId: null,
          level: 1,
          type: 'etapa',
          title: template.nombre,
          position: { x: 120, y: 40 },
          createdAt: new Date().toISOString(),
          estadoNivel: 'pendiente',
        };
    nextNodes.push(etapa);
  }

  const existingTasks = nextNodes.filter((n) => n.parentId === etapa!.id && n.type === 'tarea');
  const offsetIndex = existingTasks.length;

  const idMap = new Map<string, string>();
  for (const t of builtTasks) {
    const newId = newClientNodeId();
    idMap.set(t.id, newId);
    const localIndex = builtTasks.indexOf(t);
    nextNodes.push({
      ...t,
      id: newId,
      parentId: etapa.id,
      position: {
        x: 80 + (offsetIndex + localIndex) * 260,
        y: 160,
      },
    });
  }

  for (const e of built.edges) {
    const sourceId = idMap.get(e.sourceId);
    const targetId = idMap.get(e.targetId);
    if (sourceId && targetId) {
      nextEdges.push({
        id: newClientEdgeId(),
        sourceId,
        targetId,
        critical: e.critical,
      });
    }
  }

  if (offsetIndex > 0 && builtTasks.length > 0) {
    const lastExisting = existingTasks[existingTasks.length - 1];
    const firstNew = idMap.get(builtTasks[0]!.id);
    if (lastExisting && firstNew) {
      nextEdges.push({
        id: newClientEdgeId(),
        sourceId: lastExisting.id,
        targetId: firstNew,
        critical: false,
      });
    }
  }

  return { nodes: nextNodes, edges: nextEdges, pathIds: nodes.length === 0 ? [] : [etapa.id] };
}
