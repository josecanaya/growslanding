import { randomUUID } from 'crypto';

export function newCanvasNodeId(): string {
  return `cn-${randomUUID()}`;
}

export function newCanvasEdgeId(): string {
  return `ce-${randomUUID()}`;
}
