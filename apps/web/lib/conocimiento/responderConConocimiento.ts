import type { CorpusHit } from '@/lib/conocimiento/buscarEnCorpus';
import { contextoComoTexto, type ContextoConocimiento } from '@/lib/conocimiento/recuperarContextoConocimiento';
import {
  cursorConocimientoDisponible,
  llamarCursorConocimiento,
} from '@/lib/conocimiento/llamarCursorConocimiento';
import { llamarLlmLocal, llmLocalConfig } from '@/lib/conocimiento/llamarLlmConocimiento';
import { armarPromptGrows } from '@/lib/conocimiento/growsOficioPrompt';

export type HiloTurno = { role: 'user' | 'horizonte' | 'assistant'; text: string };

function esPreguntaLote(mensaje: string): boolean {
  return /\b(terreno|lote|medianera|tipolog|conviene|dónde construir|donde construir)\b/i.test(
    mensaje,
  );
}

/** Fallback si no hay CURSOR_API_KEY: corpus, sin OpenAI. */
export function sintetizarSinLlm(input: {
  mensaje: string;
  objetivo: string | null;
  corpus: CorpusHit[];
  anotoPaso: { verb: string; estadoB: string } | null;
}): string {
  const partes: string[] = [];
  const objetivo = input.objetivo?.trim();

  if (objetivo && /edificio|departamento|vivienda|casa|obra/i.test(objetivo)) {
    partes.push(`Sobre tu proyecto («${objetivo.slice(0, 160)}»):`);
  }

  if (esPreguntaLote(input.mensaje)) {
    partes.push(
      'Para elegir terreno primero: ¿medianeras o esquina? ¿valor en fondo o en calle? ¿vivís en PB o arriba? Eso descarta tipologías; el cómputo viene después.',
    );
  }

  if (input.corpus.length > 0) {
    const top = input.corpus[0];
    const limpio = top.excerpt
      .replace(/^#+\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 520);
    partes.push(limpio);
    if (input.corpus[1]) {
      partes.push(input.corpus[1].excerpt.replace(/\s+/g, ' ').trim().slice(0, 280));
    }
  } else if (partes.length === 0) {
    partes.push(
      'No tengo un pasaje del corpus que cierre tu pregunta. Decime lote (medianeras/esquina), programa (ambientes) o qué tiene que quedar distinto.',
    );
  }

  if (!input.anotoPaso) {
    partes.push(
      'Si querés dejarlo en el horizonte: verbo → estado (ej. Elegir lote → Lote entre medianeras).',
    );
  } else {
    partes.push(
      `Anoté propuesta: ${input.anotoPaso.verb} → ${input.anotoPaso.estadoB}. Aceptala en la cadena si te cierra.`,
    );
  }

  return partes.join('\n\n').slice(0, 4000);
}

export async function responderConConocimiento(input: {
  mensaje: string;
  objetivo: string | null;
  contexto: ContextoConocimiento;
  historial?: HiloTurno[];
  anotoPaso: { verb: string; estadoB: string } | null;
  cadenaResumen?: string | null;
}): Promise<{ text: string; via: 'cursor' | 'llm_local' | 'sintesis' }> {
  const fallback = sintetizarSinLlm({
    mensaje: input.mensaje,
    objetivo: input.objetivo,
    corpus: input.contexto.corpus,
    anotoPaso: input.anotoPaso,
  });

  const history = (input.historial ?? []).slice(-8).map((h) => ({
    role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: h.text.slice(0, 1500),
  }));

  const messages = armarPromptGrows({
    objetivo: input.objetivo,
    cadenaResumen: input.cadenaResumen ?? null,
    contextoCorpus: contextoComoTexto(input.contexto, null),
    historial: history,
    mensaje: input.mensaje,
    anotoPaso: input.anotoPaso,
  });

  // Motor principal: cuenta Cursor (CURSOR_API_KEY)
  if (cursorConocimientoDisponible()) {
    const cursor = await llamarCursorConocimiento(messages);
    if (cursor.ok) {
      let text = cursor.text;
      if (input.anotoPaso && !text.includes(input.anotoPaso.verb)) {
        text += `\n\nAnoté propuesta: ${input.anotoPaso.verb} → ${input.anotoPaso.estadoB}.`;
      }
      return { text: text.slice(0, 6000), via: 'cursor' };
    }
  }

  if (llmLocalConfig()) {
    const local = await llamarLlmLocal(messages);
    if (local.ok) {
      let text = local.text;
      if (input.anotoPaso && !text.includes(input.anotoPaso.verb)) {
        text += `\n\nAnoté propuesta: ${input.anotoPaso.verb} → ${input.anotoPaso.estadoB}.`;
      }
      return { text: text.slice(0, 6000), via: 'llm_local' };
    }
  }

  return { text: fallback, via: 'sintesis' };
}
