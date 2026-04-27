import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';

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

    // Type assertion: ensureOrgForUser always returns a valid org or throws
    const orgRecord = org as { id: string; name: string };

    const { data, error } = await supabase
      .from('organizations')
      .update({ name: payload.name })
      .eq('id', orgRecord.id)
      .select('id, name')
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
