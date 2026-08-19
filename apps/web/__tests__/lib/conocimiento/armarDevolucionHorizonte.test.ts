import { describe, expect, it } from 'vitest';
import { armarDevolucionHorizonte } from '@/lib/conocimiento/armarDevolucionHorizonte';

describe('armarDevolucionHorizonte', () => {
  it('responde lote/tipología y no copia el mensaje como nodo', () => {
    const text = armarDevolucionHorizonte({
      mensaje: 'que terreno me conviene?',
      objetivo: 'edificio de 100 departamentos',
      corpus: [],
      grafoText: null,
      anotoPaso: null,
    });
    expect(text).toMatch(/medianeras|tipolog/i);
    expect(text).toContain('100 departamentos');
    expect(text).not.toMatch(/Queda: que terreno/i);
  });
});
