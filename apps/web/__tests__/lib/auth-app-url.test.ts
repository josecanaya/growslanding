import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAppWebUrl } from '@/lib/config';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('app origin for auth redirects', () => {
  it.each([
    'https://growsapp2.vercel.app',
    'https://growsapp2-preview.vercel.app',
    'http://localhost:3100',
  ])('returns to the origin that started authentication (%s)', (origin) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.grows.com.ar');
    vi.stubGlobal('window', { location: new URL(origin) });

    expect(getAppWebUrl()).toBe(origin);
  });

  it('honors the configured URL when generating server-side links', () => {
    vi.stubGlobal('window', undefined);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.test');

    expect(getAppWebUrl()).toBe('https://example.test');
  });
});
