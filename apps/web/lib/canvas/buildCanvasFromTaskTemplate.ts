import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { newCanvasEdgeId, newCanvasNodeId } from '@/lib/canvas/canvasIdUtils';
import type { CanvasTaskTemplateDef } from '@/lib/canvas/canvasTemplateTypes';
import type { CanvasMultinivelPersisted, CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';

/**
 * Convierte un template lineal en snapshot de canvas: 1 etapa + tareas hermanas + precedencias.
 */
export function buildCanvasFromTaskTemplate(
  template: CanvasTaskTemplateDef,
  obraNombre: string,
): CanvasMultinivelPersisted {
  const now = new Date().toISOString();
  const etapaId = newCanvasNodeId();
  const sortedTasks = [...template.tareas].sort((a, b) => a.orden - b.orden);

  const taskIdByTemplateTaskId = new Map<string, string>();
  const nodes: CanvasNode[] = [
    {
      id: etapaId,
      parentId: null,
      level: 1,
      type: 'etapa',
      title: template.nombre,
      position: { x: 120, y: 40 },
      createdAt: now,
      estadoNivel: 'pendiente',
      descripcion: template.descripcion,
    },
  ];

  sortedTasks.forEach((task, index) => {
    const nodeId = newCanvasNodeId();
    taskIdByTemplateTaskId.set(task.id, nodeId);
    nodes.push({
      id: nodeId,
      parentId: etapaId,
      level: 2,
      type: 'tarea',
      title: task.titulo,
      position: { x: 80 + index * 260, y: 160 },
      createdAt: now,
      estadoTarea: 'pendiente',
      duracionDias: task.duracionEstimadaDias ?? 1,
      descripcion: task.descripcion,
    });
  });

  const edges: CanvasPrecedenceEdge[] = [];
  for (const conn of template.conexiones) {
    const sourceId = taskIdByTemplateTaskId.get(conn.sourceTaskId);
    const targetId = taskIdByTemplateTaskId.get(conn.targetTaskId);
    if (!sourceId || !targetId) continue;
    edges.push({
      id: newCanvasEdgeId(),
      sourceId,
      targetId,
      critical: false,
    });
  }

  // Si no hay conexiones explícitas, encadenar en orden
  if (edges.length === 0 && sortedTasks.length > 1) {
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const a = taskIdByTemplateTaskId.get(sortedTasks[i]!.id);
      const b = taskIdByTemplateTaskId.get(sortedTasks[i + 1]!.id);
      if (a && b) {
        edges.push({ id: newCanvasEdgeId(), sourceId: a, targetId: b, critical: false });
      }
    }
  }

  return composeCanvasPersisted({
    obraNombre: obraNombre.trim() || 'Obra',
    nodes,
    pathIds: [etapaId],
    edges,
    budgetGroups: [],
    projectKind: 'simple',
  });
}
