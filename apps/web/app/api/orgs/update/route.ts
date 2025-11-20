import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { ensureOrgForUser } from '@/lib/orgs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = schema.parse(body);

    if (IS_DEV_MODE) {
      return new Response(
        JSON.stringify({
          org: {
            id: mockUser.orgId,
            name: payload.name,
            onboarding_completed: false,
            devMode: true,
          },
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
      payload.name
    );

    const { data, error } = await supabase
      .from('orgs')
      .update({ name: payload.name })
      .eq('id', org.id)
      .select('id, name, onboarding_completed')
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ org: data }));
  } catch (error) {
    console.error('[ORG_UPDATE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al actualizar la organización';
    return new Response(JSON.stringify({ message }), { status: 400 });
  }
}
