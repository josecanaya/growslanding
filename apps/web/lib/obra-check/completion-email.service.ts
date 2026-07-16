import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceSupabaseClient } from '@/lib/supabase-server';

type SessionSummary = {
  id: string;
  email: string;
  empresa: string | null;
  tipo_obra: string | null;
  completion_email_sent_at: string | null;
};

/**
 * Envía un magic link de Supabase Auth invitando a iniciar sesión en Grows.
 * Idempotente: no reenvía si completion_email_sent_at ya está seteado.
 */
export async function sendObraCheckCompletionEmail(
  db: SupabaseClient,
  sessionId: string,
  origin: string,
): Promise<{ sent: boolean; alreadySent?: boolean; error?: string }> {
  const { data: session, error: readErr } = await db
    .from('obra_check_sessions')
    .select('id, email, empresa, tipo_obra, completion_email_sent_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (readErr || !session) {
    return { sent: false, error: readErr?.message ?? 'Sesión no encontrada.' };
  }

  const row = session as SessionSummary;
  if (!row.email?.trim()) {
    return { sent: false, error: 'La sesión no tiene email.' };
  }

  if (row.completion_email_sent_at) {
    return { sent: false, alreadySent: true };
  }

  const loginUrl = `${origin.replace(/\/$/, '')}/auth/login?utm_source=obra_check&utm_medium=email&session=${sessionId}`;
  const supabase = createServiceSupabaseClient();

  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email: row.email.trim(),
    options: {
      emailRedirectTo: loginUrl,
      data: {
        source: 'obra_check',
        session_id: sessionId,
        empresa: row.empresa,
        tipo_obra: row.tipo_obra,
      },
    },
  });

  if (otpErr) {
    return { sent: false, error: otpErr.message };
  }

  await db
    .from('obra_check_sessions')
    .update({ completion_email_sent_at: new Date().toISOString() })
    .eq('id', sessionId);

  return { sent: true };
}
