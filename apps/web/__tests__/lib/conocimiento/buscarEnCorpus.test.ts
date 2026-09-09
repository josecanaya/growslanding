import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarEnCorpusAsync } from '@/lib/conocimiento/buscarEnCorpus';
vi.mock('@/lib/conocimiento/paths', () => ({ resolveConocimientoRoot: () => null }));
afterEach(() => vi.unstubAllGlobals());
describe('corpus remote fallback', () => {
  it('bounds all remote requests and tolerates unavailable corpus without networking in tests', async () => {
    const fetchMock = vi.fn(async (_url, options) => {
      expect(options.signal).toBeDefined();
      expect(options.signal.aborted).toBe(false);
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(buscarEnCorpusAsync('arquitectura vivienda')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });
});
