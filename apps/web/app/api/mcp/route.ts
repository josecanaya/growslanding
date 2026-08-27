import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  authenticateMcp,
  createGrowsMcpServer,
  mcpCorsHeaders,
} from '@/lib/mcp-grows/createServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleMcp(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: mcpCorsHeaders });
  }

  const auth = authenticateMcp(req);
  if ('error' in auth) {
    const headers = new Headers(auth.error.headers);
    for (const [k, v] of Object.entries(mcpCorsHeaders)) headers.set(k, v);
    return new Response(auth.error.body, { status: auth.error.status, headers });
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createGrowsMcpServer(auth.ctx);
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(mcpCorsHeaders)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export async function GET(req: Request) {
  return handleMcp(req);
}

export async function POST(req: Request) {
  return handleMcp(req);
}

export async function DELETE(req: Request) {
  return handleMcp(req);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: mcpCorsHeaders });
}
