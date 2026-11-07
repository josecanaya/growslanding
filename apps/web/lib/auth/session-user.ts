import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const client = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}
