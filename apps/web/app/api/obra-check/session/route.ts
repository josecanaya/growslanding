import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { obraCheckDb, logEvent, OBRA_CHECK_COOKIE, getSessionFromCookie } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
  empresa: z.string().max(200).optional(),
  tipoObra: z.string().max(60).optional(),
  consentProcesamiento: z.literal(true), // obligatorio para operar
  consentPatrones: z.boolean().optional().default(false),
  consentVersion: z.string().max(40).optional(),
});

/** POST /api/obra-check/session — crea una sesión anónima y setea la cookie httpOnly. */
export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Datos inválidos. El consentimiento de procesamiento es obligatorio.', detail: (err as Error).message },
      { status: 400 },
    );
  }

  const db = obraCheckDb();
  const { data, error } = await db
    .from('obra_check_sessions')
    .insert({
      email: parsed.email ?? null,
      empresa: parsed.empresa ?? null,
      tipo_obra: parsed.tipoObra ?? null,
      consent_procesamiento: parsed.consentProcesamiento,
      consent_patrones: parsed.consentPatrones,
      consent_version: parsed.consentVersion ?? 'v1',
    })
    .select('id, session_token, inbox_token')
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'No se pudo crear la sesión.' }, { status: 500 });
  }

  const store = await cookies();
  store.set(OBRA_CHECK_COOKIE, data.session_token as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  await logEvent(db, data.id as string, 'session_created', { tipoObra: parsed.tipoObra });

  return NextResponse.json({
    success: true,
    data: {
      sessionId: data.id,
      inboxToken: (data as { inbox_token?: string }).inbox_token ?? null,
    },
  });
}

/** GET /api/obra-check/session — datos de la sesión actual (incluye bandeja). */
export async function GET(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data } = await db
    .from('obra_check_sessions')
    .select('id, email, empresa, tipo_obra, inbox_token, metros_cuadrados')
    .eq('id', session.id)
    .maybeSingle();

  const row = data as {
    id: string;
    email: string | null;
    empresa: string | null;
    tipo_obra: string | null;
    inbox_token: string | null;
    metros_cuadrados: number | null;
  } | null;

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inboxUrl = row?.inbox_token
    ? `${origin.replace(/\/$/, '')}/obra-check/inbox/${row.inbox_token}`
    : null;

  return NextResponse.json({
    success: true,
    data: {
      sessionId: row?.id ?? session.id,
      email: row?.email ?? session.email,
      inboxToken: row?.inbox_token ?? null,
      inboxUrl,
    },
  });
}
