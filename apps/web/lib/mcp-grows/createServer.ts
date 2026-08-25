import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { callGrowsMcpTool, GROWS_MCP_TOOLS } from '@/lib/mcp-grows/tools';

/** MCP Grows: Organizar vía ChatGPT / clientes remotos. Solo propuesta; no wallet. */
export function createGrowsMcpServer(): Server {
  const server = new Server(
    { name: 'grows-plataforma', version: '1.1.0' },
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
    return callGrowsMcpTool(supabase, req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>);
  });

  return server;
}

export function assertMcpBearer(req: Request): Response | null {
  const expected = process.env.GROWS_MCP_TOKEN?.trim();
  if (!expected) {
    return Response.json(
      { error: 'GROWS_MCP_TOKEN no configurado en el servidor' },
      { status: 503 },
    );
  }
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim() || req.headers.get('x-grows-mcp-token')?.trim() || '';
  if (token !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export const mcpCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-grows-mcp-token, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};
