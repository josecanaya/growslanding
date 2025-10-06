
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

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
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
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

    const { data: invite, error: fetchError } = await supabase
      .from('leader_invites')
      .select('id, org_id, status')
      .eq('id', id)
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
