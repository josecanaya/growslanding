import { spawn } from 'node:child_process';
import { conversarDesdeGrafo } from '@/lib/conocimiento/conversarDesdeGrafo';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import {
  conocimientoGraphPath,
  resolveConocimientoPython,
  resolveConocimientoRoot,
} from '@/lib/conocimiento/paths';

export { conocimientoGraphPath };

/** Consulta Graphify de grows-conocimiento vía MCP stdio. Sin API key. */
export async function queryConocimientoGraphify(
  pregunta: string,
): Promise<{ ok: boolean; text: string }> {
  const root = resolveConocimientoRoot();
  if (!root) {
    return {
      ok: false,
      text: 'No está la carpeta grows-conocimiento. Definí GROWS_CONOCIMIENTO_ROOT.',
    };
  }

  const mcp = await queryConocimientoMcp(pregunta);
  if (mcp.ok || mcp.queryText || mcp.godText) {
    return {
      ok: true,
      text: conversarDesdeGrafo({
        pregunta,
        queryText: mcp.queryText,
        godText: mcp.godText,
      }),
    };
  }

  const python = resolveConocimientoPython();
  const q = pregunta.replace(/\s+/g, ' ').trim().slice(0, 500);

  return new Promise((resolve) => {
    const child = spawn(python, ['-m', 'graphify', 'query', q], {
      cwd: root,
      windowsHide: true,
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill();
      resolve({
        ok: false,
        text: conversarDesdeGrafo({
          pregunta,
          queryText: '',
          godText: mcp.text,
        }),
      });
    }, 40000);
    child.stdout.on('data', (d) => {
      out += String(d);
    });
    child.stderr.on('data', (d) => {
      err += String(d);
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve({
        ok: false,
        text: conversarDesdeGrafo({ pregunta, queryText: '', godText: mcp.text }),
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      const queryText = out.trim();
      resolve({
        ok: code === 0 && queryText.length > 0,
        text: conversarDesdeGrafo({
          pregunta,
          queryText,
          godText: err.trim() || mcp.text,
        }).slice(0, 8000),
      });
    });
  });
}
