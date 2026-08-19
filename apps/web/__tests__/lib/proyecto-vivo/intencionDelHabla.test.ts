import { describe, expect, it } from 'vitest';
import { intencionDelHabla } from '@/lib/proyecto-vivo/orquestador/intencionDelHabla';

describe('intencionDelHabla', () => {
  it('una pregunta no es un paso del grafo', () => {
    expect(intencionDelHabla('que terreno me conviene?')).toBe('pregunta');
    expect(intencionDelHabla('Cómo empiezo?')).toBe('pregunta');
    expect(intencionDelHabla('Convocar colaboración')).toBe('pregunta');
  });

  it('verbo → estado sí es un paso', () => {
    expect(intencionDelHabla('Elegir lote → Lote entre medianeras')).toBe('paso');
    expect(intencionDelHabla('Anotá el paso: definir programa')).toBe('paso');
  });
});
