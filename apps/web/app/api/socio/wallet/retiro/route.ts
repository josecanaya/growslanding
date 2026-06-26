import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { SocioRetiroService } from '@/lib/services/socio-retiro.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
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

    const socio = await resolveSocioRecordForAuthUser(createServiceSupabaseClient(), {
      id: user.id,
      email: user.email ?? undefined,
    });
    if (!socio?.id) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    const info = await SocioRetiroService.obtenerInfo(socio.id);
    return NextResponse.json(info);
  } catch (error) {
    console.error('[GET /api/socio/wallet/retiro-info]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const socio = await resolveSocioRecordForAuthUser(createServiceSupabaseClient(), {
      id: user.id,
      email: user.email ?? undefined,
    });
    if (!socio?.id) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const monto = Number(body?.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ message: 'MONTO_INVALIDO' }, { status: 400 });
    }

    const resultado = await SocioRetiroService.solicitarRetiroManual(socio.id, monto);
    return NextResponse.json({
      ok: true,
      retiro: resultado.retiro,
      saldo_actual: resultado.saldo.saldo_actual,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error interno';
    console.error('[POST /api/socio/wallet/retiro]', error);
    const status = msg.includes('REQUERIDO') || msg.includes('MINIMO') || msg.includes('LIMITE') || msg.includes('SALDO')
      ? 400
      : 500;
    return NextResponse.json({ message: msg }, { status });
  }
}
