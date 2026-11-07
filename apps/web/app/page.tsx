import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { normalizeRole } from '@/lib/roles';

export default async function RootPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const result = await supabase.auth.getSession();
  const session = result.data?.session ?? null;

  if (!session) {
    redirect('/inversores');
  }

  const roleValue =
    ((session.user.app_metadata as Record<string, unknown> | undefined)?.role ??
      (session.user.user_metadata as Record<string, unknown> | undefined)?.role ??
      null) as string | null;

  const role = normalizeRole(roleValue);

  if (role === 'SOCIO') {
    redirect('/socio/panel');
  }

  if (role === 'ADMIN' || role === 'CLIENTE_TECNICO') {
    redirect('/cliente/dashboard');
  }

  redirect('/auth/select-role');
}
