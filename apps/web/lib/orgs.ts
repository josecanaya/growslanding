import { createServiceSupabaseClient } from './supabase-server';

type OrgRecord = {
  id: string;
  name: string;
  owner_user_id: string | null;
  onboarding_completed: boolean;
};

export async function ensureOrgForUser(userId: string, fallbackName: string) {
  const supabase = createServiceSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('orgs')
    .select('id, name, owner_user_id, onboarding_completed')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  const defaultName = fallbackName || 'Organización sin nombre';
  const { data, error } = await supabase
    .from('orgs')
    .insert({
      name: defaultName,
      owner_user_id: userId,
      onboarding_completed: false,
    })
    .select('id, name, owner_user_id, onboarding_completed')
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
    .from('orgs')
    .select('id, name, owner_user_id, onboarding_completed')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (ownerOrg) {
    return { org: ownerOrg as OrgRecord, role: 'owner' };
  }

  if (email) {
    const { data: invite } = await supabase
      .from('leader_invites')
      .select('org_id')
      .eq('email', email)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (invite?.org_id) {
      const { data: org } = await supabase
        .from('orgs')
        .select('id, name, owner_user_id, onboarding_completed')
        .eq('id', invite.org_id)
        .maybeSingle();

      if (org) {
        return { org: org as OrgRecord, role: 'leader' };
      }
    }
  }

  const created = await ensureOrgForUser(userId, fallbackName);
  return { org: created, role: 'owner' };
}
