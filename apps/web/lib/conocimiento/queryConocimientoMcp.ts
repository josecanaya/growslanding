import { spawn } from 'node:child_process';
import {
  argsForQueryTool,
  encodeMcpMessage,
  pushMcpBytes,
  textFromMcpResult,
} from '@/lib/conocimiento/mcpStdio';
import {
  conocimientoGraphPath,
  resolveConocimientoPython,
  resolveConocimientoRoot,
} from '@/lib/conocimiento/paths';

export type McpConocimientoHit = {
  ok: boolean;
  text: string;
  queryText: string;
  godText: string;
};

type JsonSchema = {
  properties?: Record<string, unknown>;
  required?: string[];
};

type Rpc = {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  result?: unknown;
  error?: { message?: string };
};

function isRpc(x: unknown): x is Rpc {
  return Boolean(x && typeof x === 'object' && (x as Rpc).jsonrpc === '2.0');
}

/**
 * Consulta el graph.json generado desde GROWS_CONOCIMIENTO_ROOT mediante
 * graphify.serve/MCP stdio.
 *
 * Importante: la búsqueda usa exclusivamente la pregunta real del usuario.
 * No se agregan palabras fijas (canvas, frontera, orquestador, etc.) porque
 * sesgaban todas las consultas hacia los mismos nodos del corpus.
 */
export function queryConocimientoMcp(pregunta: string): Promise<McpConocimientoHit> {
  const empty = (text: string): McpConocimientoHit => ({
    ok: false,
    text,
    queryText: '',
    godText: '',
  });

  const root = resolveConocimientoRoot();
  const graph = conocimientoGraphPath();
  if (!root) {
    return Promise.resolve(
      empty('No se encontró la carpeta de conocimiento. Definí GROWS_CONOCIMIENTO_ROOT.'),
    );
  }
  if (!graph) {
    return Promise.resolve(
      empty(`La carpeta de conocimiento existe, pero no tiene graphify-out/graph.json: ${root}`),
    );
  }

  const python = resolveConocimientoPython();
  const q = pregunta.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!q) return Promise.resolve(empty('La consulta está vacía.'));

  return new Promise((resolve) => {
    const child = spawn(
      python,
      ['-m', 'graphify.serve', graph, '--transport', 'stdio'],
      {
        cwd: root,
        windowsHide: true,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      },
    );

    let pending: Uint8Array = new Uint8Array();
    const waiting = new Map<number, (msg: Rpc) => void>();
    let nextId = 1;
    let settled = false;

    const finish = (hit: McpConocimientoHit) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      resolve({
        ...hit,
        text: hit.text.slice(0, 8000),
        queryText: hit.queryText.slice(0, 8000),
        godText: hit.godText.slice(0, 4000),
      });
    };

    const timer = setTimeout(() => {
      finish(empty('El MCP de conocimiento tardó demasiado.'));
    }, 40000);

    const send = (payload: object) => {
      try {
        child.stdin.write(encodeMcpMessage(payload));
      } catch (e) {
        finish(empty(e instanceof Error ? e.message : 'stdin MCP'));
      }
    };

    const request = (method: string, params: object) =>
      new Promise<Rpc>((res, rej) => {
        const id = nextId++;
        waiting.set(id, res);
        send({ jsonrpc: '2.0', id, method, params });
        setTimeout(() => {
          if (waiting.has(id)) {
            waiting.delete(id);
            rej(new Error(`timeout ${method}`));
          }
        }, 20000);
      });

    child.stdout.on('data', (d: Uint8Array) => {
      const out = pushMcpBytes(pending, d);
      pending = out.pending;
      for (const raw of out.messages) {
        if (!isRpc(raw) || raw.id == null) continue;
        const cb = waiting.get(Number(raw.id));
        if (cb) {
          waiting.delete(Number(raw.id));
          cb(raw);
        }
      }
    });

    child.stderr.on('data', () => {
      /* logs de graphify */
    });

    child.on('error', (e) => finish(empty(e.message)));
    child.on('close', () => {
      if (!settled) finish(empty('El MCP de conocimiento se cerró.'));
    });

    void (async () => {
      try {
        const init = await request('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'grows-conocimiento-chat', version: '2' },
        });
        if (init.error) {
          finish(empty(init.error.message ?? 'initialize MCP'));
          return;
        }
        send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

        const listed = await request('tools/list', {});
        const tools = (
          listed.result as
            | { tools?: Array<{ name: string; inputSchema?: JsonSchema }> }
            | undefined
        )?.tools;
        const queryTool =
          tools?.find((t) => t.name === 'query_graph') ??
          tools?.find((t) => /query/i.test(t.name));
        if (!queryTool) {
          finish(empty('El MCP no expone query_graph.'));
          return;
        }

        const called = await request('tools/call', {
          name: queryTool.name,
          arguments: {
            ...argsForQueryTool(queryTool.inputSchema, q),
            depth: 4,
            token_budget: 3500,
          },
        });
        if (called.error) {
          finish(empty(called.error.message ?? 'tools/call'));
          return;
        }

        const queryText = textFromMcpResult(called.result);
        let godText = '';

        // god_nodes es solo fallback. Usarlo siempre hacía que respuestas
        // distintas terminaran mostrando el mismo núcleo general del corpus.
        if (!queryText.trim() && tools?.some((t) => t.name === 'god_nodes')) {
          const g = await request('tools/call', {
            name: 'god_nodes',
            arguments: { top_n: 8 },
          });
          if (!g.error) godText = textFromMcpResult(g.result);
        }

        const ok = queryText.trim().length > 0 || godText.trim().length > 0;
        finish({
          ok,
          queryText,
          godText,
          text: queryText || godText,
        });
      } catch (e) {
        finish(empty(e instanceof Error ? e.message : 'MCP'));
      }
    })();
  });
}
