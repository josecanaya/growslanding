import { describe, expect, it } from 'vitest';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { buildBudgetGroupHierarchyBranches } from '@/lib/canvas/budgetGroupHierarchy';

function n(partial: Partial<CanvasNode> & Pick<CanvasNode, 'id' | 'parentId' | 'type' | 'title' | 'level'>): CanvasNode {
  return {
    position: { x: 0, y: 0 },
    createdAt: new Date().toISOString(),
    ...partial,
  } as CanvasNode;
}

describe('buildBudgetGroupHierarchyBranches', () => {
  it('anida tareas bajo la jerarquía del canvas', () => {
    const nodes: CanvasNode[] = [
      n({ id: 'e1', parentId: null, level: 0, type: 'etapa', title: 'Estructura' }),
      n({ id: 'p1', parentId: 'e1', level: 1, type: 'planta', title: 'Piso 1' }),
      n({ id: 'd1', parentId: 'p1', level: 2, type: 'sector', title: 'Depto Único' }),
      n({ id: 'a1', parentId: 'd1', level: 3, type: 'ambiente', title: 'Hall' }),
      n({ id: 't1', parentId: 'a1', level: 4, type: 'tarea', title: 'Armaduras' }),
      n({ id: 't2', parentId: 'a1', level: 4, type: 'tarea', title: 'Hormigonado' }),
    ];
    const tasks = nodes.filter((x) => x.type === 'tarea');
    const branches = buildBudgetGroupHierarchyBranches(nodes, tasks);
    expect(branches.length).toBe(1);
    expect(branches[0].segmentTitle).toBe('Estructura');
    const piso = branches[0].sub.find((s) => s.segmentTitle === 'Piso 1');
    expect(piso).toBeTruthy();
    const depto = piso!.sub.find((s) => s.segmentTitle === 'Depto Único');
    expect(depto).toBeTruthy();
    const hall = depto!.sub.find((s) => s.segmentTitle === 'Hall');
    expect(hall?.leafTasks.map((t) => t.title).sort()).toEqual(['Armaduras', 'Hormigonado']);
  });
});
