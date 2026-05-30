import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export type SocioSession = {
  user: { id: string; email?: string | null };
  socioId: string;
};

export async function resolveSocioSession(): Promise<SocioSession | null> {
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();
  if (error || !user?.id) return null;

  const supabase = createServiceSupabaseClient();
  const row = await resolveSocioRecordForAuthUser(supabase, {
    id: user.id,
    email: user.email ?? null,
  });
  if (!row) return null;

  return { user: { id: user.id, email: user.email ?? null }, socioId: row.id };
}
