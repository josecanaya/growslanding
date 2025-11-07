'use server';

import 'server-only';

type JsonRecord = Record<string, unknown>;

const WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ??
  process.env.GROWS_WEBHOOK_URL ??
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

const AUTH_HEADER =
  process.env.N8N_WEBHOOK_TOKEN_HEADER ?? 'x-grows-webhook-token';

const AUTH_TOKEN = process.env.N8N_WEBHOOK_TOKEN;

function normalizePayload(payload: unknown): JsonRecord {
  if (payload && typeof payload === 'object') {
    return payload as JsonRecord;
  }

  return { payload };
}

async function parseResponseBody(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export default async function enviarMensajeAGrowsN8n(payload: unknown) {
  if (!WEBHOOK_URL) {
    throw new Error(
      'N8N_WEBHOOK_URL no está configurada. Define la URL del webhook en las variables de entorno.'
    );
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (AUTH_TOKEN) {
    requestHeaders[AUTH_HEADER] = AUTH_TOKEN;
  }

  const body: JsonRecord = {
    source: 'grows-web',
    sentAt: new Date().toISOString(),
    ...normalizePayload(payload),
  };

  let response: Response;

  try {
    response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(
      `No fue posible contactar el webhook de n8n: ${(error as Error).message}`
    );
  }

  if (!response.ok) {
    const errorBody = await parseResponseBody(response);
    throw new Error(
      `n8n respondió con ${response.status}: ${
        typeof errorBody === 'string'
          ? errorBody || response.statusText
          : JSON.stringify(errorBody)
      }`
    );
  }

  return parseResponseBody(response);
}
