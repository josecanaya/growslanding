import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { callGrowsMcpTool, GROWS_MCP_TOOLS } from '@/lib/mcp-grows/tools';
import { verifyJwt, type McpUserContext } from '@/lib/mcp-grows/oauth';

/** MCP Grows: Organizar vía ChatGPT / clientes remotos. Solo propuesta; no wallet. */
export function createGrowsMcpServer(ctx: McpUserContext = {}): Server {
  const server = new Server(
    { name: 'grows-plataforma', version: '2.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: GROWS_MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const supabase = createServiceSupabaseClient();
    return callGrowsMcpTool(
      supabase,
      req.params.name,
      (req.params.arguments ?? {}) as Record<string, unknown>,
      ctx,
    );
  });

  return server;
}

function originFrom(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

function unauthorized(req: Request, message: string): Response {
  const resourceMeta = `${originFrom(req)}/.well-known/oauth-protected-resource`;
  const headers = new Headers(mcpCorsHeaders);
  headers.set('WWW-Authenticate', `Bearer resource_metadata="${resourceMeta}", error="invalid_token"`);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ error: message }), { status: 401, headers });
}

/**
 * Autentica una request al MCP. Acepta:
 *  - Token OAuth por usuario (JWT emitido por /oauth/token) → ctx.userId.
 *  - Token estático GROWS_MCP_TOKEN (dueño / respaldo) → sin userId (usa GROWS_MCP_ORG_ID).
 * Devuelve { error } (Response para cortar) o { ctx } para seguir.
 */
export function authenticateMcp(req: Request): { error: Response } | { ctx: McpUserContext } {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || req.headers.get('x-grows-mcp-token')?.trim() || '';

  if (!token) return { error: unauthorized(req, 'Falta autenticación. Conectá con OAuth.') };

  // 1) ¿Es un JWT OAuth válido?
  const payload = verifyJwt(token);
  if (payload && payload.type === 'access' && typeof payload.sub === 'string') {
    return { ctx: { userId: payload.sub } };
  }

  // 2) ¿Es el token estático del dueño?
  const staticToken = process.env.GROWS_MCP_TOKEN?.trim();
  if (staticToken && token === staticToken) {
    return { ctx: { userId: undefined, orgIds: null } };
  }

  return { error: unauthorized(req, 'Token inválido o expirado.') };
}

/** Compat: viejo helper booleano. Prefiere authenticateMcp. */
export function assertMcpBearer(req: Request): Response | null {
  const res = authenticateMcp(req);
  return 'error' in res ? res.error : null;
}

export const mcpCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-grows-mcp-token, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version, WWW-Authenticate',
};
