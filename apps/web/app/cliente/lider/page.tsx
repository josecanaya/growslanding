import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import LeaderClient from './leader-client';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

/** Evita prerender en build (cookies + service role); evita fallar sin env en CI. */
export const dynamic = 'force-dynamic';

export default async function LeaderPage() {
  const supabase = createServiceSupabaseClient();
  let orgId: string | null = null;

  {
    const cookieStore = await cookies();
    const supabaseAuth = createServerComponentClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    const leaderEmail = user!.email ?? null;
    if (!leaderEmail) {
      redirect('/auth/login');
    }

    const { data: invite } = await supabase
      .from('leader_invites' as any)
      .select('org_id')
      .eq('email', leaderEmail)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (!invite) {
      redirect('/auth/login');
    }

    // Type assertion: invite has the expected structure
    const inviteRecord = invite as unknown as { org_id: string } | null;
    if (!inviteRecord) {
      redirect('/auth/login');
    }

    orgId = inviteRecord.org_id;
  }

  if (!orgId) {
    redirect('/auth/login');
  }

  const [
    { data: socios = [] },
    { data: tareasRaw = [] },
    { data: tokens = [] },
    { data: obras = [] },
    { data: invites = [] },
  ] = await Promise.all([
    supabase
      .from('socios')
      .select('id, nombre, email, org_id, estado')
      .eq('org_id', orgId)
      .order('nombre', { ascending: true }),
    supabase
      .from('tareas')
      .select(
        `id, title, descripcion, estado, obra_id, created_at,
         responsable_socio_id, cuadrilla_id,
         obra:obras(id, name, propietario, address, org_id)`
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: true }),
    supabase
      .from('qr_tokens' as any)
      .select('ref_id, token, enabled')
      .eq('scope', 'tarea'),
    supabase
      .from('obras')
      .select('id, name, propietario, address')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true }),
    supabase
      .from('leader_invites' as any)
      .select('id, email, nombre, rol, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
  ]);

  type EstadoLeaderUi = 'pendiente' | 'en_ejecucion' | 'finalizado' | 'validado';

  function mapEstadoLeaderUi(estado: string | null): EstadoLeaderUi {
    const u = (estado || '').toLowerCase();
    if (u === 'pendiente') return 'pendiente';
    if (u === 'en_progreso') return 'en_ejecucion';
    if (u === 'para_validar') return 'finalizado';
    if (u === 'validada' || u === 'rechazada') return 'validado';
    return 'pendiente';
  }

  type TareaRow = {
    id: string;
    obra_id: string;
    tipo: string;
    descripcion: string;
    estado: EstadoLeaderUi;
    referente_id: string | null;
    socio_ids: string[];
    created_at: string;
    obra: { nombre: string | null; cliente: string | null } | null;
    eventos: any[];
  };

  const tareasList: TareaRow[] = (tareasRaw ?? []).map((t: any) => {
    const sid = t.responsable_socio_id ?? t.cuadrilla_id;
    return {
      id: t.id,
      obra_id: t.obra_id,
      tipo: t.title ?? 'Sin título',
      descripcion: t.descripcion ?? '',
      estado: mapEstadoLeaderUi(t.estado),
      referente_id: t.responsable_socio_id ?? null,
      socio_ids: sid ? [sid] : [],
      created_at: t.created_at,
      obra: t.obra
        ? {
            nombre: t.obra.name ?? null,
            cliente: t.obra.propietario ?? null,
          }
        : null,
      eventos: [],
    };
  });

  const tareaIds = new Set(tareasList.map((t) => t.id));
  const tokensFiltrados = ((tokens ?? []) as any[]).filter((token: any) =>
    tareaIds.has(token.ref_id)
  );

  const sociosMapped =
    (socios ?? []).map((s: any) => ({
      id: s.id,
      nombre: s.nombre,
      contacto: s.email ?? null,
      org_id: s.org_id,
      status: s.estado ?? 'activo',
      rol: 'SOCIO',
    })) ?? [];

  const obrasMapped =
    (obras ?? []).map((o: any) => ({
      id: o.id,
      nombre: o.name ?? '',
      cliente: o.propietario ?? null,
      localizacion: o.address ?? null,
    })) ?? [];

  return (
    <LeaderClient
      socios={sociosMapped as any}
      tareas={tareasList as any}
      tokens={tokensFiltrados}
      obras={obrasMapped as any}
      invites={(invites ?? []) as any}
    />
  );
}

