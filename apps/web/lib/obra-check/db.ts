/**
 * Acceso a datos de Obra Check.
 *
 * Las tablas obra_check_* NO están en supabase.gen.ts (son del schema aislado de esta herramienta),
 * así que se usa un cliente service sin tipar. Acceso EXCLUSIVO por service role: el browser nunca
 * habla directo con Supabase; todo pasa por las API routes de /api/obra-check.
 */

import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const OBRA_CHECK_COOKIE = 'obra_check_token';

/** Cliente service sin tipar para las tablas obra_check_*. */
export function obraCheckDb(): SupabaseClient {
  return createServiceSupabaseClient() as unknown as SupabaseClient;
}

export type ObraCheckSessionRow = {
  id: string;
  session_token: string;
  email: string | null;
  empresa: string | null;
  tipo_obra: string | null;
  consent_procesamiento: boolean;
  consent_patrones: boolean;
};

/** Lee el token de la cookie httpOnly y devuelve la sesión, o null si no existe. */
export async function getSessionFromCookie(
  db: SupabaseClient,
): Promise<ObraCheckSessionRow | null> {
  const store = await cookies();
  const token = store.get(OBRA_CHECK_COOKIE)?.value;
  if (!token) return null;

  const { data, error } = await db
    .from('obra_check_sessions')
    .select('id, session_token, email, empresa, tipo_obra, consent_procesamiento, consent_patrones')
    .eq('session_token', token)
    .maybeSingle();

  if (error || !data) return null;
  return data as ObraCheckSessionRow;
}

/** Registra un evento de analítica (fire-and-forget: los errores no interrumpen el flujo). */
export async function logEvent(
  db: SupabaseClient,
  sessionId: string | null,
  tipo: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.from('obra_check_events').insert({ session_id: sessionId, tipo, payload });
  } catch {
    // no-op
  }
}

/** Toca last_activity_at para la sesión. */
export async function touchSession(db: SupabaseClient, sessionId: string): Promise<void> {
  try {
    await db
      .from('obra_check_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', sessionId);
  } catch {
    // no-op
  }
}
