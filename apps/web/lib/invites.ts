import { randomUUID } from 'node:crypto';

import { resolveOrgContext } from './orgs';
import { createServiceSupabaseClient } from './supabase-server';

type InviteInput = {
  userId: string;
  userEmail?: string | null;
  nombre: string;
  email: string;
  rol: 'funcional' | 'autonomo';
};

export async function createLeaderInvite({ userId, userEmail, nombre, email, rol }: InviteInput) {
  const supabase = createServiceSupabaseClient();
  const { org } = await resolveOrgContext(
    userId,
    'Organización',
    userEmail
  );

  const token = randomUUID();

  const { data, error } = await supabase
    .from('leader_invites')
    .upsert(
      {
        org_id: org.id,
        nombre,
        email,
        rol,
        status: 'pending',
        accepted_at: null,
        token,
      },
      { onConflict: 'org_id,email' }
    )
    .select('id, token')
    .single();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error('No se pudo generar la invitación');
  }

  const inviteToken = data.token ?? token;

  return { inviteId: data.id, orgId: org.id, token: inviteToken };
}
