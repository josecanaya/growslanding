import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { EstadoTareaCore } from '@/lib/domain/estados-core';
import { aggregateGraphExecution } from './aggregateExecution';
/** Recompute persisted task states; a single validation cannot certify B. */
export async function syncProyectoVivoGraphFromTareaEstado(params: { tareaId: string; nuevoEstado: EstadoTareaCore }): Promise<void> {
  const db = createServiceSupabaseClient() as any;
  const { data: tarea, error: taskError } = await db.from('tareas').select('id, obra_id, canvas_node_id').eq('id', params.tareaId).maybeSingle();
  if (taskError) throw new Error(taskError.message);
  if (!tarea?.canvas_node_id || !tarea.obra_id) return;
  const { data: obra, error: obraError } = await db.from('obras').select('id, graph_mode').eq('id', tarea.obra_id).maybeSingle();
  if (obraError) throw new Error(obraError.message);
  if (obra?.graph_mode !== 'proyecto_vivo') return;
  const results = await Promise.all([
    db.from('canvas_nodes').select('id, type, transform_kind, to_node_id, graph_status').eq('obra_id', tarea.obra_id),
    db.from('tareas').select('canvas_node_id, estado').eq('obra_id', tarea.obra_id),
    db.from('canvas_edges').select('source_node_id, target_node_id, type').eq('obra_id', tarea.obra_id),
  ]);
  for (const result of results) if (result.error) throw new Error(result.error.message);
  const changes = aggregateGraphExecution(results[0].data ?? [], results[1].data ?? [], results[2].data ?? []);
  for (const [id, graph_status] of changes) {
    const { error } = await db.from('canvas_nodes').update({ graph_status }).eq('id', id).eq('obra_id', tarea.obra_id);
    if (error) throw new Error(error.message);
  }
}
