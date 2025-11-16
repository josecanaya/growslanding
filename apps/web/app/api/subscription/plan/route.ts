import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: org, error: orgError } = await (supabase as any)
    .from('organizations')
    .select('id, plan_actual')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (orgError) {
    console.error('[subscription/plan] Error fetching organization:', orgError);
    return NextResponse.json({ planId: 'FREE', orgId: null });
  }

  if (!org) {
    // No hay organización para este usuario, retornar plan FREE
    return NextResponse.json({ planId: 'FREE', orgId: null });
  }

  return NextResponse.json({
    planId: org?.plan_actual ?? 'FREE',
    orgId: org?.id ?? null,
  });
}


