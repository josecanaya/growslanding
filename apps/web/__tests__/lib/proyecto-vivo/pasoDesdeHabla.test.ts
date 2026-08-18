import { describe, expect, it } from 'vitest';
import { pasoDesdeHabla } from '@/lib/proyecto-vivo/orquestador/proponerDesdeChat';

describe('pasoDesdeHabla', () => {
  it('no usa la receta Definir rumbo / Convocar colaboración', () => {
    const p = pasoDesdeHabla('Quiero un festival de cine');
    expect(p.verb).toContain('festival');
    expect(p.verb).not.toMatch(/Definir rumbo/);
    expect(p.transformKind).toBe('conocimiento');
  });

  it('respeta verbo → estado', () => {
    const p = pasoDesdeHabla('Diseñar → Anteproyecto libre');
    expect(p.verb).toBe('Diseñar');
    expect(p.estadoB).toBe('Anteproyecto libre');
  });
});
