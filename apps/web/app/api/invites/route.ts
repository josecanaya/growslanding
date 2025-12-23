import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { createLeaderInvite } from '@/lib/invites';
import { resolveOrgContext } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

const schema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    if (IS_DEV_MODE) {
      return new Response(
        JSON.stringify({
          inviteId: `dev-invite-${Date.now()}`,
          devMode: true,
          requestedBy: mockUser,
        }),
        { status: 201 }
      );
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ message: 'No autenticado' }), {
        status: 401,
      });
    }

    const { org } = await resolveOrgContext(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización',
      user.email
    );

    const supabase = createServiceSupabaseClient();

    const { data: existing } = (await supabase
      .from('leader_invites' as any)
      .select('id, status')
      .eq('org_id', org.id)
      .eq('email', payload.email)
      .maybeSingle()) as { data: { id: string; status: string } | null; error: any };

    if (existing && existing.status === 'pending') {
      return new Response(
        JSON.stringify({ message: 'Ya existe una invitación pendiente para este correo.' }),
        {
          status: 409,
        }
      );
    }

    const { data: existingSocio } = await supabase
      .from('socios')
      .select('id, estado')
      .eq('org_id', org.id)
      .eq('email', payload.email)
      .maybeSingle();

    if (existingSocio && existingSocio.estado !== 'inactivo') {
      return new Response(JSON.stringify({ message: 'Este socio ya está registrado.' }), {
        status: 409,
      });
    }

    const { inviteId, token } = await createLeaderInvite({
      userId: user.id,
      userEmail: user.email,
      nombre: payload.nombre,
      email: payload.email,
    });

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const redirectUrl = new URL('/auth/invite', origin);
    redirectUrl.searchParams.set('invite', inviteId);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('target', '/lider');

    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: payload.email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: {
          invite_id: inviteId,
          org_id: org.id,
          rol: 'constructor',
          nombre: payload.nombre,
        },
      },
    });

    if (magicLinkError) {
      throw magicLinkError;
    }

    return new Response(JSON.stringify({ inviteId }), { status: 201 });
  } catch (error) {
    console.error('[INVITE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al enviar la invitación';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
