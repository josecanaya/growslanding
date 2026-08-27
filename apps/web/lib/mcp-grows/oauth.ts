import { createHmac, randomBytes, createHash, timingSafeEqual } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

/**
 * Cliente service-role SIN tipar, para las tablas mcp_oauth_* que aún no están
 * en supabase.gen.ts. Evita errores de tipos en `next build`.
 */
export function oauthDb(): SupabaseClient {
  return createServiceSupabaseClient() as unknown as SupabaseClient;
}

/**
 * OAuth 2.1 mínimo para el MCP de Grows (conexión "como GitHub" desde ChatGPT).
 * Grows es Authorization Server + Resource Server; la identidad la da Supabase Auth.
 * Access/refresh tokens = JWT HS256 firmados con GROWS_MCP_JWT_SECRET (o GROWS_MCP_TOKEN).
 */

const ACCESS_TTL_S = 60 * 60; // 1h
const REFRESH_TTL_S = 60 * 60 * 24 * 30; // 30d
const CODE_TTL_S = 60 * 5; // 5 min

export function jwtSecret(): string {
  const s = process.env.GROWS_MCP_JWT_SECRET?.trim() || process.env.GROWS_MCP_TOKEN?.trim() || '';
  if (!s) throw new Error('Falta GROWS_MCP_JWT_SECRET o GROWS_MCP_TOKEN');
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function signJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = createHmac('sha256', jwtSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expected = createHmac('sha256', jwtSecret()).update(`${h}.${p}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  const exp = typeof payload.exp === 'number' ? payload.exp : 0;
  if (exp && Date.now() / 1000 > exp) return null;
  return payload;
}

export function issueAccessToken(userId: string, scope: string, issuer: string): string {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: userId,
    scope,
    type: 'access',
    iss: issuer,
    aud: 'grows-mcp',
    iat: now,
    exp: now + ACCESS_TTL_S,
  });
}

export function issueRefreshToken(userId: string, scope: string, issuer: string): string {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    sub: userId,
    scope,
    type: 'refresh',
    iss: issuer,
    aud: 'grows-mcp',
    iat: now,
    exp: now + REFRESH_TTL_S,
  });
}

export const ACCESS_TTL_SECONDS = ACCESS_TTL_S;
export const CODE_TTL_SECONDS = CODE_TTL_S;

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** PKCE S256: verifica que sha256(verifier) == challenge. */
export function verifyPkce(verifier: string, challenge: string, method?: string): boolean {
  if (!challenge) return true; // sin PKCE (no recomendado, pero permitido si el cliente no lo mandó)
  if ((method || 'S256').toUpperCase() === 'PLAIN') return verifier === challenge;
  const hash = createHash('sha256').update(verifier).digest('base64url');
  return hash === challenge;
}

export type McpUserContext = {
  userId?: string; // presente cuando el token es OAuth (por usuario)
  orgIds?: string[] | null; // orgs a las que el usuario tiene acceso; null = sin restricción (owner)
};

/** Origin público de la request (respeta proxy de Vercel). */
export function requestOrigin(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

export const OAUTH_CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const OAUTH_SCOPES = ['grows.read', 'grows.write'] as const;

/** Devuelve las org_id a las que el usuario tiene acceso (dueño o socio). */
export async function resolveUserOrgIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: owned } = await supabase
    .from('organizations')
    .select('id')
    .eq('user_id', userId);
  for (const o of owned ?? []) if (o?.id) ids.add(String(o.id));

  const { data: memberOf } = await supabase
    .from('socios')
    .select('org_id')
    .eq('user_id', userId);
  for (const s of memberOf ?? []) if (s?.org_id) ids.add(String(s.org_id));

  return [...ids];
}
