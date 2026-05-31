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
      return NextResponse.json(
        { saldo_actual: 0, saldo_pendiente: 0, moneda: 'ARS' },
        { status: 200 },
      );
    }

    const saldo = await WalletMvpService.obtenerSaldo(
      owner.owner_tipo,
      owner.owner_id,
    );

    return NextResponse.json({
      saldo_actual: saldo.saldo_actual ?? 0,
      saldo_pendiente: saldo.saldo_pendiente ?? 0,
      moneda: saldo.moneda ?? 'ARS',
    });
  } catch (error) {
    console.error('[WALLET_SALDO] Error:', error);
    return NextResponse.json(
      {
        message: 'Error al obtener saldo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    );
  }
}

async function resolveOwner(userId: string, email?: string): Promise<OwnerInfo | null> {
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const { data: socioByUser } = await supabaseAny
    .from('socios')
    .select('id, org_id, user_id, email')
    .eq('user_id', userId)
    .maybeSingle();

  if (socioByUser?.id) {
    return { owner_tipo: 'SOCIO', owner_id: socioByUser.id };
  }

  if (email) {
    const { data: socioByEmail } = await supabaseAny
      .from('socios')
      .select('id, org_id, user_id, email')
      .eq('email', email)
      .maybeSingle();

    if (socioByEmail?.id) {
      return { owner_tipo: 'SOCIO', owner_id: socioByEmail.id };
    }
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

