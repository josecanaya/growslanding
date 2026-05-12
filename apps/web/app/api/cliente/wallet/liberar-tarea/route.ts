import { NextRequest, NextResponse } from 'next/server';

import { requireClienteWalletAuth, statusFromClienteWalletAuthError } from '@/lib/cliente-wallet-auth';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function statusFromError(msg: string): number {
  if (msg === 'MONTO_INVALIDO' || msg === 'SOCIO_REQUERIDO' || msg === 'PRESUPUESTO_APROBADO_REQUERIDO') return 400;
  if (msg === 'TAREA_NO_ENCONTRADA' || msg === 'WALLET_NO_ENCONTRADA') return 404;
  if (msg.includes('SALDO_RESERVADO_INSUFICIENTE')) return 409;
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireClienteWalletAuth();
    const body = await request.json().catch(() => ({}));
    const tareaId = typeof body?.tareaId === 'string' ? body.tareaId : null;
    const socioId = typeof body?.socioId === 'string' ? body.socioId : null;
    const monto = typeof body?.monto === 'number' ? body.monto : undefined;

    if (!tareaId) {
      return NextResponse.json({ success: false, error: 'tareaId requerido' }, { status: 400 });
    }

    const saldo = await ClienteWalletService.liberarPagoDeTarea(ctx.orgId, tareaId, socioId, monto);
    return NextResponse.json({ success: true, saldo });
  } catch (error) {
    console.error('[POST /api/cliente/wallet/liberar-tarea]', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    const authStatus = statusFromClienteWalletAuthError(error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: authStatus === 500 ? statusFromError(msg) : authStatus },
    );
  }
}
