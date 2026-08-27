/**
 * OpenAPI Actions para Custom GPT de ChatGPT (alternativa al conector MCP).
 * Misma lógica que /api/mcp — solo propuesta Organizar.
 */
import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { authenticateMcp, mcpCorsHeaders } from '@/lib/mcp-grows/createServer';
import { callGrowsMcpTool } from '@/lib/mcp-grows/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tool: string }> };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mcpCorsHeaders });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = authenticateMcp(req);
  if ('error' in auth) {
    const headers = new Headers(auth.error.headers);
    for (const [k, v] of Object.entries(mcpCorsHeaders)) headers.set(k, v);
    return new NextResponse(auth.error.body, { status: auth.error.status, headers });
  }

  const { tool } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = createServiceSupabaseClient();
  const result = await callGrowsMcpTool(supabase, tool, body, auth.ctx);
  const text = result.content[0]?.text ?? '{}';
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep string */
  }
  return NextResponse.json(json, { headers: mcpCorsHeaders });
}
