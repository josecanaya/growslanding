#!/usr/bin/env node
/**
 * Grows Cloud Worker — diagnóstico previo al arranque.
 *
 * Verifica que la VM esté lista SIN procesar ningún job ni tocar la cola.
 * Reutiliza detectCapabilities() y fetchAgentContext() del bridge: este script
 * no reimplementa la detección, solo la consulta y explica los fallos.
 *
 * Uso:
 *   node cloud-agent-check.mjs
 *   GROWS_BRIDGE_URL=... GROWS_BRIDGE_TOKEN=... node cloud-agent-check.mjs
 *
 * Salida: exit 0 si está listo para levantar el servicio, 1 si falta algo.
 * NUNCA imprime el token ni el contenido de los prompts.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// En la VM el worker queda al lado de este script (/opt/grows-agent/).
// En el repo vive en scripts/. Resolvemos ambos para poder probar el
// diagnóstico localmente antes de subirlo.
const here = path.dirname(fileURLToPath(import.meta.url));
const bridgePath = [
  path.join(here, 'grows-bridge.mjs'),
  path.join(here, '..', '..', 'scripts', 'grows-bridge.mjs'),
].find(existsSync);

if (!bridgePath) {
  console.error('\nNo encontré grows-bridge.mjs junto a este script ni en scripts/.\n');
  process.exit(1);
}

const { detectCapabilities, fetchAgentContext } = await import(pathToFileURL(bridgePath).href);

const OK = 'OK';
const FAIL = 'FALTA';
const WARN = 'AVISO';

const rows = [];
let blocking = 0;

function report(label, status, detail = '') {
  rows.push({ label, status, detail });
  if (status === FAIL) blocking += 1;
}

/** Ejecuta un binario y devuelve {code, stdout} sin volcar nada a la consola. */
function run(bin, args, timeoutMs = 10000) {
  return new Promise((resolve) => {
    let stdout = '';
    let settled = false;
    const done = (value) => { if (!settled) { settled = true; resolve(value); } };
    let child;
    try {
      child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch {
      return done({ code: null, stdout: '' });
    }
    const timer = setTimeout(() => { child.kill(); done({ code: null, stdout }); }, timeoutMs);
    child.stdout?.on('data', (chunk) => { if (stdout.length < 20000) stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { if (stdout.length < 20000) stdout += chunk.toString(); });
    child.once('error', () => { clearTimeout(timer); done({ code: null, stdout }); });
    child.once('close', (code) => { clearTimeout(timer); done({ code, stdout }); });
  });
}

async function main() {
  console.log('\nGrows Cloud Worker\n');

  // ── 1. Node ────────────────────────────────────────────────────────────────
  const major = Number(process.versions.node.split('.')[0]);
  // El worker usa fetch global y AbortSignal.timeout(): ambos requieren Node 18+.
  if (major >= 18) report('Node', OK, `v${process.versions.node}`);
  else report('Node', FAIL, `v${process.versions.node} — se requiere 18 o superior`);

  // ── 2. Configuración ───────────────────────────────────────────────────────
  const base = process.env.GROWS_BRIDGE_URL;
  const token = process.env.GROWS_BRIDGE_TOKEN;
  let configOk = true;

  if (!base) {
    report('Config URL', FAIL, 'GROWS_BRIDGE_URL no está definida');
    configOk = false;
  } else {
    let parsed;
    try { parsed = new URL(base); } catch { parsed = null; }
    if (!parsed) {
      report('Config URL', FAIL, 'GROWS_BRIDGE_URL no es una URL válida');
      configOk = false;
    } else if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
      report('Config URL', FAIL, `${parsed.origin} — el worker exige HTTPS`);
      configOk = false;
    } else {
      report('Config URL', OK, parsed.origin);
    }
  }

  // El token NUNCA se imprime: solo se informa su forma.
  if (!token) {
    report('Config token', FAIL, 'GROWS_BRIDGE_TOKEN no está definido');
    configOk = false;
  } else if (!/^[a-f0-9]{64}$/.test(token)) {
    report('Config token', FAIL, `formato inválido (se esperan 64 hex, hay ${token.length} caracteres)`);
    configOk = false;
  } else {
    report('Config token', OK, 'presente (64 hex)');
  }

  // ── 3. Claude CLI + sesión ─────────────────────────────────────────────────
  // force:true saltea el cache de 30 min del bridge; en diagnóstico queremos el
  // estado real de ahora, no el que se detectó al arrancar.
  let capabilities = [];
  try {
    capabilities = await detectCapabilities({}, { force: true });
  } catch (error) {
    report('Claude CLI', FAIL, `detección falló: ${error instanceof Error ? error.message : error}`);
  }
  const claude = capabilities.find((c) => c.id === 'claude');

  if (claude) {
    report('Claude CLI', OK, String(claude.bin));
    report('Claude session', OK, 'sesión activa');
  } else {
    // detectCapabilities solo dice sí/no. Averiguamos el motivo para el usuario.
    const version = await run('claude', ['--version']);
    if (version.code === null) {
      report('Claude CLI', FAIL, 'no está en el PATH — instalá con: curl -fsSL https://claude.ai/install.sh | bash');
      report('Claude session', FAIL, 'no se puede verificar sin el CLI');
    } else {
      report('Claude CLI', OK, version.stdout.trim().split('\n')[0] || 'instalado');
      const auth = await run('claude', ['auth', 'status']);
      const loggedOut = /"loggedIn"\s*:\s*false/.test(auth.stdout) || auth.code !== 0;
      report('Claude session', FAIL, loggedOut
        ? 'sin sesión — ejecutá: sudo -iu grows-agent   y luego:  claude  (o claude auth login)'
        : 'estado desconocido; probá "claude auth status" como grows-agent');
    }
  }

  // Codex y Cursor son opcionales en esta POC: su ausencia no bloquea.
  const optional = ['openai', 'cursor'].filter((id) => capabilities.some((c) => c.id === id));
  report('Otros proveedores', optional.length ? OK : WARN,
    optional.length ? optional.join(', ') : 'sin Codex ni Cursor (opcional en esta POC)');

  // ── 4. Servidor Grows ──────────────────────────────────────────────────────
  // Enviamos una acción inexistente a propósito: el endpoint valida primero el
  // token del device y después el esquema del cuerpo. Así comprobamos la
  // credencial sin reclamar ni modificar ningún job.
  //   401 → token inválido o dispositivo revocado
  //   400 → token válido (el cuerpo es el que se rechaza)  ← lo que buscamos
  if (configOk) {
    try {
      const response = await fetch(new URL('/api/bridge/worker', base), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: '__diagnostico__' }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 400) report('Grows server', OK, 'dispositivo autorizado');
      else if (response.status === 401) report('Grows server', FAIL, 'token rechazado — generá uno nuevo desde Grows');
      else report('Grows server', WARN, `respuesta inesperada HTTP ${response.status}`);
    } catch (error) {
      report('Grows server', FAIL, `inalcanzable: ${error instanceof Error ? error.message : error}`);
    }

    // ── 5. Contrato del agente ───────────────────────────────────────────────
    try {
      const context = await fetchAgentContext(base, token);
      report('Agent context', OK, `${(Buffer.byteLength(context, 'utf8') / 1024).toFixed(1)} KB`);
    } catch (error) {
      // No bloquea: el worker tiene un fallback embebido y reintenta cada 30 min.
      report('Agent context', WARN, `${error instanceof Error ? error.message : error} (se usará el fallback)`);
    }
  } else {
    report('Grows server', FAIL, 'sin URL/token válidos no se puede verificar');
    report('Agent context', FAIL, 'sin URL/token válidos no se puede verificar');
  }

  // ── Salida ─────────────────────────────────────────────────────────────────
  const width = Math.max(...rows.map((r) => r.label.length)) + 2;
  for (const { label, status, detail } of rows) {
    console.log(`${label.padEnd(width)}${status.padEnd(7)}${detail}`);
  }
  console.log('');

  if (blocking === 0) {
    console.log('Ready.\n');
    console.log('Arrancá el worker con:  sudo systemctl start grows-agent\n');
    return 0;
  }
  console.log(`${blocking} verificación(es) bloqueante(s). Resolvelas antes de arrancar el servicio.\n`);
  return 1;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((error) => {
    console.error(`\nEl diagnóstico falló: ${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  });
