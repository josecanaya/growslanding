export type PublicationNode = {
  id: string; type: string; transform_kind?: string | null;
  from_node_id?: string | null; to_node_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function publicationBlockReason(node: PublicationNode, nodes: PublicationNode[], projectVivo: boolean): string | null {
  if (node.type !== 'tarea') return 'El nodo no es una tarea.';
  const modern = projectVivo || Boolean(node.transform_kind);
  const proposal = node.metadata?.orquestador as { estado?: string } | undefined;
  if (proposal && proposal.estado !== 'aceptada') return 'La propuesta debe estar aceptada por una persona.';
  if (!modern) return null;
  if (node.transform_kind !== 'ejecucion') return 'Solo se publican transformaciones de ejecución.';
  if (proposal?.estado !== 'aceptada') return 'La transformación requiere aceptación explícita.';
  const from = nodes.find((n) => n.id === node.from_node_id);
  const to = nodes.find((n) => n.id === node.to_node_id);
  if (!from || !to || from.type !== 'estado' || to.type !== 'estado' || from.id === to.id) {
    return 'Los extremos A/B deben ser estados distintos de esta obra.';
  }
  return null;
}
