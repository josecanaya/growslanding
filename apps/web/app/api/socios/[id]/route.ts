import type { RouteContext } from 'next';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  context: RouteContext<{ id: string }>
) {
  try {
    const params = await context.params;
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const org = await ensureOrgForUser(
      session.user.id,
      session.user.user_metadata?.full_name ?? session.user.email ?? 'Organización'
    );

    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, contacto, status')
      .eq('id', params.id)
      .maybeSingle();

    if (socioError || !socio || socio.org_id !== org.id) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    if (socio.status === 'inactivo') {
      return NextResponse.json({ ok: true });
    }

    const updates = [] as Array<Promise<{ error?: unknown }>>;

    updates.push(
      supabase
        .from('socios')
        .update({ status: 'inactivo' })
        .eq('id', socio.id)
    );

    if (socio.contacto) {
      updates.push(
        supabase
          .from('leader_invites')
          .update({ status: 'revoked' })
          .eq('org_id', org.id)
          .eq('email', socio.contacto)
      );
    }

    const results = await Promise.all(updates);
    const updateError = results.find((result) => 'error' in result && result.error);

    if (updateError && 'error' in updateError) {
      throw updateError.error as Error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[SOCIO_DELETE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al eliminar el socio';
    return NextResponse.json({ message }, { status: 400 });
  }
}
