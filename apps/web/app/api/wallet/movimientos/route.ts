import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { WalletMvpService } from '@/lib/services/wallet-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OwnerInfo = {
  owner_tipo: 'SOCIO' | 'ORG';
  owner_id: string;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const owner = await resolveOwner(user.id, user.email || undefined);
    if (!owner) {
      return NextResponse.json({
        movimientos: [],
        total: 0,
        paginacion: { limit, offset, hasMore: false },
      });
    }

    const { movimientos, total } = await WalletMvpService.obtenerMovimientos(
      owner.owner_tipo,
      owner.owner_id,
      limit,
      offset,
    );

    return NextResponse.json({
      movimientos,
      total,
      paginacion: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[WALLET_MOVIMIENTOS] Error:', error);
    return NextResponse.json(
      {
        message: 'Error al obtener movimientos',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    );
  }
}

async function resolveOwner(userId: string, email?: string): Promise<OwnerInfo | null> {
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const { data: socio } = await supabaseAny
    .from('socios')
    .select('id, org_id, user_id, email')
    .or(`user_id.eq.${userId},email.eq.${email || ''}`)
    .maybeSingle();

  if (socio?.id) {
    return { owner_tipo: 'SOCIO', owner_id: socio.id };
  }

  let { data: org } = await supabaseAny
    .from('organizations')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  // Compat temporal con esquema legacy
  if (!org) {
    const legacyOrg = await supabaseAny
      .from('organizaciones')
      .select('id')
      .eq('owner_user_id', userId)
      .maybeSingle();
    org = legacyOrg.data;
  }

  if (org?.id) {
    return { owner_tipo: 'ORG', owner_id: org.id };
  }

  return null;
}

