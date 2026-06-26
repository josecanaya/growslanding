import { NextRequest, NextResponse } from 'next/server';

import { SocioRetiroService } from '@/lib/services/socio-retiro.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function autorizado(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    return auth === `Bearer ${cronSecret}`;
  }
  const internalKey = process.env.GROWS_INTERNAL_API_KEY?.trim();
  if (internalKey) {
    return request.headers.get('x-grows-internal-key') === internalKey;
  }
  return process.env.NODE_ENV === 'development';
}

/** POST /api/cron/liquidar-socios — liquidación quincenal automática (saldo completo → cuenta). */
export async function POST(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit ?? 200);
    const resultado = await SocioRetiroService.ejecutarLiquidacionesQuincenales(limit);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    console.error('[POST /api/cron/liquidar-socios]', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    );
  }
}
