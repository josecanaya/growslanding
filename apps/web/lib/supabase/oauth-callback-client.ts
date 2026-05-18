import { createClient } from '@supabase/supabase-js';
import { BrowserCookieAuthStorageAdapter } from '@supabase/auth-helpers-shared';

import type { Database } from '@/lib/types/supabase.gen';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente solo para `/auth/callback`.
 *
 * `createClientComponentClient` usa el helper de auth-helpers, que fuerza
 * `detectSessionInUrl: true` en el navegador. Eso hace que GoTrue intercambie
 * el código PKCE en `_initialize` mientras este archivo también llama a
 * `exchangeCodeForSession` → dos POST a `/token?grant_type=pkce` y más 429.
 *
 * Aquí desactivamos la detección automática en la URL: un único intercambio
 * explícito y las cookies siguen usando el mismo adapter que el resto de la app.
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
      storage: new BrowserCookieAuthStorageAdapter(),
    },
  });
}
