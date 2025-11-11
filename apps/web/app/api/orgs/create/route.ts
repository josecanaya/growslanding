import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { name, cuit, address, plan_actual: incomingPlan } = payload ?? {};

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'El nombre de la organización es requerido.' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const plan_actual =
      typeof incomingPlan === 'string' && incomingPlan.trim().length > 0
        ? incomingPlan
        : 'FREE';

    const { data: org, error: orgError } = await (supabase as any)
      .from('organizations')
      .insert([
        {
          name,
          cuit: cuit ?? null,
          address: address ?? null,
          user_id: user.id,
          plan_actual,
        },
      ])
      .select()
      .single();

    if (orgError) {
      return NextResponse.json(
        { error: orgError.message },
        { status: 400 }
      );
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { org_id: org.id },
    });

    if (metadataError) {
      return NextResponse.json(
        { error: metadataError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ org });
  } catch (error) {
    console.error('[ORG_CREATE_ERROR]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo crear la organización.',
      },
      { status: 500 }
    );
  }
}
