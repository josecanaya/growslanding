import type { CanvasBudgetGroup, CanvasNode } from '@/lib/types/canvasMultinivel';

/**
 * Índice de hijos por parentId para recorridos O(n) en árboles grandes.
 */
function buildChildrenMap(nodes: CanvasNode[]): Map<string | null, string[]> {
  const m = new Map<string | null, string[]>();
  for (const n of nodes) {
    const p = n.parentId;
    if (!m.has(p)) m.set(p, []);
    m.get(p)!.push(n.id);
  }
  return m;
}

/**
 * Todas las tareas en el subárbol cuyo nodo raíz es `selectedNodeId` (incluye el propio nodo si es tarea).
 * Sin duplicados; tolera grafos dirigidos inconsistentes mediante `visited`.
 */
export function getDescendantTaskIds(selectedNodeId: string, nodes: CanvasNode[]): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (!byId.has(selectedNodeId)) return [];

  const childrenByParent = buildChildrenMap(nodes);
  const out: string[] = [];
  const visited = new Set<string>();
  const stack: string[] = [selectedNodeId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = byId.get(id);
    if (!node) continue;
    if (node.type === 'tarea') out.push(id);

    const kids = childrenByParent.get(id);
    if (kids) {
      for (let i = kids.length - 1; i >= 0; i--) {
        stack.push(kids[i]!);
      }
    }
  }

  return out;
}

export type BudgetGroupAggregateState = 'empty' | 'single' | 'mixed';

export type BudgetGroupStateForNode = {
  taskCount: number;
  state: BudgetGroupAggregateState;
  /** Solo cuando todas las tareas tienen exactamente este grupo */
  budgetGroupId?: string;
};

export function getBudgetGroupStateForNode(
  selectedNodeId: string,
  nodes: CanvasNode[],
): BudgetGroupStateForNode {
  const taskIds = getDescendantTaskIds(selectedNodeId, nodes);
  const count = taskIds.length;
  if (count === 0) return { taskCount: 0, state: 'empty' };

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const refs = taskIds.map((id) => byId.get(id)?.budgetGroupId);

  const withGroup = refs.filter((g): g is string => Boolean(g));
  const without = refs.filter((g) => !g);

  if (withGroup.length === 0) {
    return { taskCount: count, state: 'empty' };
  }
  if (without.length > 0) {
    return { taskCount: count, state: 'mixed' };
  }
  const first = withGroup[0]!;
  if (withGroup.every((g) => g === first)) {
    return { taskCount: count, state: 'single', budgetGroupId: first };
  }
  return { taskCount: count, state: 'mixed' };
}

export function budgetGroupSummaryLabel(
  agg: BudgetGroupStateForNode,
  budgetGroups: CanvasBudgetGroup[],
): string {
  if (agg.taskCount === 0) return 'Sin tareas descendientes';
  if (agg.state === 'mixed') return 'Mixto';
  if (agg.state === 'empty') return 'Sin grupo';
  const g = budgetGroups.find((x) => x.id === agg.budgetGroupId);
  return g?.name ?? 'Grupo desconocido';
}
