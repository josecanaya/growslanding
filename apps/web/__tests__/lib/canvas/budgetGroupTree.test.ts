import { describe, expect, it } from 'vitest';

import type { CanvasNode } from '@/lib/types/canvasMultinivel';

import {
  budgetGroupSummaryLabel,
  getBudgetGroupStateForNode,
  getDescendantTaskIds,
} from '@/lib/canvas/budgetGroupTree';

function node(p: Partial<CanvasNode> & Pick<CanvasNode, 'id' | 'parentId' | 'level' | 'type' | 'title'>): CanvasNode {
  return {
    position: { x: 0, y: 0 },
    createdAt: 'now',
    ...p,
  } as CanvasNode;
}

describe('getDescendantTaskIds', () => {
  it('incluye la t seleccionada cuando es de tipo tarea', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e1', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't1', parentId: 'e1', level: 2, type: 'tarea', title: 'T' }),
    ];
    expect(getDescendantTaskIds('t1', nodes)).toEqual(['t1']);
  });

  it('recorre nietos y devuelve solo tareas', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e1', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 'p1', parentId: 'e1', level: 2, type: 'planta', title: 'P1' }),
      node({ id: 's1', parentId: 'p1', level: 3, type: 'sector', title: 'D' }),
      node({ id: 'a1', parentId: 's1', level: 4, type: 'ambiente', title: 'Amb' }),
      node({ id: 't1', parentId: 'a1', level: 5, type: 'tarea', title: 'T1' }),
      node({ id: 't2', parentId: 'a1', level: 5, type: 'tarea', title: 'T2' }),
      node({ id: 'other', parentId: 'p1', level: 3, type: 'tarea', title: 'O' }),
    ];
    expect(getDescendantTaskIds('p1', nodes).sort()).toEqual(['other', 't1', 't2']);
  });

  it('sin duplicar si apareciera el mismo id (visited)', () => {
    const n: CanvasNode[] = [
      node({ id: 'e', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't', parentId: 'e', level: 2, type: 'tarea', title: 'T' }),
    ];
    expect(getDescendantTaskIds('e', n)).toEqual(['t']);
  });

  it('id inexistente devuelve []', () => {
    expect(getDescendantTaskIds('x', [])).toEqual([]);
  });
});

describe('getBudgetGroupStateForNode', () => {
  const g1 = { id: 'bg-1', name: 'G1', createdAt: '' };
  const groups = [g1];

  it('empty cuando ninguna tarea tiene grupo', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't', parentId: 'e', level: 2, type: 'tarea', title: 'T' }),
    ];
    expect(getBudgetGroupStateForNode('e', nodes)).toEqual({
      taskCount: 1,
      state: 'empty',
    });
  });

  it('single cuando todas comparten el mismo grupo', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't1', parentId: 'e', level: 2, type: 'tarea', title: 'T1', budgetGroupId: 'bg-1' }),
      node({ id: 't2', parentId: 'e', level: 2, type: 'tarea', title: 'T2', budgetGroupId: 'bg-1' }),
    ];
    expect(getBudgetGroupStateForNode('e', nodes)).toEqual({
      taskCount: 2,
      state: 'single',
      budgetGroupId: 'bg-1',
    });
  });

  it('mixed si hay con y sin grupo', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't1', parentId: 'e', level: 2, type: 'tarea', title: 'T1', budgetGroupId: 'bg-1' }),
      node({ id: 't2', parentId: 'e', level: 2, type: 'tarea', title: 'T2' }),
    ];
    expect(getBudgetGroupStateForNode('e', nodes)).toEqual({
      taskCount: 2,
      state: 'mixed',
    });
  });

  it('mixed si hay dos grupos distintos', () => {
    const nodes: CanvasNode[] = [
      node({ id: 'e', parentId: null, level: 1, type: 'etapa', title: 'E' }),
      node({ id: 't1', parentId: 'e', level: 2, type: 'tarea', title: 'T1', budgetGroupId: 'bg-1' }),
      node({ id: 't2', parentId: 'e', level: 2, type: 'tarea', title: 'T2', budgetGroupId: 'bg-2' }),
    ];
    expect(getBudgetGroupStateForNode('e', nodes)).toEqual({
      taskCount: 2,
      state: 'mixed',
    });
  });

  it('budgetGroupSummaryLabel para single muestra nombre', () => {
    const agg = { taskCount: 1, state: 'single' as const, budgetGroupId: 'bg-1' };
    expect(budgetGroupSummaryLabel(agg, groups)).toBe('G1');
  });
});
