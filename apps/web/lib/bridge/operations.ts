import { z } from 'zod';
import { normalizeProductiveRelation } from '@/lib/proyecto-vivo/relationSemantics';
import { randomUUID } from 'crypto';
import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';

export const operationSchema = z.object({
  type: z.enum(['create_node','update_node','delete_node','create_edge','delete_edge','propose_transform']),
  id: z.string().max(100).nullable().optional(), parentId: z.string().max(100).nullable().optional(),
  title: z.string().max(240).nullable().optional(), description: z.string().max(4000).nullable().optional(),
  nodeType: z.enum(['etapa','planta','sector','ambiente','tarea','estado']).nullable().optional(),
  sourceId: z.string().max(100).nullable().optional(), targetId: z.string().max(100).nullable().optional(),
  relation: z.enum(['precede','depende_de','habilita','requiere','afecta','se_ejecuta_mediante']).nullable().optional(),
  fromNodeId: z.string().max(100).nullable().optional(), toNodeId: z.string().max(100).nullable().optional(),
  transformKind: z.enum(['ejecucion','conocimiento','coordinacion']).nullable().optional(),
  executorKind: z.enum(['humano','empresa','agente','sin_asignar']).nullable().optional(),
  quantity: z.number().nonnegative().nullable().optional(), unit: z.string().max(80).nullable().optional(),
  durationDays: z.number().nonnegative().max(3650).nullable().optional(),
  sources: z.array(z.string().max(1000)).max(30).nullable().optional(),
  assumptions: z.array(z.string().max(1000)).max(30).nullable().optional(),
});
export const bridgeResultSchema = z.object({ reply: z.string().max(16000), operations: z.array(operationSchema).max(100) });

export function applyBridgeOperations(canvas: CanvasMultinivelPersisted, result: z.infer<typeof bridgeResultSchema>): CanvasMultinivelPersisted {
  const next = structuredClone(canvas);
  const newTransforms = new Set<string>();
  const removedIds = new Set<string>();
  const aliases = new Map<string,string>();
  for (const op of result.operations) if (op.type === 'create_node' || op.type === 'propose_transform') {
    if (!op.id || aliases.has(op.id) || next.nodes.some(n => n.id === op.id)) throw new Error('Cada cuadro nuevo necesita un identificador único.');
    aliases.set(op.id, `cn-${randomUUID()}`);
  }
  const resolve = (id: string | null | undefined) => id && id !== '__root__' ? aliases.get(id) ?? id : null;
  for (const op of result.operations) {
    const id = resolve(op.id);
    if (op.type === 'create_node' || op.type === 'propose_transform') {
      if (!op.title?.trim()) throw new Error('Falta el título del cuadro.');
      const node = { id: id!, title: op.title.trim(), descripcion: op.description ?? undefined, level:1,createdAt:new Date().toISOString(),type: op.nodeType ?? 'tarea', parentId: resolve(op.parentId), position: {x: 80 + next.nodes.length % 4 * 260, y: 80 + Math.floor(next.nodes.length / 4) * 150} } as CanvasNode;
      if (node.type === 'estado') node.graphStatus = 'fantasma';
      if (node.type === 'tarea') { node.graphStatus = 'propuesta'; node.estadoTarea = 'pendiente'; }
      node.notas = [op.quantity != null ? `Cantidad propuesta: ${op.quantity} ${op.unit ?? ''}` : '', ...(op.sources ?? []).map(source => `Fuente: ${source}`), ...(op.assumptions ?? []).map(assumption => `Supuesto: ${assumption}`)].filter(Boolean).join('\n');
      if (op.type === 'propose_transform') { newTransforms.add(node.id); Object.assign(node, {type:'tarea', transformKind:op.transformKind ?? 'ejecucion', fromNodeId:resolve(op.fromNodeId), toNodeId:resolve(op.toNodeId), executorKind:op.executorKind ?? 'sin_asignar', graphStatus:'propuesta', duracionDias:op.durationDays ?? undefined,orquestador:{origen:'agente',estado:'aceptada',formulaId:'chat'}}); }
      next.nodes.push(node);
    } else if (op.type === 'update_node') {
      const node = next.nodes.find(n => n.id === id);
      if (!node) throw new Error('El cuadro que se quiere modificar ya no existe.');
      if (op.title != null) { if (!op.title.trim()) throw new Error('Título vacío.'); node.title = op.title.trim(); }
      if (op.description != null) node.descripcion = op.description;
      if (op.parentId != null) node.parentId = resolve(op.parentId);
    } else if (op.type === 'delete_node') {
      if (!next.nodes.some(n=>n.id===id)) throw new Error('Cuadro inexistente.');
      if (next.nodes.some(n=>n.parentId===id)) throw new Error('Eliminá primero los cuadros interiores.');
      removedIds.add(id!);
      next.nodes = next.nodes.filter(n=>n.id!==id);
      next.edges = next.edges.filter(e=>e.sourceId!==id && e.targetId!==id);
    } else if (op.type === 'create_edge') {
      if (!op.sourceId || !op.targetId) throw new Error('La relación necesita dos cuadros.');
      next.edges.push({id:`ce-${randomUUID()}`, sourceId:resolve(op.sourceId)!,targetId:resolve(op.targetId)!,relation:op.relation ?? 'afecta',critical:false});
    } else if (op.type === 'delete_edge') {
      if (!next.edges.some(e=>e.id===id)) throw new Error('Relación inexistente.');
      next.edges=next.edges.filter(e=>e.id!==id);
    }
  }
  const byId = new Map(next.nodes.map(n=>[n.id,n]));
  for (const n of next.nodes) {
    const seen = new Set([n.id]); let parent=n.parentId;
    while(parent) { if(seen.has(parent) || !byId.has(parent)) throw new Error('La contención contiene un ciclo o cuadro inexistente.'); seen.add(parent);parent=byId.get(parent)!.parentId; }
    n.level = seen.size;
    if (n.level > 15) throw new Error('El canvas admite hasta 15 niveles de contención anidada.');
    if(newTransforms.has(n.id) && ( !n.fromNodeId || !n.toNodeId || byId.get(n.fromNodeId)?.type!=='estado' || byId.get(n.toNodeId)?.type!=='estado' || n.fromNodeId === n.toNodeId)) throw new Error('Una transformación necesita estados A y B existentes.');
  }
  for (const n of next.nodes) if (removedIds.has(n.fromNodeId ?? '') || removedIds.has(n.toNodeId ?? '')) throw new Error('No se puede eliminar un estado usado por una transformación.');
  for (const e of next.edges) if(!byId.has(e.sourceId)||!byId.has(e.targetId)||e.sourceId===e.targetId) throw new Error('Relación inválida.');
  const outgoing = new Map<string, string[]>();
  for (const edge of next.edges) {
    const normalized = normalizeProductiveRelation(edge.sourceId, edge.targetId, edge.relation);
    if (normalized.temporal) outgoing.set(normalized.sourceId, [...(outgoing.get(normalized.sourceId) ?? []), normalized.targetId]);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error('Las precedencias temporales contienen un ciclo.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of outgoing.get(id) ?? []) visit(target);
    visiting.delete(id); visited.add(id);
  };
  for (const id of outgoing.keys()) visit(id);
  next.pathIds=next.pathIds.filter(id=>byId.has(id));
  return next;
}
