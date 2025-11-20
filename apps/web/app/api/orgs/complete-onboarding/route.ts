import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function POST() {
  try {
    if (IS_DEV_MODE) {
      return new Response(
        JSON.stringify({
          ok: true,
          devMode: true,
          orgId: mockUser.orgId,
        })
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

    const supabase = createServiceSupabaseClient();
    const org = await ensureOrgForUser(
      user.id,
      user.user_metadata?.full_name ?? user.email ?? 'Organización'
    );

    const { error } = await supabase
      .from('orgs')
      .update({ onboarding_completed: true, name: org.name })
      .eq('id', org.id);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error('[ONBOARDING_COMPLETE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al completar el onboarding';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
