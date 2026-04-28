import { createServiceSupabaseClient } from './supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase.gen';

type OrgRecord = {
  id: string;
  name: string;
  user_id: string | null;
};

export async function ensureOrgForUser(userId: string, fallbackName: string) {
  const supabase = createServiceSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('organizations')
    .select('id, name, user_id')
      .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  const defaultName = fallbackName || 'Organización sin nombre';
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: defaultName,
      user_id: userId,
    })
    .select('id, name, user_id')
    .single();

  if (error) {
    throw error;
  }

  return data as OrgRecord;
}

export async function resolveOrgContext(
  userId: string,
  fallbackName: string,
  email?: string | null
): Promise<{ org: OrgRecord; role: 'owner' | 'leader' }> {
  const supabase = createServiceSupabaseClient();

  const { data: ownerOrg } = await supabase
    .from('organizations')
        .select('id, name, user_id')
      .eq('user_id', userId)
    .maybeSingle();

  if (ownerOrg) {
    return { org: ownerOrg as OrgRecord, role: 'owner' };
  }

  if (email) {
    const { data: invite } = await supabase
      .from('leader_invites' as any)
      .select('org_id')
      .eq('email', email)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .maybeSingle();

      const inviteRecord = invite as unknown as { org_id: string } | null;

      if (inviteRecord?.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, user_id')
        .eq('id', inviteRecord.org_id)
        .maybeSingle();

      if (org) {
        return { org: org as OrgRecord, role: 'leader' };
      }
    }
  }

  const created = await ensureOrgForUser(userId, fallbackName);
  return { org: created, role: 'owner' };
}

/**
 * IDs de organización a los que el usuario tiene acceso (dueño, socio vinculado o líder invitado).
 * Usar con cliente service-role en rutas API.
 */
export async function listAccessibleOrgIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string | null,
): Promise<string[]> {
  const orgIds = new Set<string>();

  const { data: ownerRows, error: ownerErr } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId);
  if (ownerErr) {
    console.warn('[listAccessibleOrgIds] organizations:', ownerErr.message);
  }
  for (const o of ownerRows ?? []) {
    orgIds.add(o.id);
  }

  const { data: socioRows, error: socioErr } = await supabase
    .from('socios')
    .select('org_id')
    .eq('user_id', userId);
  if (socioErr) {
    console.warn('[listAccessibleOrgIds] socios:', socioErr.message);
  }
  for (const s of socioRows ?? []) {
    if (s.org_id) {
      orgIds.add(s.org_id);
    }
  }

  if (userEmail) {
    const { data: inviteRows, error: invErr } = await supabase
      .from('leader_invites' as any)
      .select('org_id')
      .eq('email', userEmail)
      .eq('status', 'accepted');
    if (invErr) {
      console.warn('[listAccessibleOrgIds] leader_invites:', invErr.message);
    }
    const invites = (inviteRows ?? []) as unknown as Array<{ org_id: string | null }>;
    for (const row of invites) {
      if (row.org_id) {
        orgIds.add(row.org_id);
      }
    }
  }

  return Array.from(orgIds);
}
