import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const inviteId = url.searchParams.get('invite');
  const token = url.searchParams.get('token');
  const target = url.searchParams.get('target') ?? '/lider';

  const redirectToTarget = () => NextResponse.redirect(new URL(target, url.origin));
  const redirectToLogin = () => NextResponse.redirect(new URL('/auth/login', url.origin));

  if (!inviteId || !token) {
    return redirectToLogin();
  }

  const serviceClient = createServiceSupabaseClient();
  const { data: invite, error: inviteError } = await serviceClient
    .from('leader_invites')
    .select('id, org_id, email, nombre, rol, status, token')
    .eq('id', inviteId)
    .maybeSingle();

  if (inviteError || !invite || invite.token !== token) {
    return redirectToLogin();
  }

  if (!code) {
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: invite.email,
      options: {
        redirectTo: url.toString(),
      },
    });

    const actionLink = linkData?.action_link ?? linkData?.properties?.action_link;

    if (linkError || !actionLink) {
      return redirectToLogin();
    }

    return NextResponse.redirect(actionLink);
  }

  const supabase = createRouteHandlerClient<Database>({ cookies });
  await supabase.auth.exchangeCodeForSession(code);

  if (invite.status !== 'accepted') {
    await serviceClient
      .from('leader_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  const { data: existingSocio } = await serviceClient
    .from('socios')
    .select('id')
    .eq('org_id', invite.org_id)
    .eq('contacto', invite.email)
    .maybeSingle();

  if (!existingSocio) {
    await serviceClient.from('socios').insert({
      org_id: invite.org_id,
      nombre: invite.nombre,
      contacto: invite.email,
      rol: invite.rol,
    });
  }

  return redirectToTarget();
}
