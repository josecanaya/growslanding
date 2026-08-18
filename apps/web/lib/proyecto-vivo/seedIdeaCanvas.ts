import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import { newCanvasNodeId } from '@/lib/proyecto-vivo/ids';

export function buildSeedIdeaCanvasSnapshot(obraNombre: string): CanvasMultinivelPersisted {
  const ideaId = newCanvasNodeId();
  const now = new Date().toISOString();
  return composeCanvasPersisted({
    obraNombre: obraNombre.trim() || 'Proyecto',
    nodes: [
      {
        id: ideaId,
        parentId: null,
        level: 1,
        type: 'estado',
        title: 'Idea',
        position: { x: 0, y: 120 },
        createdAt: now,
        graphStatus: 'alcanzado',
      },
    ],
    pathIds: [],
    edges: [],
    budgetGroups: [],
    projectKind: 'otro',
  });
}
