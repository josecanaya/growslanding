import { spawn } from 'node:child_process';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import {
  conocimientoGraphPath,
  resolveConocimientoPython,
  resolveConocimientoRoot,
} from '@/lib/conocimiento/paths';
import {
  responderConConocimiento,
  type ChatHistoryMessage,
} from '@/lib/conocimiento/responderConConocimiento';

export { conocimientoGraphPath };

/**
 * Recupera conocimiento desde grows-conocimiento vía Graphify/MCP y usa ese
 * contexto como RAG para una respuesta conversacional de LLM.
 */
export async function queryConocimientoGraphify(
  pregunta: string,
  history: ChatHistoryMessage[] = [],
): Promise<{ ok: boolean; text: string; source?: 'llm' | 'fallback' }> {
  const root = resolveConocimientoRoot();
  if (!root) {
    return {
      ok: false,
      text: 'No está la carpeta grows-conocimiento. Definí GROWS_CONOCIMIENTO_ROOT.',
    };
  }

  const mcp = await queryConocimientoMcp(pregunta);
  if (mcp.ok || mcp.queryText || mcp.godText) {
    return responderConConocimiento({
      pregunta,
      history,
      queryText: mcp.queryText,
      godText: mcp.godText,
    });
  }

  // Fallback de recuperación para entornos donde graphify.serve/MCP no responde,
  // pero el CLI de Graphify sí está disponible sobre la misma carpeta.
  const python = resolveConocimientoPython();
  const q = pregunta.replace(/\s+/g, ' ').trim().slice(0, 500);

  return new Promise((resolve) => {
    const child = spawn(python, ['-m', 'graphify', 'query', q], {
      cwd: root,
      windowsHide: true,
    });
    let out = '';
    let err = '';

    const answer = async (queryText: string, godText?: string) => {
      const result = await responderConConocimiento({
        pregunta,
        history,
        queryText,
        godText,
      });
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill();
      void answer('', mcp.text);
    }, 40000);

    child.stdout.on('data', (d) => {
      out += String(d);
    });
    child.stderr.on('data', (d) => {
      err += String(d);
    });
    child.on('error', () => {
      clearTimeout(timer);
      void answer('', mcp.text);
    });
    child.on('close', () => {
      clearTimeout(timer);
      void answer(out.trim(), err.trim() || mcp.text);
    });
  });
}
