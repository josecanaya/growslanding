import { NextResponse } from 'next/server';
import { requestOrigin, OAUTH_CORS, OAUTH_SCOPES } from '@/lib/mcp-grows/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 8414 — Authorization Server Metadata (lo lee ChatGPT para saber dónde autorizar). */
export function GET(req: Request) {
  const origin = requestOrigin(req);
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/api/oauth/authorize`,
      token_endpoint: `${origin}/api/oauth/token`,
      registration_endpoint: `${origin}/api/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256', 'plain'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [...OAUTH_SCOPES],
    },
    { headers: OAUTH_CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: OAUTH_CORS });
}
