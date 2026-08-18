import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { EstadoTareaCore } from '@/lib/domain/estados-core';
import { graphStatusTransformacionFromTareaEstado } from '@/lib/proyecto-vivo/resolveElementoEjecucion';

/**
 * Tras transición FSM: refleja estado en canvas_nodes si la obra es proyecto_vivo.
 * No escribe wallet ni estados de tarea — solo graph_status del grafo A.
 */
export async function syncProyectoVivoGraphFromTareaEstado(params: {
  tareaId: string;
  nuevoEstado: EstadoTareaCore;
}): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const { data: tarea, error: tErr } = await supabaseAny
    .from('tareas')
    .select('id, obra_id, canvas_node_id, estado')
    .eq('id', params.tareaId)
    .maybeSingle();

  if (tErr || !tarea?.canvas_node_id || !tarea.obra_id) {
    return;
  }

  const { data: obra, error: oErr } = await supabaseAny
    .from('obras')
    .select('id, graph_mode')
    .eq('id', tarea.obra_id)
    .maybeSingle();

  if (oErr || obra?.graph_mode !== 'proyecto_vivo') {
    return;
  }

  const canvasNodeId = tarea.canvas_node_id as string;
  const graphStatus = graphStatusTransformacionFromTareaEstado(params.nuevoEstado);

  const { data: node, error: nErr } = await supabaseAny
    .from('canvas_nodes')
    .select('id, to_node_id, transform_kind')
    .eq('id', canvasNodeId)
    .maybeSingle();

  if (nErr || !node) {
    return;
  }

  await supabaseAny.from('canvas_nodes').update({ graph_status: graphStatus }).eq('id', canvasNodeId);

  if (params.nuevoEstado === 'validada' && node.to_node_id) {
    await supabaseAny
      .from('canvas_nodes')
      .update({ graph_status: 'alcanzado' })
      .eq('id', node.to_node_id);
  }
}
