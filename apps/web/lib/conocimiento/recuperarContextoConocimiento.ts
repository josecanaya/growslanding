import type { CorpusHit } from '@/lib/conocimiento/buscarEnCorpus';
import { buscarEnCorpus } from '@/lib/conocimiento/buscarEnCorpus';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';

export type ContextoConocimiento = {
  corpus: CorpusHit[];
  grafoText: string;
  fuente: 'local' | 'vacio';
};

/** Recupera contexto RAG: markdown del corpus + Graphify si está. */
export async function recuperarContextoConocimiento(
  pregunta: string,
): Promise<ContextoConocimiento> {
  const corpus = buscarEnCorpus(pregunta, 3);
  let grafoText = '';
  try {
    const mcp = await queryConocimientoMcp(pregunta);
    grafoText = [mcp.queryText, mcp.godText].filter(Boolean).join('\n\n').slice(0, 3500);
  } catch {
    grafoText = '';
  }
  return {
    corpus,
    grafoText,
    fuente: corpus.length > 0 || grafoText ? 'local' : 'vacio',
  };
}

export function contextoComoTexto(ctx: ContextoConocimiento, objetivo: string | null): string {
  const partes: string[] = [];
  if (objetivo?.trim()) {
    partes.push(`Objetivo del proyecto: ${objetivo.trim().slice(0, 400)}`);
  }
  for (const h of ctx.corpus) {
    partes.push(`[${h.file}]\n${h.excerpt}`);
  }
  if (ctx.grafoText.trim()) {
    partes.push(`Grafo Graphify:\n${ctx.grafoText.trim()}`);
  }
  return partes.join('\n\n').slice(0, 7000);
}
