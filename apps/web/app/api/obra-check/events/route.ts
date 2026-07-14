import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  tipo: z.string().min(1).max(60),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/** POST /api/obra-check/events — registra un evento de analítica (fire-and-forget desde el front). */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Evento inválido.', detail: (err as Error).message }, { status: 400 });
  }

  await logEvent(db, session.id, parsed.tipo, parsed.payload ?? {});
  return NextResponse.json({ success: true, data: { ok: true } });
}
