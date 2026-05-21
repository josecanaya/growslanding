import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types/supabase.gen';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_COOKIE_CHUNK_SIZE = 3180;
const MAX_COOKIE_CHUNKS = 20;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(prefix.length));
}

function readChunkedCookie(name: string): string | null {
  const direct = readCookie(name);
  if (direct !== null) return direct;

  const chunks: string[] = [];
  for (let index = 0; index < MAX_COOKIE_CHUNKS; index += 1) {
    const chunk = readCookie(`${name}.${index}`);
    if (chunk === null) break;
    chunks.push(chunk);
  }

  return chunks.length > 0 ? chunks.join('') : null;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    'path=/',
    `max-age=${maxAge}`,
    'SameSite=Lax',
  ].join('; ');
}

class BrowserCookieStorageAdapter {
  getItem(key: string): string | null {
    return readChunkedCookie(key);
  }

  setItem(key: string, value: string): void {
    this.removeItem(key);

    if (value.length <= MAX_COOKIE_CHUNK_SIZE) {
      writeCookie(key, value, 60 * 60 * 24 * 365);
      return;
    }

    const chunks = value.match(new RegExp(`.{1,${MAX_COOKIE_CHUNK_SIZE}}`, 'g')) ?? [];
    chunks.forEach((chunk, index) => {
      writeCookie(`${key}.${index}`, chunk, 60 * 60 * 24 * 365);
    });
  }

  removeItem(key: string): void {
    writeCookie(key, '', 0);
    for (let index = 0; index < MAX_COOKIE_CHUNKS; index += 1) {
      writeCookie(`${key}.${index}`, '', 0);
    }
  }
}

/**
 * Cliente solo para `/auth/callback`.
 *
 * `createClientComponentClient` usa el helper de auth-helpers, que fuerza
 * `detectSessionInUrl: true` en el navegador. Eso hace que GoTrue intercambie
 * el código PKCE en `_initialize` mientras este archivo también llama a
 * `exchangeCodeForSession` → dos POST a `/token?grant_type=pkce` y más 429.
 *
 * Aquí desactivamos la detección automática en la URL: un único intercambio
 * explícito. Usamos un adapter local de cookies para leer el mismo PKCE
 * `code_verifier` que guardan los auth-helpers, sin importar el paquete shared.
 */
export function createOAuthCallbackSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son obligatorias',
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: new BrowserCookieStorageAdapter(),
    },
  });
}
