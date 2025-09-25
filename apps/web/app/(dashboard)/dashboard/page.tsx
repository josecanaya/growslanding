import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import DashboardClient from './dashboard-client';
import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export default async function DashboardPage() {
  const supabaseAuth = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabaseAuth.auth.getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = session.user;
  const serviceClient = createServiceSupabaseClient();
  const { data: existingOrg } = await serviceClient
    .from('orgs')
    .select('id, name, owner_user_id')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!existingOrg) {
    if (user.email) {
      const { data: leaderInvite } = await serviceClient
        .from('leader_invites')
        .select('id')
        .eq('email', user.email)
        .eq('status', 'accepted')
        .maybeSingle();

      if (leaderInvite) {
        redirect('/lider');
      }
    }
  }

  const org = existingOrg
    ?? (await ensureOrgForUser(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización'
    ));

  const [{ data: obras = [] }, { data: socios = [] }, { data: tareas = [] }, { data: invites = [] }] =
    await Promise.all([
      serviceClient
        .from('obras')
        .select('id, org_id, nombre, cliente, localizacion')
        .eq('org_id', org.id)
        .order('created_at', { ascending: true }),
    serviceClient
      .from('socios')
      .select('id, org_id, nombre, contacto, status, rol')
      .eq('org_id', org.id)
      .eq('status', 'activo')
      .order('nombre', { ascending: true }),
      serviceClient
        .from('tareas')
        .select(
          `id, obra_id, tipo, descripcion, estado, referente_id, socio_ids,
           obra:obras(id, nombre),
           eventos(id, nuevo_estado, actor_name, created_at, notas, pdf_path)`
        )
        .eq('obra.org_id', org.id)
        .order('created_at', { ascending: true }),
      serviceClient
        .from('leader_invites')
        .select('id, email, nombre, rol, status, created_at')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false }),
    ]);

  return (
    <DashboardClient
      org={org}
      obras={obras ?? []}
      socios={socios ?? []}
      tareas={tareas ?? []}
      invites={invites ?? []}
    />
  );
}
