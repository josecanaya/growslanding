/** Opcional: Ollama u otro endpoint OpenAI-compatible GRATIS en local. No es el camino principal. */

export type MensajeLlm = { role: 'system' | 'user' | 'assistant'; content: string };

export function llmLocalConfig(): {
  url: string;
  model: string;
  apiKey: string | null;
} | null {
  const url = process.env.GROWS_CONOCIMIENTO_LLM_URL?.trim();
  if (!url) return null;
  const model = process.env.GROWS_CONOCIMIENTO_LLM_MODEL?.trim() || 'llama3.2';
  const apiKey = process.env.GROWS_CONOCIMIENTO_LLM_API_KEY?.trim() || null;
  return { url, model, apiKey };
}

export async function llamarLlmLocal(
  messages: MensajeLlm[],
): Promise<{ ok: true; text: string } | { ok: false; text: string }> {
  const cfg = llmLocalConfig();
  if (!cfg) return { ok: false, text: 'Sin LLM local.' };

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.3,
        max_tokens: 900,
        messages,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };
    if (!res.ok) return { ok: false, text: json.error?.message ?? `LLM HTTP ${res.status}` };
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) return { ok: false, text: 'Vacío' };
    return { ok: true, text: text.slice(0, 6000) };
  } catch (e) {
    return { ok: false, text: e instanceof Error ? e.message : 'Error LLM local' };
  }
}
