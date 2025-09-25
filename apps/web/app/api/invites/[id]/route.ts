import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const { data: invite, error: fetchError } = await supabase
      .from('leader_invites')
      .select('id, org_id, status')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError || !invite || invite.org_id !== org.id) {
      return NextResponse.json({ message: 'Invitación no encontrada' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { message: 'Solo se pueden revocar invitaciones pendientes' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('leader_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[INVITE_REVOKE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al revocar la invitación';
    return NextResponse.json({ message }, { status: 400 });
  }
}
