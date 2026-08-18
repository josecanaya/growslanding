import { describe, expect, it } from 'vitest';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { computeProyectoVivoCpm } from '@/lib/proyecto-vivo/computeProyectoVivoCpm';

function transform(
  id: string,
  title: string,
  duracionDias: number,
  fromNodeId: string,
  toNodeId: string,
): CanvasNode {
  return {
    id,
    parentId: null,
    level: 1,
    type: 'tarea',
    title,
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    transformKind: 'ejecucion',
    fromNodeId,
    toNodeId,
    graphStatus: 'propuesta',
    duracionDias,
  };
}

describe('computeProyectoVivoCpm', () => {
  it('calcula CPM y camino crítico sobre 3 transformaciones con duraciones', () => {
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [
        {
          id: 'idea',
          parentId: null,
          level: 1,
          type: 'estado',
          title: 'Idea',
          position: { x: 0, y: 0 },
          createdAt: '2026-01-01T00:00:00.000Z',
          graphStatus: 'alcanzado',
        },
        transform('t1', 'Excavar', 2, 'idea', 'b'),
        transform('t2', 'Fundar', 3, 'b', 'c'),
        transform('t3', 'Paralela', 1, 'idea', 'd'),
      ],
      edges: [
        { id: 'e12', sourceId: 't1', targetId: 't2', critical: false },
      ],
    });

    const bundle = computeProyectoVivoCpm(snapshot);
    expect(bundle).not.toBeNull();
    expect(bundle!.resultado.project_duration).toBe(5);
    expect(bundle!.byId.get('t1')!.isCritical).toBe(true);
    expect(bundle!.byId.get('t2')!.isCritical).toBe(true);
    expect(bundle!.byId.get('t3')!.isCritical).toBe(false);
    expect(bundle!.byId.get('t3')!.float).toBeGreaterThan(0);
  });
});
