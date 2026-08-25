import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';
import type { CanvasMultinivelPersisted, CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';

/** Inserta etapas/tareas/precedencias del Organizar. No replace-all, no wallet. */
export async function insertarNodosCanvasObra(params: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  obraId: string;
  orgId: string;
  canvas: CanvasMultinivelPersisted;
  nodos: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  motivo: string;
}): Promise<{
  insertedNodes: number;
  insertedEdges: number;
  transformacionIds: string[];
  motivo: string;
}> {
  if (params.nodos.length === 0 && params.edges.length === 0) {
    return {
      insertedNodes: 0,
      insertedEdges: 0,
      transformacionIds: [],
      motivo: params.motivo,
    };
  }

  const mini = composeCanvasPersisted({
    obraNombre: params.canvas.obraNombre,
    pathIds: [],
    budgetGroups: [],
    projectKind: params.canvas.projectKind,
    nodes: params.nodos,
    edges: params.edges,
  });
  const rows = persistedToSupabaseRows(params.obraId, params.orgId, mini);
  const supabaseAny = params.supabase as any;

  if (rows.nodes.length > 0) {
    const { error } = await supabaseAny.from('canvas_nodes').insert(rows.nodes);
    if (error) throw new Error(error.message);
  }
  if (rows.edges.length > 0) {
    const { error } = await supabaseAny.from('canvas_edges').insert(rows.edges);
    if (error) throw new Error(error.message);
  }

  return {
    insertedNodes: rows.nodes.length,
    insertedEdges: rows.edges.length,
    transformacionIds: params.nodos.filter((n) => n.type === 'tarea').map((n) => n.id),
    motivo: params.motivo,
  };
}
