import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import OnboardingClient from './onboarding-client';
import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerComponentClient<Database>({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const serviceClient = createServiceSupabaseClient();
  const org = await ensureOrgForUser(
    user.id,
    user.user_metadata?.full_name ?? user.email ?? 'Organización'
  );

  if (org.onboarding_completed) {
    redirect('/dashboard');
  }

  const [{ data: obras = [] }, { data: socios = [] }, { data: tareas = [] }, { data: invites = [] }] =
    await Promise.all([
      serviceClient
        .from('obras')
        .select('id, nombre, localizacion, cliente, org_id, created_at')
        .eq('org_id', org.id)
        .order('created_at', { ascending: true }),
      serviceClient
        .from('socios')
        .select('id, nombre, contacto, rol, status, org_id, created_at')
        .eq('org_id', org.id)
        .order('created_at', { ascending: true }),
      serviceClient
        .from('tareas')
        .select('id, obra_id, tipo, descripcion, estado, socio_ids, created_at, obra:obras(org_id)')
        .eq('obra.org_id', org.id),
      serviceClient
        .from('leader_invites')
        .select('id, email, nombre, rol, status, created_at')
        .eq('org_id', org.id)
        .order('created_at', { ascending: false }),
    ]);

  return (
    <OnboardingClient
      org={org}
      initialObras={obras ?? []}
      initialSocios={socios ?? []}
      initialTareas={tareas ?? []}
      initialInvites={invites ?? []}
    />
  );
}
