import { describe, expect, it } from 'vitest';
import {
  persistedToSupabaseRows,
  supabaseRowsToPersisted,
  toClientNodeId,
} from '@/lib/canvas/canvasSupabaseMapper';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';

const OBRA_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORG_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function estado(id: string, title: string, extra?: Partial<CanvasNode>): CanvasNode {
  return {
    id,
    parentId: null,
    level: 1,
    type: 'estado',
    title,
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    graphStatus: 'alcanzado',
    ...extra,
  };
}

describe('canvasSupabaseMapper proyecto_vivo roundtrip', () => {
  it('conserva estado + transformación con from/to y T', () => {
    const ideaId = toClientNodeId('11111111-1111-1111-1111-111111111111');
    const trId = toClientNodeId('22222222-2222-2222-2222-222222222222');
    const anteId = toClientNodeId('33333333-3333-3333-3333-333333333333');

    const snapshot = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [
        estado(ideaId, 'Idea'),
        {
          id: trId,
          parentId: null,
          level: 1,
          type: 'tarea',
          title: 'Diseñar',
          position: { x: 100, y: 0 },
          createdAt: '2026-01-01T00:00:00.000Z',
          transformKind: 'conocimiento',
          fromNodeId: ideaId,
          toNodeId: anteId,
          graphStatus: 'propuesta',
          tValue: 3,
          tComponents: { gamma: 1, sigma: 1, criticidad: 0 },
          tFormulaId: 'proxies_v0',
        },
        estado(anteId, 'Anteproyecto', { graphStatus: 'fantasma' }),
      ],
    });

    const rows = persistedToSupabaseRows(OBRA_ID, ORG_ID, snapshot);
    const trRow = rows.nodes.find((n) => n.id.endsWith('22222222-2222-2222-2222-222222222222'));
    expect(trRow?.transform_kind).toBe('conocimiento');
    expect(trRow?.from_node_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(trRow?.to_node_id).toBe('33333333-3333-3333-3333-333333333333');
    expect(trRow?.graph_status).toBe('propuesta');
    expect(Number(trRow?.t_value)).toBe(3);

    const back = supabaseRowsToPersisted({
      obra: { id: OBRA_ID, name: 'Test', canvas_project_kind: 'otro', canvas_ui: { pathIds: [] } },
      budgetGroups: [],
      nodes: rows.nodes as any[],
      edges: [],
      checklistItems: [],
    });

    const tr = back.nodes.find((n) => n.id === trId);
    expect(tr?.transformKind).toBe('conocimiento');
    expect(tr?.fromNodeId).toBe(ideaId);
    expect(tr?.toNodeId).toBe(anteId);
    expect(tr?.tValue).toBe(3);
    expect(tr?.tComponents?.gamma).toBe(1);
  });
});
