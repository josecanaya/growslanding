/**
 * Notifica al solicitante (email de la sesión) cuando el contratista completa el formulario.
 * Usa Resend si hay RESEND_API_KEY; si no, deja el link listo para copiar / ver en la app.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type RequesterNotifyPayload = {
  sessionEmail: string;
  empresa: string | null;
  tipoObra: string | null;
  metrosCuadrados: number | null;
  grupoNombre: string;
  contratistaNombre: string;
  contratistaTelefono: string | null;
  contratistaEmail: string | null;
  tipo: string;
  detalle: Array<{
    nombre: string;
    included: boolean;
    dias?: number | null;
    precio?: number | null;
    inicio?: string | null;
    fin?: string | null;
  }>;
  viewUrl: string;
  inboxUrl?: string;
};

function formatDetalle(p: RequesterNotifyPayload): string {
  const lines = p.detalle
    .filter((t) => t.included)
    .map((t) => {
      const bits = [`• ${t.nombre}`];
      if (t.dias != null) bits.push(`${t.dias} días`);
      if (t.precio != null) bits.push(`$${Number(t.precio).toLocaleString('es-AR')}`);
      if (t.inicio && t.fin) bits.push(`${t.inicio} → ${t.fin}`);
      return bits.join(' · ');
    });
  return lines.join('\n') || '(sin ítems)';
}

function buildText(p: RequesterNotifyPayload): string {
  return [
    `Recibiste una respuesta de presupuesto en Grows Obra Check.`,
    ``,
    `Grupo: ${p.grupoNombre}`,
    p.metrosCuadrados != null ? `Superficie: ${p.metrosCuadrados} m²` : null,
    p.tipoObra ? `Tipo de obra: ${p.tipoObra}` : null,
    ``,
    `Contratista: ${p.contratistaNombre}`,
    p.contratistaTelefono ? `WhatsApp: ${p.contratistaTelefono}` : null,
    p.contratistaEmail ? `Email: ${p.contratistaEmail}` : null,
    ``,
    `Detalle:`,
    formatDetalle(p),
    ``,
    `Ver respuesta completa:`,
    p.viewUrl,
    p.inboxUrl ? `` : null,
    p.inboxUrl ? `Tu bandeja (todas las respuestas):` : null,
    p.inboxUrl ?? null,
  ]
    .filter((x) => x != null)
    .join('\n');
}

function buildHtml(p: RequesterNotifyPayload): string {
  const rows = p.detalle
    .filter((t) => t.included)
    .map((t) => {
      const precio = t.precio != null ? `$${Number(t.precio).toLocaleString('es-AR')}` : '—';
      const dias = t.dias != null ? String(t.dias) : '—';
      const fechas = t.inicio && t.fin ? `${t.inicio} → ${t.fin}` : '—';
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(t.nombre)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${dias}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${precio}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${fechas}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#1a1a1a">
  <h2 style="color:#0C1D36">Respuesta de presupuesto recibida</h2>
  <p><b>Grupo:</b> ${escapeHtml(p.grupoNombre)}</p>
  ${p.metrosCuadrados != null ? `<p><b>Superficie:</b> ${p.metrosCuadrados} m²</p>` : ''}
  <p><b>Contratista:</b> ${escapeHtml(p.contratistaNombre)}
    ${p.contratistaTelefono ? ` · ${escapeHtml(p.contratistaTelefono)}` : ''}
    ${p.contratistaEmail ? ` · ${escapeHtml(p.contratistaEmail)}` : ''}
  </p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <thead>
      <tr style="background:#F5F6F7;text-align:left">
        <th style="padding:8px">Tarea</th><th style="padding:8px">Días</th><th style="padding:8px">Precio</th><th style="padding:8px">Fechas</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4" style="padding:8px">Sin ítems</td></tr>'}</tbody>
  </table>
  <p><a href="${p.viewUrl}" style="display:inline-block;background:#E8C547;color:#0C1D36;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Ver esta respuesta</a></p>
  ${
    p.inboxUrl
      ? `<p style="margin-top:12px"><a href="${p.inboxUrl}" style="color:#4A6FA5">Abrir tu bandeja de presupuestos</a> — el contratista no necesita reenviarte nada.</p>`
      : ''
  }
  <p style="color:#5A5A5A;font-size:12px">Grows Obra Check</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyRequesterFormResponse(
  db: SupabaseClient,
  sessionId: string,
  responseId: string,
  payload: RequesterNotifyPayload,
): Promise<{ emailed: boolean; error?: string }> {
  const text = buildText(payload);
  const html = buildHtml(payload);
  let emailed = false;
  let error: string | undefined;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OBRA_CHECK_FROM_EMAIL?.trim() || 'Grows <onboarding@resend.dev>';

  if (apiKey && payload.sessionEmail) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.sessionEmail],
          subject: `Presupuesto respondido: ${payload.grupoNombre}`,
          text,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        error = `Resend ${res.status}: ${body.slice(0, 200)}`;
      } else {
        emailed = true;
      }
    } catch (e) {
      error = (e as Error).message;
    }
  }

  await db
    .from('obra_check_form_responses')
    .update({ notified_requester_at: emailed ? new Date().toISOString() : null })
    .eq('id', responseId)
    .eq('session_id', sessionId);

  await db.from('obra_check_events').insert({
    session_id: sessionId,
    tipo: 'form_response_notify',
    payload: {
      responseId,
      emailed,
      error: error ?? null,
      viewUrl: payload.viewUrl,
      to: payload.sessionEmail,
    },
  });

  return { emailed, error };
}
