import { NextResponse } from 'next/server';
import { OAUTH_CORS, randomToken, oauthDb } from '@/lib/mcp-grows/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 7591 — Dynamic Client Registration. ChatGPT se registra solo antes de autorizar. */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* cuerpo vacío permitido */
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as unknown[]).map(String)
    : [];
  if (redirectUris.length === 0) {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris requerido' },
      { status: 400, headers: OAUTH_CORS },
    );
  }

  const clientId = `grows_${randomToken(16)}`;
  const clientName = typeof body.client_name === 'string' ? body.client_name : 'MCP Client';

  const supabase = oauthDb();
  const { error } = await supabase.from('mcp_oauth_clients').insert({
    id: clientId,
    client_secret: null,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: 'none',
  });
  if (error) {
    return NextResponse.json(
      { error: 'server_error', error_description: error.message },
      { status: 500, headers: OAUTH_CORS },
    );
  }

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    { status: 201, headers: OAUTH_CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: OAUTH_CORS });
}
