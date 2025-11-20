import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  await supabase.auth.signOut();

  const requestUrl = new URL(request.url);
  const redirectTo = requestUrl.searchParams.get('redirect') ?? '/';

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin), {
    status: 303,
  });
}
