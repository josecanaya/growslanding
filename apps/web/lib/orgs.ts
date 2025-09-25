import { createServiceSupabaseClient } from './supabase-server';

export async function ensureOrgForUser(userId: string, fallbackName: string) {
  const supabase = createServiceSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('orgs')
    .select('id, name, owner_user_id')
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
    })
    .select('id, name, owner_user_id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
