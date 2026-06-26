import { NextRequest, NextResponse } from 'next/server';

import { GrowsPlatformWalletService } from '@/lib/services/grows-platform-wallet.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function autorizado(request: NextRequest): boolean {
  const key = process.env.GROWS_INTERNAL_API_KEY?.trim();
  if (!key) {
    return process.env.NODE_ENV === 'development';
  }
  const header = request.headers.get('x-grows-internal-key');
  return header === key;
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const resumen = await GrowsPlatformWalletService.obtenerResumen();
    return NextResponse.json(resumen);
  } catch (error) {
    console.error('[GET /api/internal/grows-wallet]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}
