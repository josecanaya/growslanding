import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import enviarMensajeAGrowsN8n from '@/src/api/grows_webhook';
import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  state: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/obra-check/chat — proxy al asistente en n8n para dictar/desambiguar tareas.
 *
 * Si n8n no está configurado (o falla), devuelve { fallback: true } para que la UI degrade
 * a edición manual. El flujo de Obra Check nunca debe depender del chat.
 */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Mensaje inválido.', detail: (err as Error).message }, { status: 400 });
  }

  await logEvent(db, session.id, 'chat_message', {});

  try {
    const data = await enviarMensajeAGrowsN8n({
      tool: 'obra_check',
      sessionToken: session.session_token,
      message: parsed.message,
      state: parsed.state ?? {},
    });
    return NextResponse.json({ success: true, data });
  } catch {
    // n8n no configurado o error → la UI usa edición manual.
    return NextResponse.json({ success: true, data: { fallback: true } });
  }
}
