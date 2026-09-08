import { describe, expect, it } from 'vitest';

import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  aggregatedScopePairs,
  buildNodeIndex,
  classifyEdgeForScope,
  scopeAnchorId,
  scopePathIds,
  scopeRelationCounts,
  visibleEdgesForScope,
  visibleNodesForScope,
} from '@/lib/canvas/canvasScope';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';

const UUIDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
];

function node(
  id: string,
  parentId: string | null,
  level: number,
  type: CanvasNode['type'],
  title: string,
): CanvasNode {
  return {
    id,
    parentId,
    level,
    type,
    title,
    position: { x: 0, y: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

/**
 * Obra
 *  ├ Piso 3 ─ Estructura P3 ─ Losa P3
 *  └ Piso 4 ─ Estructura P4 ─ Vigas ─ V18
 *
 * Relación cross-scope: «Losa P3 habilita V18».
 */
const [p3, e3, losa3, p4, e4, vigas, v18, mamposteria] = UUIDS;

const NODES: CanvasNode[] = [
  node(p3!, null, 1, 'etapa', 'Piso 3'),
  node(e3!, p3!, 2, 'planta', 'Estructura P3'),
  node(losa3!, e3!, 3, 'tarea', 'Losa P3'),
  node(p4!, null, 1, 'etapa', 'Piso 4'),
  node(e4!, p4!, 2, 'planta', 'Estructura P4'),
  node(vigas!, e4!, 3, 'sector', 'Vigas'),
  node(v18!, vigas!, 4, 'tarea', 'V18'),
  node(mamposteria!, p4!, 2, 'planta', 'Mampostería'),
];

const CROSS_SCOPE_EDGE: CanvasPrecedenceEdge = {
  id: 'ce-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  sourceId: losa3!,
  targetId: v18!,
  critical: false,
};

/** Hermanos dentro de Piso 4: Estructura P4 precede Mampostería. */
const SIBLING_EDGE: CanvasPrecedenceEdge = {
  id: 'ce-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  sourceId: e4!,
  targetId: mamposteria!,
  critical: false,
};

const EDGES = [CROSS_SCOPE_EDGE, SIBLING_EDGE];

describe('visibleNodesForScope — un único scope a la vez', () => {
  it('en la raíz muestra sólo los nodos sin padre', () => {
    expect(visibleNodesForScope(NODES, null).map((n) => n.title)).toEqual(['Piso 3', 'Piso 4']);
  });

  it('al entrar a Piso 4 muestra sólo sus hijos directos, sin nietos', () => {
    const titles = visibleNodesForScope(NODES, p4!).map((n) => n.title);
    expect(titles).toEqual(['Estructura P4', 'Mampostería']);
    expect(titles).not.toContain('Vigas');
    expect(titles).not.toContain('V18');
  });

  it('baja recursivamente hasta el nivel hoja', () => {
    expect(visibleNodesForScope(NODES, e4!).map((n) => n.title)).toEqual(['Vigas']);
    expect(visibleNodesForScope(NODES, vigas!).map((n) => n.title)).toEqual(['V18']);
    expect(visibleNodesForScope(NODES, v18!)).toEqual([]);
  });
});

describe('scopePathIds — breadcrumb derivado de la contención', () => {
  it('devuelve la cadena desde la raíz hasta el nodo', () => {
    expect(scopePathIds(NODES, v18!)).toEqual([p4!, e4!, vigas!, v18!]);
  });
});

describe('scopeAnchorId — proyección de un nodo profundo al scope visible', () => {
  it('ancla V18 en Piso 4 cuando el scope es la raíz', () => {
    const index = buildNodeIndex(NODES);
    expect(scopeAnchorId(index, null, v18!)).toBe(p4!);
    expect(scopeAnchorId(index, null, losa3!)).toBe(p3!);
  });

  it('devuelve null si el nodo no pertenece al subárbol del scope', () => {
    const index = buildNodeIndex(NODES);
    expect(scopeAnchorId(index, p4!, losa3!)).toBeNull();
  });
});

describe('classifyEdgeForScope — el mismo grafo proyectado por nivel', () => {
  const index = buildNodeIndex(NODES);

  it('en la raíz, la relación profunda es agregada Piso 3 → Piso 4', () => {
    const c = classifyEdgeForScope(index, null, CROSS_SCOPE_EDGE);
    expect(c.kind).toBe('agregada');
    if (c.kind === 'agregada') {
      expect(c.sourceAnchorId).toBe(p3!);
      expect(c.targetAnchorId).toBe(p4!);
    }
  });

  it('dentro de Piso 4, la misma relación es externa entrante en Estructura P4', () => {
    const c = classifyEdgeForScope(index, p4!, CROSS_SCOPE_EDGE);
    expect(c.kind).toBe('externa');
    if (c.kind === 'externa') {
      expect(c.anchorId).toBe(e4!);
      expect(c.direction).toBe('in');
    }
  });

  it('una relación entre hermanos del scope es directa', () => {
    expect(classifyEdgeForScope(index, p4!, SIBLING_EDGE).kind).toBe('directa');
  });

  it('desde la raíz, la relación entre hermanos de Piso 4 es interna a esa tarjeta', () => {
    const c = classifyEdgeForScope(index, null, SIBLING_EDGE);
    expect(c.kind).toBe('interna');
    if (c.kind === 'interna') expect(c.anchorId).toBe(p4!);
  });
});

describe('visibleEdgesForScope — primera iteración: sólo aristas entre nodos visibles', () => {
  it('no dibuja la relación cross-scope ni en la raíz ni dentro de Piso 4', () => {
    expect(visibleEdgesForScope(NODES, null, EDGES)).toEqual([]);
    expect(visibleEdgesForScope(NODES, p4!, EDGES).map((e) => e.id)).toEqual(['ce-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']);
  });
});

describe('scopeRelationCounts — indicador en la tarjeta sin desplegar el subárbol', () => {
  it('cuenta la relación profunda como agregada en la raíz', () => {
    const counts = scopeRelationCounts(NODES, null, EDGES);
    expect(counts.get(p3!)?.aggregatedOut).toBe(1);
    expect(counts.get(p4!)?.aggregatedIn).toBe(1);
  });

  it('cuenta la relación como externa cuando el otro extremo queda fuera del scope', () => {
    const counts = scopeRelationCounts(NODES, p4!, EDGES);
    expect(counts.get(e4!)?.externalIn).toBe(1);
    expect(counts.get(mamposteria!)?.externalIn ?? 0).toBe(0);
  });
});

describe('aggregatedScopePairs — modelo preparado para la proyección futura', () => {
  it('agrupa las aristas profundas en un par de tarjetas visibles', () => {
    expect(aggregatedScopePairs(NODES, null, EDGES)).toEqual([
      { sourceId: p3!, targetId: p4!, edgeIds: ['ce-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'] },
    ]);
  });
});

describe('persistencia — ninguna caja aísla lo que contiene', () => {
  it('el snapshot conserva las relaciones entre nodos de distintos scopes', () => {
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Obra',
      nodes: NODES,
      pathIds: [p4!, e4!, vigas!],
      edges: EDGES,
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
    });
    expect(snapshot.edges.map((e) => e.id).sort()).toEqual(['ce-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ce-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']);
  });

  it('conserva el vocabulario de relación y hace round-trip a canvas_edges.type', () => {
    const habilita: CanvasPrecedenceEdge = {
      id: 'ce-cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      sourceId: losa3!,
      targetId: v18!,
      critical: false,
      relation: 'habilita',
    };
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Obra',
      nodes: NODES,
      pathIds: [],
      edges: [habilita],
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
    });
    expect(snapshot.edges[0]?.relation).toBe('habilita');

    const rows = persistedToSupabaseRows(
      '99999999-9999-4999-8999-999999999999',
      '10101010-1010-4010-8010-101010101010',
      snapshot,
    );
    expect(rows.edges[0]?.type).toBe('habilita');
  });

  it('una relación `precede` sigue guardándose como `precedencia` (no rompe publicar-tareas)', () => {
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Obra',
      nodes: NODES,
      pathIds: [],
      edges: [{ ...SIBLING_EDGE, relation: 'precede' }, CROSS_SCOPE_EDGE],
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
    });
    const rows = persistedToSupabaseRows(
      '99999999-9999-4999-8999-999999999999',
      '10101010-1010-4010-8010-101010101010',
      snapshot,
    );
    expect(rows.edges.map((e) => e.type)).toEqual(['precedencia', 'precedencia']);
  });

  it('conserva un pathIds profundo sin exigir tipos concretos por nivel', () => {
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Obra',
      nodes: NODES,
      pathIds: [p4!, e4!, vigas!, v18!],
      edges: EDGES,
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
    });
    expect(snapshot.pathIds).toEqual([p4!, e4!, vigas!, v18!]);
  });

  it('descarta un pathIds que no es una cadena de contención válida', () => {
    const snapshot = composeCanvasPersisted({
      obraNombre: 'Obra',
      nodes: NODES,
      pathIds: [p4!, losa3!],
      edges: EDGES,
      budgetGroups: [],
      projectKind: 'edificio_multifamiliar',
    });
    expect(snapshot.pathIds).toEqual([p4!]);
  });
});
