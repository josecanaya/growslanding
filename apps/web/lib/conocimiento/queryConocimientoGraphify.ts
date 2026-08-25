import { buscarEnCorpusAsync } from '@/lib/conocimiento/buscarEnCorpus';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import { responderConConocimiento } from '@/lib/conocimiento/responderConConocimiento';

export { conocimientoGraphPath } from '@/lib/conocimiento/paths';

/** Pregunta → contexto corpus/MCP → LLM (o síntesis). */
export async function queryConocimientoGraphify(
  pregunta: string,
): Promise<{ ok: boolean; text: string }> {
  const corpus = await buscarEnCorpusAsync(pregunta, 3);
  let grafoText = '';
  try {
    const mcp = await queryConocimientoMcp(pregunta);
    grafoText = [mcp.queryText, mcp.godText].filter(Boolean).join('\n\n').slice(0, 3500);
  } catch {
    grafoText = '';
  }

  const resp = await responderConConocimiento({
    mensaje: pregunta,
    objetivo: null,
    contexto: {
      corpus,
      grafoText,
      fuente: corpus.length || grafoText ? 'local' : 'vacio',
    },
    anotoPaso: null,
  });

  return {
    ok: resp.text.length > 0,
    text: resp.text,
  };
}
