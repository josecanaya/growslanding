import { describe, expect, it } from 'vitest';
import { formatPatronMarkdown } from '@/lib/proyecto-vivo/orquestador/appendPatronAnonimo';

describe('formatPatronMarkdown', () => {
  it('no incluye ids de obra ni montos', () => {
    const md = formatPatronMarkdown(
      {
        evento: 'aceptada',
        transform_kind: 'conocimiento',
        verbo: 'Definir rumbo',
        estado_a: 'Idea',
        estado_b: 'Alcance de: Casa habitada',
      },
      '2026-08-18T15:00:00.000Z',
    );
    expect(md).toContain('evento: aceptada');
    expect(md).toContain('A: Idea');
    expect(md).toContain('T: Definir rumbo');
    expect(md).not.toMatch(/obra_id|org_id|wallet|\$/);
  });
});
