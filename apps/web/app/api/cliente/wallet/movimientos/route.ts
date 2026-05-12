import { NextRequest, NextResponse } from 'next/server';

import { requireClienteWalletAuth, statusFromClienteWalletAuthError } from '@/lib/cliente-wallet-auth';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireClienteWalletAuth();
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);
    const offset = Number.parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10);
    const result = await ClienteWalletService.listarMovimientos(ctx.orgId, limit, offset);

    return NextResponse.json({
      success: true,
      movimientos: result.movimientos,
      total: result.total,
      paginacion: {
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
    });
  } catch (error) {
    console.error('[GET /api/cliente/wallet/movimientos]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: statusFromClienteWalletAuthError(error) },
    );
  }
}
