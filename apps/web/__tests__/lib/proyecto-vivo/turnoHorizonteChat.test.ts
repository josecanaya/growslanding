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
  projectKind: 'edificio_multifamiliar',
  nodes: [
    {
      id: 'cn-etapa',
      parentId: null,
      level: 1,
      type: 'etapa',
      title: '00. Definición del proyecto',
      position: { x: 0, y: 0 },
      createdAt: '2026-01-01T00:00:00.000Z',
      estadoNivel: 'en_curso',
    },
  ],
};

describe('turnoHorizonteChat', () => {
  it('una pregunta no inserta nodos', async () => {
    const t = await turnoHorizonteChat({
      canvas,
      mensaje: 'que terreno me conviene?',
      objetivo: 'edificio de 10 pisos',
    });
    expect(t.nodos.filter((n) => n.type === 'tarea')).toHaveLength(0);
    expect(t.reply.toLowerCase()).toMatch(/lote|medianera|esquina|tipolog|fos|huella/);
  });

  it('un paso crea tarea bajo etapa 00', async () => {
    const t = await turnoHorizonteChat({
      canvas,
      mensaje: 'Definir programa → Unidades por piso',
      objetivo: 'edificio de 10 pisos',
    });
    expect(t.anotoPaso).toBe(true);
    const tarea = t.nodos.find((n) => n.type === 'tarea');
    expect(tarea?.title).toBe('Definir programa');
    expect(tarea?.parentId).toBe('cn-etapa');
  });
});
