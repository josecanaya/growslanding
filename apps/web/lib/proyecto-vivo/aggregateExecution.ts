import { normalizeProductiveRelation } from './relationSemantics';
export type ExecutionNode = { id: string; type: string; transform_kind?: string | null; to_node_id?: string | null; graph_status: string | null };
export type ExecutionTask = { canvas_node_id: string | null; estado: string | null };
export type ExecutionEdge = { source_node_id: string; target_node_id: string; type: string };
/** All linked tasks are mandatory. Zero tasks never certifies a transformation. */
export function aggregateExecutionStatus(states: string[]) {
  if (!states.length || states.every((s) => s === 'pendiente')) return 'propuesta';
  if (states.every((s) => s === 'validada')) return 'realizada';
  if (states.some((s) => !['pendiente', 'validada', 'en_progreso', 'para_validar', 'rechazada'].includes(s))) return 'bloqueada';
  return 'en_curso';
}
export function aggregateGraphExecution(nodes: ExecutionNode[], tasks: ExecutionTask[], edges: ExecutionEdge[]) {
  const status = new Map(nodes.map((n) => [n.id, n.graph_status]));
  const changed = new Map<string, string>();
  for (const node of nodes) {
    if (node.type !== 'tarea' || node.transform_kind !== 'ejecucion') continue;
    const states = tasks.filter((t) => t.canvas_node_id === node.id).map((t) => t.estado ?? 'unknown');
    const next = aggregateExecutionStatus(states);
    status.set(node.id, next);
    if (next !== node.graph_status) changed.set(node.id, next);
  }
  const normalized = edges.map((e) => normalizeProductiveRelation(e.source_node_id, e.target_node_id, e.type));
  const derived = nodes.filter((node) => node.type === 'estado' && nodes.some((n) => n.type === 'tarea' && n.to_node_id === node.id));
  // Start derived states unachieved, so cycles cannot self-certify using stale values.
  for (const node of derived) status.set(node.id, 'fantasma');
  for (let pass = 0; pass < derived.length; pass++) {
    let progress = false;
    for (const node of derived) {
      const prerequisites = new Set(nodes.filter((n) => n.type === 'tarea' && n.to_node_id === node.id).map((n) => n.id));
      for (const edge of normalized) if (edge.blocks && edge.targetId === node.id) prerequisites.add(edge.sourceId);
      const achieved = [...prerequisites].every((id) => ['realizada', 'alcanzado'].includes(status.get(id) ?? ''));
      if (achieved && status.get(node.id) !== 'alcanzado') {
        status.set(node.id, 'alcanzado');
        progress = true;
      }
    }
    if (!progress) break;
  }
  for (const node of derived) {
    const next = status.get(node.id)!;
    if (next !== node.graph_status) changed.set(node.id, next);
  }
  return changed;
}
