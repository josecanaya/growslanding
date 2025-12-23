import { createServiceSupabaseClient } from './supabase-server';

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
