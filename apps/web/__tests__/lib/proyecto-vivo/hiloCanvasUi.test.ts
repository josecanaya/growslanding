import { describe, it, expect } from 'vitest';
import { mergeCanvasUiHilo, parseHiloCanvasUi } from '@/lib/proyecto-vivo/hiloCanvasUi';

describe('mergeCanvasUiHilo', () => {
  it('respects scope/selection metadata', () => {
    const next = mergeCanvasUiHilo({}, [{
      id: 'u-1',
      role: 'user',
      text: 'Creá Vigas',
      at: '2026-09-10T00:00:00Z',
      scopePathIds: ['obra', 'piso'],
      selectionIds: ['n1'],
    }]);
    const hilo = parseHiloCanvasUi(next);
    expect(hilo).toHaveLength(1);
    expect(hilo[0].scopePathIds).toEqual(['obra', 'piso']);
    expect(hilo[0].selectionIds).toEqual(['n1']);
  });
});
