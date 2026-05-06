import type { CanvasNode, CanvasNivelTipo } from '@/lib/types/canvasMultinivel';
import { toClientNodeId } from '@/lib/canvas/canvasSupabaseMapper';

export type DbCanvasNodeRow = {
  id: string;
  parent_id: string | null;
  type: string;
  title: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

/** Filas mínimas de `canvas_nodes` → nodos para `buildBudgetGroupHierarchyBranches`. */
export function dbCanvasRowsToCanvasNodes(rows: DbCanvasNodeRow[]): CanvasNode[] {
  return rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const level = typeof meta.level === 'number' ? meta.level : 1;
    return {
      id: toClientNodeId(row.id),
      parentId: row.parent_id ? toClientNodeId(row.parent_id) : null,
      level,
      type: row.type as CanvasNivelTipo,
      title: row.title,
      position: { x: 0, y: 0 },
      createdAt: row.created_at,
    };
  });
}
