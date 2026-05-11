import type { SupabaseClient } from '@supabase/supabase-js';

export type SocioAuthRecord = {
  id: string;
  org_id: string | null;
  email: string | null;
  nombre: string | null;
  user_id?: string | null;
};

/**
 * Todas las filas `socios` que podrían pertenecer a la sesión (por `user_id` o por email ILIKE sin filtrar org).
 */
export async function listSocioRecordsForAuthUser(
  supabase: SupabaseClient<any>,
  user: { id: string; email?: string | null },
): Promise<SocioAuthRecord[]> {
  const sb = supabase as any;
  const byId = new Map<string, SocioAuthRecord>();

  const { data: uidRows, error: errUid } = await sb
    .from('socios')
    .select('id, org_id, email, nombre, user_id')
    .eq('user_id', user.id);

  const errUidMsg = String(errUid?.message || '').toLowerCase();
  if (errUid && !errUidMsg.includes('column') && !errUidMsg.includes('user_id')) {
    console.warn('[listSocioRecordsForAuthUser] user_id:', errUid);
  }

  for (const r of uidRows ?? []) {
    if (r?.id) byId.set(r.id, r as SocioAuthRecord);
  }

  const raw = user.email?.trim();
  if (raw) {
    const { data: emailRows, error: errEmail } = await sb
      .from('socios')
      .select('id, org_id, email, nombre, user_id')
      .ilike('email', raw);

    if (errEmail) {
      console.warn('[listSocioRecordsForAuthUser] email:', errEmail);
    } else {
      for (const r of emailRows ?? []) {
        if (r?.id && !byId.has(r.id)) {
          byId.set(r.id, r as SocioAuthRecord);
        }
      }
    }
  }

  return Array.from(byId.values());
}

/** Prioridad: `responsable_socio_id` concordante → misma `org_id` que la tarea → primera fila. */
export function elegirSocioPreferenteParaTarea(
  candidatos: SocioAuthRecord[],
  prefs: { responsableSocioId?: string | null; orgId?: string | null },
): SocioAuthRecord | null {
  if (!candidatos.length) return null;
  const rs = prefs.responsableSocioId?.trim();
  if (rs) {
    const hit = candidatos.find((c) => c.id === rs);
    if (hit) return hit;
  }
  const oid = prefs.orgId?.trim();
  if (oid) {
    const hit = candidatos.find((c) => c.org_id && c.org_id === oid);
    if (hit) return hit;
  }
  return candidatos[0];
}

/** Compat: fila “natural” cuando no hay tarea/org (prioriza vínculo `user_id`). */
export function socioPreferenteSinPrefs(candidatos: SocioAuthRecord[], authUserId: string): SocioAuthRecord | null {
  if (!candidatos.length) return null;
  const fuerte = candidatos.find((c) => c.user_id && c.user_id === authUserId);
  if (fuerte) return fuerte;
  return candidatos[0];
}

/**
 * Resuelve la fila `socios` del usuario autenticado.
 * Orden: `user_id` = auth user id (vinculación fuerte), luego email (ilike, case-insensitive).
 * Sirve para API (service client) y cliente (anon con RLS si aplica).
 */
export async function resolveSocioRecordForAuthUser(
  supabase: SupabaseClient<any>,
  user: { id: string; email?: string | null },
): Promise<SocioAuthRecord | null> {
  const todas = await listSocioRecordsForAuthUser(supabase, user);
  return socioPreferenteSinPrefs(todas, user.id);
}

/**
 * Resolución fuerte cuando la tarea trae `responsable_socio_id` / `org_id`:
 * garantiza mismo `socio.id` si la sesión lo cubre (`user_id` o email).
 */
export async function resolveSocioParaOperacionDeTarea(
  supabase: SupabaseClient<any>,
  user: { id: string; email?: string | null },
  prefs: { responsableSocioId?: string | null; orgId?: string | null },
): Promise<SocioAuthRecord | null> {
  const todas = await listSocioRecordsForAuthUser(supabase, user);
  const elegido = elegirSocioPreferenteParaTarea(todas, prefs);
  if (elegido) return elegido;
  return socioPreferenteSinPrefs(todas, user.id);
}
