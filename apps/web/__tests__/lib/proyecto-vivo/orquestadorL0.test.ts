import { describe, expect, it } from 'vitest';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import {
  persistedToSupabaseRows,
  supabaseRowsToPersisted,
  toClientNodeId,
} from '@/lib/canvas/canvasSupabaseMapper';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { proponerL0, recetaL0 } from '@/lib/proyecto-vivo/orquestador/proponerL0';

function idea(): CanvasNode {
  return {
    id: 'cn-11111111-1111-1111-1111-111111111111',
    parentId: null,
    level: 1,
    type: 'estado',
    title: 'Idea',
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    graphStatus: 'alcanzado',
  };
}

describe('orquestador L0', () => {
  it('receta incluye ejecución solo si el objetivo suena a obra', () => {
    expect(recetaL0('Definir marca').map((p) => p.transformKind)).toEqual([
      'conocimiento',
      'coordinacion',
    ]);
    expect(recetaL0('Casa habitada').some((p) => p.transformKind === 'ejecucion')).toBe(true);
  });

  it('propone desde Idea sin marcar realizada ni tocar tareas', () => {
    const canvas = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea()],
    });
    const r = proponerL0({ canvas, objetivoTexto: 'Vivienda terminada' });
    expect(r.nodos.length).toBeGreaterThanOrEqual(2);
    expect(r.nodos.every((n) => n.transformacion.graphStatus === 'propuesta')).toBe(true);
    expect(r.nodos.every((n) => n.transformacion.executorKind === 'agente')).toBe(true);
    expect(r.nodos.every((n) => n.estadoB.graphStatus === 'fantasma')).toBe(true);
    expect(r.nodos.some((n) => n.transformacion.transformKind === 'ejecucion')).toBe(true);
  });

  it('es idempotente si ya existen los mismos pasos', () => {
    const first = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea()],
    });
    const r1 = proponerL0({ canvas: first, objetivoTexto: 'Casa' });
    const nodes = [
      ...first.nodes,
      ...r1.nodos.flatMap((n) => [n.transformacion, n.estadoB]),
    ];
    const second = composeCanvasPersisted({ ...first, nodes });
    const r2 = proponerL0({ canvas: second, objetivoTexto: 'Casa' });
    expect(r2.nodos).toHaveLength(0);
  });

  it('no propone si no hay estado alcanzado', () => {
    const canvas = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [
        {
          ...idea(),
          graphStatus: 'fantasma',
        },
      ],
    });
    const r = proponerL0({ canvas, objetivoTexto: 'X' });
    expect(r.nodos).toHaveLength(0);
  });

  it('el mapper roundtrip conserva orquestador pendiente', () => {
    const canvas = composeCanvasPersisted({
      obraNombre: 'Test',
      pathIds: [],
      edges: [],
      budgetGroups: [],
      projectKind: 'otro',
      nodes: [idea()],
    });
    const r = proponerL0({ canvas, objetivoTexto: 'X' });
    const mini = composeCanvasPersisted({
      ...canvas,
      nodes: [...canvas.nodes, ...r.nodos.flatMap((n) => [n.transformacion, n.estadoB])],
    });
    const rows = persistedToSupabaseRows(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      mini,
    );
    const tr = rows.nodes.find((n) => n.executor_kind === 'agente');
    expect((tr?.metadata as { orquestador?: { estado?: string } })?.orquestador?.estado).toBe(
      'pendiente',
    );
    expect(tr?.graph_status).toBe('propuesta');

    const back = supabaseRowsToPersisted({
      obra: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Test', canvas_project_kind: 'otro' },
      budgetGroups: [],
      nodes: rows.nodes as any[],
      edges: [],
      checklistItems: [],
    });
    const backTr = back.nodes.find((n) => n.id === toClientNodeId(tr!.id));
    expect(backTr?.orquestador?.estado).toBe('pendiente');
    expect(backTr?.graphStatus).toBe('propuesta');
  });
});
