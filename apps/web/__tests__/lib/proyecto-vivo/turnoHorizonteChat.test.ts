import { describe, expect, it, vi } from 'vitest';
import { turnoHorizonteChat } from '@/lib/proyecto-vivo/orquestador/turnoHorizonteChat';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';

vi.mock('@/lib/conocimiento/queryConocimientoMcp', () => ({
  queryConocimientoMcp: async () => ({ ok: false, text: '', queryText: '', godText: '' }),
}));

const canvas: CanvasMultinivelPersisted = {
  v: 4,
  obraNombre: 'Test',
  pathIds: [],
  edges: [],
  budgetGroups: [],
  projectKind: 'otro',
  nodes: [
    {
      id: 'est-idea',
      parentId: null,
      level: 1,
      type: 'estado',
      title: 'IDEA',
      position: { x: 0, y: 0 },
      createdAt: '2026-01-01T00:00:00.000Z',
      graphStatus: 'alcanzado',
    },
  ],
};

describe('turnoHorizonteChat', () => {
  it('una pregunta no inserta transformación', async () => {
    const t = await turnoHorizonteChat({
      canvas,
      mensaje: 'que terreno me conviene?',
      objetivo: 'edificio de 100 departamentos',
    });
    expect(t.propuesta.nodos).toHaveLength(0);
    expect(t.reply.toLowerCase()).toMatch(/lote|medianera|esquina|tipolog/);
  });
});
