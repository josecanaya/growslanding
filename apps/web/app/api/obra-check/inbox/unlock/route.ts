import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/obra-check/inbox/unlock
 * El arquitecto ingresa su email y recibe los links de bandeja de sus sesiones.
 */
export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ success: false, error: 'Email inválido.' }, { status: 400 });
  }

  const db = obraCheckDb();
  const email = parsed.email.trim().toLowerCase();

  const { data: sessions } = await db
    .from('obra_check_sessions')
    .select('id, email, empresa, tipo_obra, inbox_token, created_at')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(20);

  const origin =
    request.headers.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    '';

  const bandejas = ((sessions ?? []) as Array<{
    id: string;
    email: string | null;
    empresa: string | null;
    tipo_obra: string | null;
    inbox_token: string | null;
    created_at: string;
  }>)
    .filter((s) => s.inbox_token)
    .map((s) => ({
      sessionId: s.id,
      empresa: s.empresa,
      tipoObra: s.tipo_obra,
      createdAt: s.created_at,
      inboxUrl: `${origin.replace(/\/$/, '')}/obra-check/inbox/${s.inbox_token}`,
      inboxToken: s.inbox_token,
    }));

  if (bandejas.length === 0) {
    return NextResponse.json({
      success: true,
      data: { bandejas: [], message: 'No encontramos una bandeja con ese email.' },
    });
  }

  // Si hay Resend, mandar los links por mail; si no, devolverlos en la respuesta (misma pantalla).
  const apiKey = process.env.RESEND_API_KEY?.trim();
  let emailed = false;
  if (apiKey) {
    const from = process.env.OBRA_CHECK_FROM_EMAIL?.trim() || 'Grows <onboarding@resend.dev>';
    const lines = bandejas.map((b, i) => `${i + 1}. ${b.inboxUrl}`).join('\n');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Tu bandeja de presupuestos — Grows Obra Check',
          text: `Accedé a tus respuestas de contratistas:\n\n${lines}\n\nGuardá este link: no hace falta que el contratista te reenvíe el formulario.`,
        }),
      });
      emailed = res.ok;
    } catch {
      emailed = false;
    }
  }

  return NextResponse.json({
    success: true,
    data: { bandejas, emailed },
  });
}
