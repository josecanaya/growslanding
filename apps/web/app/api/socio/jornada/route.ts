import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { resolveSocioSession } from '@/lib/socio/resolve-socio-session';
import { JornadaSocioService } from '@/lib/socio/jornada-socio.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/socio/jornada — jornada del día (opcional ?fecha=YYYY-MM-DD) */
export async function GET(request: NextRequest) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const fecha = request.nextUrl.searchParams.get('fecha') ?? undefined;
    const jornada = await JornadaSocioService.obtenerDelDia(session.socioId, fecha);

    return NextResponse.json({ ok: true, jornada });
  } catch (e) {
    console.error('[GET /api/socio/jornada]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}

/** POST /api/socio/jornada — iniciar jornada { obra_id } */
export async function POST(request: NextRequest) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const obraId = typeof body?.obra_id === 'string' ? body.obra_id.trim() : '';
    if (!obraId) {
      return NextResponse.json({ ok: false, error: 'obra_id es requerido' }, { status: 400 });
    }

    const jornada = await JornadaSocioService.iniciar({
      socioId: session.socioId,
      obraId,
    });

    return NextResponse.json({ ok: true, jornada });
  } catch (e) {
    console.error('[POST /api/socio/jornada]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}

/** PATCH /api/socio/jornada — finalizar { jornada_id } */
export async function PATCH(request: NextRequest) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const jornadaId = typeof body?.jornada_id === 'string' ? body.jornada_id.trim() : '';
    if (!jornadaId) {
      return NextResponse.json({ ok: false, error: 'jornada_id es requerido' }, { status: 400 });
    }

    const jornada = await JornadaSocioService.finalizar({
      jornadaId,
      socioId: session.socioId,
    });

    return NextResponse.json({ ok: true, jornada });
  } catch (e) {
    console.error('[PATCH /api/socio/jornada]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
