import { NextResponse, type NextRequest } from 'next/server';

import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';
import { sendObraCheckCompletionEmail } from '@/lib/obra-check/completion-email.service';

export const dynamic = 'force-dynamic';

/** POST /api/obra-check/complete — envía email de invitación a Grows (idempotente). */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });
  }

  if (!session.email?.trim()) {
    return NextResponse.json({ success: false, error: 'Email obligatorio para completar.' }, { status: 400 });
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://grows.app';
  const result = await sendObraCheckCompletionEmail(db, session.id, origin);

  if (result.error && !result.alreadySent) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  if (result.sent) {
    await logEvent(db, session.id, 'completion_email_sent', { email: session.email });
  }

  return NextResponse.json({
    success: true,
    data: { sent: result.sent, alreadySent: result.alreadySent ?? false },
  });
}
