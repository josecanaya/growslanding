import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import { newCanvasNodeId } from '@/lib/proyecto-vivo/ids';

/** Seed = primera etapa del Organizar (misma UI que casa / XML). */
export function buildSeedIdeaCanvasSnapshot(obraNombre: string): CanvasMultinivelPersisted {
  const etapaId = newCanvasNodeId();
  const now = new Date().toISOString();
  return composeCanvasPersisted({
    obraNombre: obraNombre.trim() || 'Proyecto',
    nodes: [
      {
        id: etapaId,
        parentId: null,
        level: 1,
        type: 'etapa',
        title: '00. Definición del proyecto',
        position: { x: 40, y: 40 },
        createdAt: now,
        estadoNivel: 'en_curso',
      },
    ],
    pathIds: [],
    edges: [],
    budgetGroups: [],
    projectKind: 'edificio_multifamiliar',
  });
}
