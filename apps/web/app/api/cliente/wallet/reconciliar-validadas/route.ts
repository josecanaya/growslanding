import { NextRequest, NextResponse } from 'next/server';

import { requireClienteWalletAuth, statusFromClienteWalletAuthError } from '@/lib/cliente-wallet-auth';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireClienteWalletAuth();
    const body = await request.json().catch(() => ({}));
    const limit = typeof body?.limit === 'number' ? body.limit : 200;
    const resultado = await ClienteWalletService.reconciliarSubtareasValidadasOrg(
      ctx.orgId,
      ctx.userId,
      limit,
    );

    return NextResponse.json({ success: true, resultado });
  } catch (error) {
    console.error('[POST /api/cliente/wallet/reconciliar-validadas]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    const authStatus = statusFromClienteWalletAuthError(error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: authStatus === 500 ? 500 : authStatus },
    );
  }
}
