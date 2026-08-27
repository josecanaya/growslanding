import { NextResponse } from 'next/server';
import { requestOrigin, OAUTH_CORS, OAUTH_SCOPES } from '@/lib/mcp-grows/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** RFC 9728 — Protected Resource Metadata. Le dice a ChatGPT qué AS usar para /api/mcp. */
export function GET(req: Request) {
  const origin = requestOrigin(req);
  return NextResponse.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      scopes_supported: [...OAUTH_SCOPES],
      bearer_methods_supported: ['header'],
    },
    { headers: OAUTH_CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: OAUTH_CORS });
}
