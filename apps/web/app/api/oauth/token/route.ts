import { NextResponse } from 'next/server';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyJwt,
  verifyPkce,
  requestOrigin,
  OAUTH_CORS,
  ACCESS_TTL_SECONDS,
  oauthDb,
} from '@/lib/mcp-grows/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function oauthError(error: string, description: string, status = 400): Response {
  return NextResponse.json(
    { error, error_description: description },
    { status, headers: OAUTH_CORS },
  );
}

async function readBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v)]));
  }
  const form = await req.formData();
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) out[k] = String(v);
  return out;
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const grant = body.grant_type;
  const origin = requestOrigin(req);

  if (grant === 'authorization_code') {
    const { code, redirect_uri, client_id, code_verifier } = body;
    if (!code) return oauthError('invalid_request', 'code requerido');

    const supabase = oauthDb();
    const { data: row, error } = await supabase
      .from('mcp_oauth_codes')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (error) return oauthError('server_error', error.message, 500);
    if (!row) return oauthError('invalid_grant', 'code inválido');
    if (row.consumed_at) return oauthError('invalid_grant', 'code ya usado');
    if (new Date(row.expires_at).getTime() < Date.now())
      return oauthError('invalid_grant', 'code expirado');
    if (client_id && row.client_id !== client_id)
      return oauthError('invalid_grant', 'client_id no coincide');
    if (redirect_uri && row.redirect_uri !== redirect_uri)
      return oauthError('invalid_grant', 'redirect_uri no coincide');
    if (row.code_challenge && !verifyPkce(code_verifier || '', row.code_challenge, row.code_challenge_method || 'S256'))
      return oauthError('invalid_grant', 'PKCE inválido');

    // un solo uso
    await supabase.from('mcp_oauth_codes').update({ consumed_at: new Date().toISOString() }).eq('code', code);

    const userId = String(row.user_id);
    const scope = row.scope || 'grows.read grows.write';
    return NextResponse.json(
      {
        access_token: issueAccessToken(userId, scope, origin),
        token_type: 'Bearer',
        expires_in: ACCESS_TTL_SECONDS,
        refresh_token: issueRefreshToken(userId, scope, origin),
        scope,
      },
      { headers: OAUTH_CORS },
    );
  }

  if (grant === 'refresh_token') {
    const rt = body.refresh_token;
    if (!rt) return oauthError('invalid_request', 'refresh_token requerido');
    const payload = verifyJwt(rt);
    if (!payload || payload.type !== 'refresh' || typeof payload.sub !== 'string')
      return oauthError('invalid_grant', 'refresh_token inválido o expirado');

    const userId = payload.sub;
    const scope = typeof payload.scope === 'string' ? payload.scope : 'grows.read grows.write';
    return NextResponse.json(
      {
        access_token: issueAccessToken(userId, scope, origin),
        token_type: 'Bearer',
        expires_in: ACCESS_TTL_SECONDS,
        refresh_token: issueRefreshToken(userId, scope, origin),
        scope,
      },
      { headers: OAUTH_CORS },
    );
  }

  return oauthError('unsupported_grant_type', `grant_type no soportado: ${grant}`);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: OAUTH_CORS });
}
