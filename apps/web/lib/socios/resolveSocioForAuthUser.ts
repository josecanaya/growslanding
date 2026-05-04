import type { SupabaseClient } from '@supabase/supabase-js';

export type SocioAuthRecord = {
  id: string;
  org_id: string | null;
  email: string | null;
  nombre: string | null;
};

/**
 * Resuelve la fila `socios` del usuario autenticado.
 * Orden: `user_id` = auth user id (vinculación fuerte), luego email (ilike, case-insensitive).
 * Sirve para API (service client) y cliente (anon con RLS si aplica).
 */
export async function resolveSocioRecordForAuthUser(
  supabase: SupabaseClient<any>,
  user: { id: string; email?: string | null },
): Promise<SocioAuthRecord | null> {
  const sb = supabase as any;

  const { data: byUid, error: errUid } = await sb
    .from('socios')
    .select('id, org_id, email, nombre')
    .eq('user_id', user.id)
    .maybeSingle();

  const errMsg = String(errUid?.message || '').toLowerCase();
  if (errUid && !errMsg.includes('user_id') && !errMsg.includes('column')) {
    console.warn('[resolveSocioRecordForAuthUser] user_id:', errUid);
  }
  if (byUid?.id) {
    return byUid as SocioAuthRecord;
  }

  const raw = user.email?.trim();
  if (!raw) return null;
  const e = raw.toLowerCase();

  const { data: byEmail, error: errEmail } = await sb
    .from('socios')
    .select('id, org_id, email, nombre')
    .ilike('email', e)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (errEmail) {
    console.warn('[resolveSocioRecordForAuthUser] email:', errEmail);
    return null;
  }
  if (!byEmail?.id) return null;
  return byEmail as SocioAuthRecord;
}
