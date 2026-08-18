/** IDs cliente cn-/ce- con UUID embebido (mismo contrato que canvasSupabaseMapper). */
export function newCanvasNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `cn-${crypto.randomUUID()}`;
  }
  return `cn-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function newCanvasEdgeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `ce-${crypto.randomUUID()}`;
  }
  return `ce-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
