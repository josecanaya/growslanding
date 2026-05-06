import type { CanvasNode } from '@/lib/types/canvasMultinivel';

/** Rama del árbol de jerarquía del canvas (fase → piso → … → tareas). */
export type BudgetHierarchyBranch = {
  segmentId: string;
  segmentTitle: string;
  segmentType: string;
  sub: BudgetHierarchyBranch[];
  leafTasks: CanvasNode[];
};

function pathFromRoot(nodes: CanvasNode[], taskId: string): CanvasNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: CanvasNode[] = [];
  let cur: CanvasNode | undefined = byId.get(taskId);
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}

/**
 * Agrupa tareas del mismo grupo de presupuesto según la jerarquía del canvas
 * (ancestros → tareas como hojas), no como lista plana.
 */
export function buildBudgetGroupHierarchyBranches(
  nodes: CanvasNode[],
  tasksInGroup: CanvasNode[],
): BudgetHierarchyBranch[] {
  const root: BudgetHierarchyBranch[] = [];

  const orphanKey = '__sin_ubicacion__';

  for (const task of tasksInGroup) {
    const path = pathFromRoot(nodes, task.id);
    if (path.length === 0) continue;
    const last = path[path.length - 1];
    if (last?.id !== task.id) continue;

    const containers = path.slice(0, -1);
    let level = root;

    if (containers.length === 0) {
      let b = level.find((x) => x.segmentId === orphanKey);
      if (!b) {
        b = {
          segmentId: orphanKey,
          segmentTitle: 'Sin ubicación en el canvas',
          segmentType: 'sin_ubicacion',
          sub: [],
          leafTasks: [],
        };
        level.push(b);
      }
      b.leafTasks.push(task);
      continue;
    }

    let curBranch: BudgetHierarchyBranch | null = null;
    for (const c of containers) {
      let b = level.find((x) => x.segmentId === c.id);
      if (!b) {
        b = {
          segmentId: c.id,
          segmentTitle: c.title,
          segmentType: c.type,
          sub: [],
          leafTasks: [],
        };
        level.push(b);
      }
      curBranch = b;
      level = b.sub;
    }
    if (curBranch) {
      curBranch.leafTasks.push(task);
    }
  }

  const sortBranches = (branches: BudgetHierarchyBranch[]) => {
    branches.sort((a, b) => {
      if (a.segmentId === orphanKey) return 1;
      if (b.segmentId === orphanKey) return -1;
      return a.segmentTitle.localeCompare(b.segmentTitle, 'es', { sensitivity: 'base' });
    });
    for (const br of branches) {
      sortBranches(br.sub);
      br.leafTasks.sort((t1, t2) =>
        t1.title.localeCompare(t2.title, 'es', { sensitivity: 'base' }),
      );
    }
  };
  sortBranches(root);

  return root;
}
