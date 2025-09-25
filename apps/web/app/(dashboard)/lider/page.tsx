import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import LeaderClient from './leader-client';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export default async function LeaderPage() {
  const supabaseAuth = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabaseAuth.auth.getSession();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const supabase = createServiceSupabaseClient();

  const leaderEmail = session.user.email;
  if (!leaderEmail) {
    redirect('/auth/login');
  }

  const { data: invite } = await supabase
    .from('leader_invites')
    .select('org_id')
    .eq('email', leaderEmail)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!invite) {
    redirect('/auth/login');
  }

  const orgId = invite.org_id;

  const [{ data: socios = [] }, { data: tareas = [] }, { data: tokens = [] }] =
    await Promise.all([
      supabase
        .from('socios')
        .select('id, nombre, contacto, org_id, status, rol')
        .eq('org_id', orgId)
        .order('nombre', { ascending: true }),
      supabase
        .from('tareas')
        .select(
          `id, obra_id, tipo, descripcion, estado, referente_id, socio_ids, created_at,
           obra:obras(id, nombre, cliente, org_id),
           eventos(id, nuevo_estado, actor_name, created_at, notas, pdf_path, has_nc)`
        )
        .eq('obra.org_id', orgId)
        .order('created_at', { ascending: true }),
      supabase
        .from('qr_tokens')
        .select('ref_id, token, enabled')
        .eq('scope', 'tarea'),
    ]);

  const tareaIds = new Set((tareas ?? []).map((t) => t.id));
  const tokensFiltrados = (tokens ?? []).filter((token) => tareaIds.has(token.ref_id));

  return (
    <LeaderClient
      socios={socios ?? []}
      tareas={tareas ?? []}
      tokens={tokensFiltrados}
    />
  );
}
