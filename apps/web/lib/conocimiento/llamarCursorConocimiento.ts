import { resolveConocimientoRoot } from '@/lib/conocimiento/paths';

export type MensajeMotor = { role: 'system' | 'user' | 'assistant'; content: string };

function cursorApiKey(): string | null {
  return process.env.CURSOR_API_KEY?.trim() || null;
}

function usarCloud(): boolean {
  if (process.env.GROWS_CURSOR_RUNTIME === 'local') return false;
  if (process.env.GROWS_CURSOR_RUNTIME === 'cloud') return true;
  return Boolean(process.env.VERCEL);
}

function extractAssistantText(result: {
  status?: string;
  result?: string | null;
}): string {
  const t = typeof result.result === 'string' ? result.result.trim() : '';
  return t;
}

/**
 * Motor de razonamiento = Cursor (plan Cursor), no OpenAI de pago.
 * Local en tu máquina; cloud en Vercel (repo grows-conocimiento).
 */
export async function llamarCursorConocimiento(
  messages: MensajeMotor[],
): Promise<{ ok: true; text: string } | { ok: false; text: string }> {
  const apiKey = cursorApiKey();
  if (!apiKey) {
    return {
      ok: false,
      text: 'Sin CURSOR_API_KEY. Creala en cursor.com/dashboard/integrations (va contra tu plan Cursor, no contra OpenAI).',
    };
  }

  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const rest = messages.filter((m) => m.role !== 'system');
  const transcript = rest
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Oficio'}: ${m.content}`)
    .join('\n\n');
  const prompt = [
    system,
    '',
    'Conversación:',
    transcript,
    '',
    'Respondé solo el mensaje final al usuario. Sin markdown de sistema, sin explicar herramientas.',
  ].join('\n');

  try {
    const { Agent } = await import('@cursor/sdk');
    const modelId = process.env.GROWS_CURSOR_MODEL?.trim() || 'composer-2.5';
    const root = resolveConocimientoRoot();
    const github =
      process.env.GROWS_CONOCIMIENTO_GITHUB?.trim() || 'josecanaya/grows';

    const options = usarCloud()
      ? {
          apiKey,
          model: { id: modelId },
          cloud: {
            repos: [{ url: `https://github.com/${github}`, startingRef: 'main' }],
          },
        }
      : {
          apiKey,
          model: { id: modelId },
          local: { cwd: root || process.cwd() },
        };

    const result = await Agent.prompt(prompt.slice(0, 12000), options as any);
    if (result.status === 'error') {
      return { ok: false, text: `Cursor agent error (${result.id ?? 'sin id'})` };
    }
    const text = extractAssistantText(result);
    if (!text) return { ok: false, text: 'Cursor devolvió vacío.' };
    return { ok: true, text: text.slice(0, 6000) };
  } catch (e) {
    return {
      ok: false,
      text: e instanceof Error ? e.message : 'Error Cursor SDK',
    };
  }
}

export function cursorConocimientoDisponible(): boolean {
  return Boolean(cursorApiKey());
}
