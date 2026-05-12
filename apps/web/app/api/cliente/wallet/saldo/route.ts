import { NextResponse } from 'next/server';

import { requireClienteWalletAuth, statusFromClienteWalletAuthError } from '@/lib/cliente-wallet-auth';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireClienteWalletAuth();
    const saldo = await ClienteWalletService.getOrCreateWallet(ctx.orgId, ctx.userId);
    return NextResponse.json({ success: true, saldo });
  } catch (error) {
    console.error('[GET /api/cliente/wallet/saldo]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: statusFromClienteWalletAuthError(error) },
    );
  }
}
