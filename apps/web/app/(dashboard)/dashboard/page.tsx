import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import DashboardClient from './dashboard-client';
import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export default async function DashboardPage() {
  const isDevMode = IS_DEV_MODE;

  if (isDevMode) {
    const org = {
      id: mockUser.orgId,
      name: mockUser.orgName,
      owner_user_id: mockUser.id,
      onboarding_completed: true,
    };

    return (
      <DashboardClient
        org={org}
        obras={[]}
        socios={[]}
        tareas={[]}
        invites={[]}
      />
    );
  }

  let userId: string;
  let userEmail: string | null;
  let displayName: string;

  {
    const cookieStore = cookies();
    const supabaseAuth = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    userId = user!.id;
    userEmail = user!.email ?? null;
    displayName =
      user!.user_metadata?.full_name ?? user!.email ?? 'Organización';
  }

  const serviceClient = createServiceSupabaseClient();
  const { data: existingOrg } = await serviceClient
    .from('orgs')
    .select('id, name, owner_user_id, onboarding_completed')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (!existingOrg && !isDevMode && userEmail) {
    const { data: leaderInvite } = await serviceClient
      .from('leader_invites')
      .select('id')
      .eq('email', userEmail)
      .eq('status', 'accepted')
      .maybeSingle();

    if (leaderInvite) {
      redirect('/socio');
    }
  }

  const org =
    existingOrg ??
    (await ensureOrgForUser(
      userId,
      displayName
    ));

  if (!org.onboarding_completed) {
    redirect('/onboarding');
  }

  const [
    { data: obras = [] },
    { data: socios = [] },
    { data: tareas = [] },
    { data: invites = [] },
  ] = await Promise.all([
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
