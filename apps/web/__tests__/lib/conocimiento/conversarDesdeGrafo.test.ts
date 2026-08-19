import { describe, expect, it } from 'vitest';
import { conversarDesdeGrafo } from '@/lib/conocimiento/conversarDesdeGrafo';

describe('conversarDesdeGrafo', () => {
  it('nombra nodos y pide un siguiente paso', () => {
    const text = conversarDesdeGrafo({
      pregunta: 'qué propone el orquestador',
      queryText: [
        'NODE Orquestador L0 solo propone [src=x loc=None community=0]',
        'NODE Atomo ESTADO A transformacion ESTADO B [src=y loc=None community=2]',
        'EDGE Orquestador L0 solo propone --references [EXTRACTED]--> Atomo ESTADO A transformacion ESTADO B',
      ].join('\n'),
    });
    expect(text).toContain('Orquestador L0 solo propone');
    expect(text).toContain('Atomo ESTADO A');
    expect(text).toMatch(/vecino|seguir/i);
  });

  it('si no hay nodos, ofrece el núcleo', () => {
    const text = conversarDesdeGrafo({
      pregunta: 'hormigón pretensado',
      queryText: '0 nodes found',
      godText: 'God nodes:\n  1. Orquestador L0 solo propone',
    });
    expect(text).toContain('no tiene un nodo');
    expect(text).toContain('Orquestador L0');
  });
});
