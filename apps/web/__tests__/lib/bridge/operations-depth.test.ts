import { describe, it, expect } from 'vitest';
import { applyBridgeOperations } from '@/lib/bridge/operations';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';

function emptyOp(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: 'create_node', id: null, parentId: null, title: null, description: null,
    nodeType: null, sourceId: null, targetId: null, relation: null,
    fromNodeId: null, toNodeId: null, transformKind: null, executorKind: null,
    quantity: null, unit: null, durationDays: null, sources: [], assumptions: [],
    ...overrides,
  };
}
function baseCanvas(): CanvasMultinivelPersisted {
  return { schemaVersion: 4, obra: {}, nodes: [], edges: [], budgetGroups: [], pathIds: [], projectKind: 'general' } as any;
}
describe('applyBridgeOperations depth', () => {
  it('acepta 8 niveles anidados', () => {
    const ops = Array.from({ length: 8 }, (_, i) => emptyOp({
      type: 'create_node', id: `tmp-${i}`, parentId: i === 0 ? null : `tmp-${i - 1}`,
      title: `Nivel ${i + 1}`, nodeType: 'sector',
    }));
    expect(() => applyBridgeOperations(baseCanvas(), { reply: '', operations: ops as any })).not.toThrow();
  });
  it('rechaza 16 niveles anidados', () => {
    const ops = Array.from({ length: 16 }, (_, i) => emptyOp({
      type: 'create_node', id: `tmp-${i}`, parentId: i === 0 ? null : `tmp-${i - 1}`,
      title: `Nivel ${i + 1}`, nodeType: 'sector',
    }));
    expect(() => applyBridgeOperations(baseCanvas(), { reply: '', operations: ops as any })).toThrow(/15 niveles/);
  });
});
