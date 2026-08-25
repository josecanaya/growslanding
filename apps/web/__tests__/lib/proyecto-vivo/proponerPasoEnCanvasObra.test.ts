import { describe, expect, it } from 'vitest';
import { proponerPasoEnCanvasObra } from '@/lib/proyecto-vivo/orquestador/proponerPasoEnCanvasObra';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';

const empty: CanvasMultinivelPersisted = {
  v: 4,
  obraNombre: 'X',
  pathIds: [],
  edges: [],
  budgetGroups: [],
  projectKind: 'edificio_multifamiliar',
  nodes: [],
};

describe('proponerPasoEnCanvasObra', () => {
  it('crea etapa 00 y tarea con precedencia', () => {
    const a = proponerPasoEnCanvasObra({
      canvas: empty,
      mensaje: 'Definir lote → Lote 30x40',
    });
    expect(a.nodos.some((n) => n.type === 'etapa')).toBe(true);
    expect(a.nodos.some((n) => n.type === 'tarea' && n.title === 'Definir lote')).toBe(true);
    expect(a.edges).toHaveLength(0);

    const withEtapa = {
      ...empty,
      nodes: a.nodos,
    };
    const b = proponerPasoEnCanvasObra({
      canvas: withEtapa,
      mensaje: 'Definir envelope → H 36m',
    });
    expect(b.nodos.filter((n) => n.type === 'etapa')).toHaveLength(0);
    expect(b.edges).toHaveLength(1);
  });
});
