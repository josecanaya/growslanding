import { NextRequest, NextResponse } from 'next/server';

import { requireClienteWalletAuth, statusFromClienteWalletAuthError } from '@/lib/cliente-wallet-auth';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireClienteWalletAuth();
    const body = await request.json().catch(() => ({}));
    const monto = Number(body?.monto);
    const descripcion =
      typeof body?.descripcion === 'string' && body.descripcion.trim()
        ? body.descripcion.trim()
        : 'Carga manual de prueba';

    const saldo = await ClienteWalletService.acreditarSaldoManual(
      ctx.orgId,
      monto,
      descripcion,
      ctx.userId,
    );

    return NextResponse.json({ success: true, saldo });
  } catch (error) {
    console.error('[POST /api/cliente/wallet/carga-manual]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    const status = msg === 'MONTO_INVALIDO' ? 400 : statusFromClienteWalletAuthError(error);
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
