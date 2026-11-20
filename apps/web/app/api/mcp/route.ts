import { authenticateConnector } from '@/lib/connectors/auth';
import { connectorOrigin, oauthFailure } from '@/lib/connectors/core';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  assertMcpBearer,
  createGrowsMcpServer,
  mcpCorsHeaders,
} from '@/lib/mcp-grows/createServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration=120;

async function handleMcp(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: mcpCorsHeaders });
  }

  // Preserve the existing organization-limited shared-key connector without widening its tools.
  const legacy = !req.headers.get('authorization')?.match(/^Bearer grows_c_/i) && !assertMcpBearer(req);
  let principal;
  if (!legacy) {
    try { principal = await authenticateConnector(req); }
    catch(error) {
      const denied=oauthFailure(error);const headers=new Headers(denied.headers);
      for(const [k,v] of Object.entries(mcpCorsHeaders))headers.set(k,v);
      if(denied.status===401)headers.set('WWW-Authenticate',`Bearer resource_metadata="${connectorOrigin()}/.well-known/oauth-protected-resource", scope="grows:public"`);
      return new Response(denied.body,{status:denied.status,headers});
    }
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createGrowsMcpServer(principal);
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
