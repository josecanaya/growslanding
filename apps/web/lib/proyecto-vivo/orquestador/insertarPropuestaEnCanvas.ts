import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import type { PropuestaL0Result } from '@/lib/proyecto-vivo/orquestador/proponerL0';

export type InsertarPropuestasResult = {
  insertedTransformaciones: number;
  insertedEstados: number;
  insertedEdges: number;
  transformacionIds: string[];
  motivo: string;
};

/** Inserta nodos/aristas nuevos. No PUT replace-all, no tareas, no realizada, no wallet. */
export async function insertarPropuestaEnCanvas(params: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  obraId: string;
  orgId: string;
  canvas: CanvasMultinivelPersisted;
  propuesta: PropuestaL0Result;
}): Promise<InsertarPropuestasResult> {
  const { propuesta } = params;
  if (propuesta.nodos.length === 0) {
    return {
      insertedTransformaciones: 0,
      insertedEstados: 0,
      insertedEdges: 0,
      transformacionIds: [],
      motivo: propuesta.motivo,
    };
  }

  const mini = composeCanvasPersisted({
    obraNombre: params.canvas.obraNombre,
    pathIds: [],
    budgetGroups: [],
    projectKind: params.canvas.projectKind,
    nodes: propuesta.nodos.flatMap((n) => [n.estadoB, n.transformacion]),
    edges: propuesta.edges,
  });
  const rows = persistedToSupabaseRows(params.obraId, params.orgId, mini);
  const supabaseAny = params.supabase as any;

  const estados = rows.nodes.filter((n) => n.type === 'estado');
  const trans = rows.nodes.filter((n) => n.type === 'tarea');

  if (estados.length > 0) {
    const { error } = await supabaseAny.from('canvas_nodes').insert(estados);
    if (error) throw new Error(error.message);
  }
  if (trans.length > 0) {
    const { error } = await supabaseAny.from('canvas_nodes').insert(trans);
    if (error) throw new Error(error.message);
  }
  if (rows.edges.length > 0) {
    const { error } = await supabaseAny.from('canvas_edges').insert(rows.edges);
    if (error) throw new Error(error.message);
  }

  return {
    insertedTransformaciones: trans.length,
    insertedEstados: estados.length,
    insertedEdges: rows.edges.length,
    transformacionIds: propuesta.nodos.map((n) => n.transformacion.id),
    motivo: propuesta.motivo,
  };
}
