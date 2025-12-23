
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { IS_DEV_MODE } from '@/lib/config';
import { resolveOrgContext } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (IS_DEV_MODE) {
      return NextResponse.json({ ok: true, devMode: true, id });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const { org } = await resolveOrgContext(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización',
      user.email
    );

    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, email, estado')
      .eq('id', id)
      .maybeSingle();

    // Type assertion: socio has the expected structure
    const socioRecord = socio as { id: string; org_id: string; email: string | null; estado: string | null } | null;

    if (socioError || !socioRecord || socioRecord.org_id !== org.id) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    if (socioRecord.estado === 'inactivo') {
      return NextResponse.json({ ok: true });
    }

    const updates: Array<PromiseLike<{ error?: unknown }>> = [];

    updates.push(
      supabase
        .from('socios')
        .update({ estado: 'inactivo' })
        .eq('id', socioRecord.id)
    );

    if (socioRecord.email) {
      updates.push(
        supabase
          .from('leader_invites' as any)
          .update({ status: 'revoked' })
          .eq('org_id', org.id)
          .eq('email', socioRecord.email)
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
