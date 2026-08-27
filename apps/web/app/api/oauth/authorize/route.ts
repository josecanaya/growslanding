import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { randomToken, CODE_TTL_SECONDS, oauthDb } from '@/lib/mcp-grows/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthzParams = {
  client_id: string;
  redirect_uri: string;
  state: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
  response_type: string;
};

function readParams(sp: URLSearchParams): AuthzParams {
  return {
    client_id: sp.get('client_id') || '',
    redirect_uri: sp.get('redirect_uri') || '',
    state: sp.get('state') || '',
    scope: sp.get('scope') || 'grows.read grows.write',
    code_challenge: sp.get('code_challenge') || '',
    code_challenge_method: sp.get('code_challenge_method') || 'S256',
    response_type: sp.get('response_type') || 'code',
  };
}

async function validateClient(clientId: string, redirectUri: string): Promise<boolean> {
  if (!clientId || !redirectUri) return false;
  const supabase = oauthDb();
  const { data } = await supabase
    .from('mcp_oauth_clients')
    .select('id, redirect_uris')
    .eq('id', clientId)
    .maybeSingle();
  if (!data) return false;
  const uris = Array.isArray(data.redirect_uris) ? (data.redirect_uris as unknown[]).map(String) : [];
  return uris.includes(redirectUri);
}

/** Emite un authorization code atado al usuario y redirige de vuelta al cliente. */
async function issueCodeRedirect(p: AuthzParams, userId: string): Promise<Response> {
  const code = randomToken(32);
  const supabase = oauthDb();
  const { error } = await supabase.from('mcp_oauth_codes').insert({
    code,
    client_id: p.client_id,
    user_id: userId,
    redirect_uri: p.redirect_uri,
    scope: p.scope,
    code_challenge: p.code_challenge || null,
    code_challenge_method: p.code_challenge_method || null,
    expires_at: new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) return errorPage(`No se pudo emitir el código: ${error.message}`);

  const url = new URL(p.redirect_uri);
  url.searchParams.set('code', code);
  if (p.state) url.searchParams.set('state', p.state);
  return NextResponse.redirect(url.toString(), { status: 302 });
}

function loginPage(p: AuthzParams, errorMsg?: string): Response {
  const hidden = (Object.entries(p) as [string, string][])
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${escapeHtml(v)}" />`)
    .join('\n');
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Conectar con Grows</title>
<style>
  :root{--azul:#1e3a8a;--azul2:#2563eb;--bg:#f4f6fb;--txt:#0f172a;--muted:#64748b;--err:#b91c1c;}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--txt);display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(30,58,138,.12);width:100%;max-width:380px;padding:32px}
  .brand{font-weight:800;font-size:22px;color:var(--azul);letter-spacing:-.02em;margin:0 0 4px}
  .sub{color:var(--muted);font-size:14px;margin:0 0 22px}
  label{display:block;font-size:13px;font-weight:600;margin:14px 0 6px}
  input[type=email],input[type=password]{width:100%;padding:11px 12px;border:1px solid #d7dce8;border-radius:10px;font-size:15px}
  input:focus{outline:none;border-color:var(--azul2);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
  button{width:100%;margin-top:22px;padding:12px;background:var(--azul2);color:#fff;border:0;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer}
  button:hover{background:var(--azul)}
  .err{background:#fef2f2;color:var(--err);border:1px solid #fecaca;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:6px}
  .foot{margin-top:18px;font-size:12px;color:var(--muted);text-align:center;line-height:1.5}
</style></head>
<body>
  <form class="card" method="post" action="/api/oauth/authorize">
    <p class="brand">Grows</p>
    <p class="sub">Autorizá el acceso a tus obras desde ChatGPT.</p>
    ${errorMsg ? `<div class="err">${escapeHtml(errorMsg)}</div>` : ''}
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required />
    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />
    ${hidden}
    <button type="submit">Iniciar sesión y autorizar</button>
    <p class="foot">Solo se conectará ChatGPT a las obras de tu cuenta.<br/>Podés revocar el acceso cuando quieras.</p>
  </form>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function errorPage(msg: string): Response {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>Error</title></head>
  <body style="font-family:system-ui;padding:40px;color:#0f172a">
  <h2 style="color:#b91c1c">No se pudo autorizar</h2><p>${escapeHtml(msg)}</p></body></html>`;
  return new Response(html, { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

/** GET: si hay sesión Grows → emite código; si no → muestra login. */
export async function GET(req: Request) {
  const p = readParams(new URL(req.url).searchParams);
  if (p.response_type !== 'code') return errorPage('response_type debe ser "code".');
  if (!(await validateClient(p.client_id, p.redirect_uri)))
    return errorPage('client_id o redirect_uri inválido. Reintentá la conexión desde ChatGPT.');

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as never });
  const { data } = await supabase.auth.getUser();
  if (data?.user) return issueCodeRedirect(p, data.user.id);

  return loginPage(p);
}

/** POST: procesa login del formulario y luego emite código. */
export async function POST(req: Request) {
  const form = await req.formData();
  const p: AuthzParams = {
    client_id: String(form.get('client_id') || ''),
    redirect_uri: String(form.get('redirect_uri') || ''),
    state: String(form.get('state') || ''),
    scope: String(form.get('scope') || 'grows.read grows.write'),
    code_challenge: String(form.get('code_challenge') || ''),
    code_challenge_method: String(form.get('code_challenge_method') || 'S256'),
    response_type: String(form.get('response_type') || 'code'),
  };
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');

  if (!(await validateClient(p.client_id, p.redirect_uri)))
    return errorPage('client_id o redirect_uri inválido.');

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as never });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    return loginPage(p, 'Email o contraseña incorrectos.');
  }
  return issueCodeRedirect(p, data.user.id);
}
