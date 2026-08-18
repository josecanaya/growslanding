import { describe, expect, it } from 'vitest';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { computeFrontera } from '@/lib/proyecto-vivo/computeFrontera';

function estado(id: string, title: string, graphStatus: 'alcanzado' | 'fantasma'): CanvasNode {
  return {
    id,
    parentId: null,
    level: 1,
    type: 'estado',
    title,
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    graphStatus,
  };
}

function transform(
  id: string,
  title: string,
  fromNodeId: string,
  toNodeId: string,
  graphStatus: 'propuesta' | 'realizada' | 'en_curso' = 'propuesta',
): CanvasNode {
  return {
    id,
    parentId: null,
    level: 1,
    type: 'tarea',
    title,
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    transformKind: 'conocimiento',
    fromNodeId,
    toNodeId,
    graphStatus,
  };
}

describe('computeFrontera', () => {
  it('al marcar realizada, B queda alcanzado y la propuesta que dependía de B entra a la frontera', () => {
    const idea = estado('idea', 'Idea', 'alcanzado');
    const t1 = transform('t1', 'Diseñar', 'idea', 'b');
    const b = estado('b', 'Anteproyecto', 'fantasma');
    const t2 = transform('t2', 'Calcular', 'b', 'c');
    const c = estado('c', 'Cálculo', 'fantasma');

    const inicial = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea, t1, b, t2, c],
    });

    const frontera0 = computeFrontera(inicial).map((f) => f.transformacionId);
    expect(frontera0).toEqual(['t1']);

    const despues = composeCanvasPersisted({
      ...inicial,
      nodes: inicial.nodes.map((n) => {
        if (n.id === 't1') return { ...n, graphStatus: 'realizada' as const };
        if (n.id === 'b') return { ...n, graphStatus: 'alcanzado' as const };
        return n;
      }),
    });

    const frontera1 = computeFrontera(despues).map((f) => f.transformacionId);
    expect(frontera1).toEqual(['t2']);
  });

  it('una precedencia T→T no realizada bloquea la frontera', () => {
    const idea = estado('idea', 'Idea', 'alcanzado');
    const t1 = transform('t1', 'A', 'idea', 'b', 'propuesta');
    const b = estado('b', 'B', 'alcanzado');
    const t2 = transform('t2', 'C', 'b', 'c', 'propuesta');
    const c = estado('c', 'C', 'fantasma');

    const snapshot = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [{ id: 'e1', sourceId: 't1', targetId: 't2', critical: false }],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea, t1, b, t2, c],
    });

    expect(computeFrontera(snapshot).map((f) => f.transformacionId)).toEqual(['t1']);
  });

  it('ejecucion validada cuenta como predecesora cumplida', () => {
    const idea = estado('idea', 'Idea', 'alcanzado');
    const t1: CanvasNode = {
      ...transform('t1', 'Excavar', 'idea', 'b', 'en_curso'),
      transformKind: 'ejecucion',
    };
    const b = estado('b', 'Terreno', 'alcanzado');
    const t2 = transform('t2', 'Fundar', 'b', 'c', 'propuesta');
    const c = estado('c', 'Fundado', 'fantasma');

    const snapshot = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [{ id: 'e1', sourceId: 't1', targetId: 't2', critical: false }],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea, t1, b, t2, c],
    });

    expect(computeFrontera(snapshot).map((f) => f.transformacionId)).toEqual(['t1']);
    expect(
      computeFrontera(snapshot, {
        tareaEstadoByCanvasNodeId: new Map([['t1', 'validada']]),
      }).map((f) => f.transformacionId),
    ).toEqual(['t1', 't2']);
  });
});
