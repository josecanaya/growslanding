import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function POST() {
  try {
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

    // Type assertion: ensureOrgForUser always returns a valid org or throws
    const orgRecord = org as { id: string; name: string };

    const { error } = await supabase
      .from('organizations')
      .update({ name: orgRecord.name } as any)
      .eq('id', orgRecord.id);

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
