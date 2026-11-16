#!/usr/bin/env node
// Genera claves propias de la instancia de pruebas (nunca las de producción) y escribe:
//   supabase/pruebas/.env          → docker compose
//   apps/web/.env.pruebas.local    → Next.js apuntando SOLO a 127.0.0.1
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const composeEnv = resolve(root, 'supabase/pruebas/.env');
if (existsSync(composeEnv) && !process.argv.includes('--forzar')) {
  console.log('Ya existe supabase/pruebas/.env (usá --forzar para regenerar; invalida la base levantada).');
  process.exit(0);
}
const b64 = (v) => Buffer.from(v).toString('base64url');
const secret = randomBytes(32).toString('hex');
const sign = (role) => {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64(JSON.stringify({ iss: 'grows-pruebas', role, iat: now, exp: now + 3600 * 24 * 365 * 5 }));
  return `${head}.${body}.${createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`;
};
const pg = randomBytes(16).toString('hex');
const anon = sign('anon');
const service = sign('service_role');
const apiPort = process.env.PRUEBAS_API_PORT || '54321';
const dbPort = process.env.PRUEBAS_DB_PORT || '54322';
const webPort = process.env.PRUEBAS_WEB_PORT || '3100';
writeFileSync(composeEnv, [
  `POSTGRES_PASSWORD=${pg}`, `JWT_SECRET=${secret}`, `ANON_KEY=${anon}`, `SERVICE_ROLE_KEY=${service}`,
  `PRUEBAS_API_PORT=${apiPort}`, `PRUEBAS_DB_PORT=${dbPort}`, `PRUEBAS_WEB_PORT=${webPort}`, '',
].join('\n'));
writeFileSync(resolve(root, 'apps/web/.env.pruebas.local'), [
  '# Generado por scripts/entorno-pruebas/claves.mjs — instancia local de pruebas, identidades ficticias.',
  'GROWS_ENTORNO=pruebas',
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:${apiPort}`,
  `SUPABASE_URL=http://127.0.0.1:${apiPort}`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_SERVICE_ROLE_KEY=${service}`,
  `PRUEBAS_DATABASE_URL=postgres://postgres:${pg}@127.0.0.1:${dbPort}/postgres`,
  `PRUEBAS_WEB_URL=http://127.0.0.1:${webPort}`,
  // Operaciones externas deshabilitadas a propósito en pruebas.
  'MERCADOPAGO_ACCESS_TOKEN=', 'WHATSAPP_TOKEN=', 'RESEND_API_KEY=', 'NEXT_PUBLIC_DEV_MODE=false', '',
].join('\n'));
console.log('Claves de pruebas generadas.');
