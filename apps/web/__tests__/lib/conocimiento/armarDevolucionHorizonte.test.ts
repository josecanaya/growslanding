import { describe, expect, it } from 'vitest';
import { sintetizarSinLlm } from '@/lib/conocimiento/responderConConocimiento';

describe('sintetizarSinLlm', () => {
  it('pregunta de terreno no inventa nodo Queda:', () => {
    const text = sintetizarSinLlm({
      mensaje: 'que terreno me conviene?',
      objetivo: 'edificio de 100 departamentos',
      corpus: [],
      anotoPaso: null,
    });
    expect(text).toMatch(/medianeras|esquina|tipolog/i);
    expect(text).toContain('100 departamentos');
    expect(text).not.toMatch(/Queda: que terreno/i);
  });

  it('no dispara charla de lote solo por decir casa', () => {
    const text = sintetizarSinLlm({
      mensaje: 'cómo arranco la casa?',
      objetivo: null,
      corpus: [
        {
          file: '01_construccion/09_arquitectura/x.md',
          excerpt: 'Orden: lote, programa, corte. Después oficio de gremio.',
        },
      ],
      anotoPaso: null,
    });
    expect(text).toContain('lote, programa, corte');
    expect(text).not.toMatch(/Para elegir terreno primero/i);
  });
});
