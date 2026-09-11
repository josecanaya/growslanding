import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { childEnvironment } from '../../scripts/grows-bridge.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => readFile(path.join(here, name), 'utf8');

// Rutas que deben coincidir entre el unit, el instalador y los atajos.
// Si alguien cambia una y olvida la otra, el servicio arranca y falla en la VM.
const APP_DIR = '/opt/grows-agent';
const CONF_FILE = '/etc/grows-agent/grows-agent.env';
const AGENT_USER = 'grows-agent';
const AGENT_HOME = '/home/grows-agent';

test('el entorno del agente conserva HOME/USER en Linux y nunca lleva el token', () => {
  const env = childEnvironment({
    PATH: '/home/grows-agent/.local/bin:/usr/bin',
    HOME: AGENT_HOME,
    USER: AGENT_USER,
    GROWS_BRIDGE_TOKEN: 'a'.repeat(64),
    GROWS_BRIDGE_URL: 'https://app.grows.com.ar',
    ANTHROPIC_API_KEY: 'sk-secreto',
    AWS_SECRET_ACCESS_KEY: 'secreto',
  });

  // Claude necesita HOME para encontrar ~/.claude; sin esto el worker no lo detecta.
  assert.equal(env.HOME, AGENT_HOME, 'HOME debe llegar al CLI');
  assert.equal(env.USER, AGENT_USER, 'USER debe llegar al CLI');
  assert.match(env.PATH, /\.local\/bin/, 'PATH debe conservar ~/.local/bin');

  // Credenciales del puente y de terceros: nunca al subproceso.
  assert.equal(env.GROWS_BRIDGE_TOKEN, undefined, 'el token del puente no puede filtrarse');
  assert.equal(env.GROWS_BRIDGE_URL, undefined, 'la URL del puente no se pasa al agente');
  assert.equal(env.ANTHROPIC_API_KEY, undefined, 'no se inyectan API keys');
  assert.equal(env.AWS_SECRET_ACCESS_KEY, undefined, 'no se filtran credenciales de AWS');
});

test('todos los archivos de la POC existen', () => {
  for (const file of [
    'README.md',
    'install-ubuntu.sh',
    'grows-agent.service',
    'grows-agent.env.example',
    'cloud-agent-check.mjs',
    'check.sh',
    'pair-from-link.sh',
  ]) {
    assert.equal(existsSync(path.join(here, file)), true, `falta ${file}`);
  }
});

test('el unit de systemd corre como grows-agent, no como root', async () => {
  const unit = await read('grows-agent.service');
  assert.match(unit, /^User=grows-agent$/m, 'debe correr como grows-agent');
  assert.match(unit, new RegExp(`^Environment=HOME=${AGENT_HOME}$`, 'm'), 'HOME explícito');
  assert.match(unit, new RegExp(`^EnvironmentFile=${CONF_FILE}$`, 'm'), 'config fuera del unit');
  assert.match(unit, new RegExp(`ExecStart=\\S*node ${APP_DIR}/grows-bridge\\.mjs`), 'ExecStart al worker');

  // El PATH del servicio debe incluir donde el instalador nativo deja el binario.
  assert.match(unit, /Environment=PATH=.*\.local\/bin/, 'PATH con ~/.local/bin');

  // El token jamás puede vivir en el unit: los units son world-readable.
  assert.doesNotMatch(unit, /GROWS_BRIDGE_TOKEN=\S/, 'el unit no puede traer el token');

  // Hardening que rompería el acceso a las credenciales de Claude.
  assert.doesNotMatch(unit, /^ProtectHome=(?!false)/m, 'ProtectHome rompería ~/.claude');
  assert.doesNotMatch(unit, /^ProtectSystem=strict/m, 'ProtectSystem=strict rompería el auto-update');

  assert.match(unit, /^Restart=on-failure$/m, 'debe reiniciarse ante fallos');
  assert.match(unit, /^KillSignal=SIGTERM$/m, 'SIGTERM para cierre limpio');
  assert.match(unit, /^WantedBy=multi-user\.target$/m, 'debe arrancar al boot');
});

test('el instalador usa las mismas rutas que el unit', async () => {
  const install = await read('install-ubuntu.sh');
  assert.match(install, new RegExp(`AGENT_USER="${AGENT_USER}"`), 'mismo usuario');
  // El script interpola (/home/${AGENT_USER}); aceptamos esa forma y la literal.
  assert.match(install, /AGENT_HOME="(\/home\/\$\{AGENT_USER\}|\/home\/grows-agent)"/, 'mismo HOME');
  assert.match(install, new RegExp(`APP_DIR="${APP_DIR}"`), 'mismo directorio de app');
  assert.match(install, /CONF_DIR="\/etc\/grows-agent"/, 'mismo directorio de config');
  assert.match(install, /CONF_FILE="\$\{CONF_DIR\}\/grows-agent\.env"/, 'misma config');

  assert.match(install, /set -euo pipefail/, 'fail-fast');
  assert.match(install, /chmod 0640 "\$CONF_FILE"/, 'config no world-readable');
  assert.match(install, /chown root:"\$AGENT_USER" "\$CONF_FILE"/, 'config root:grows-agent');

  // Claude se instala como grows-agent para que su sesión quede en el HOME correcto.
  assert.match(install, /sudo -iu "\$AGENT_USER" bash -lc 'curl -fsSL https:\/\/claude\.ai\/install\.sh \| bash'/,
    'Claude se instala como grows-agent con el comando oficial');

  // El instalador no debe arrancar el servicio: falta login y config.
  // Buscamos la EJECUCIÓN (línea que empieza con el comando), no las menciones
  // dentro de printf, que sí son legítimas como instrucción para el usuario.
  assert.doesNotMatch(install, /^\s*systemctl start\b/m, 'no debe arrancar el servicio solo');
  assert.match(install, /^\s*systemctl enable\b/m, 'sí debe habilitarlo para el boot');
});

test('los atajos apuntan al mismo lugar que el instalador', async () => {
  for (const file of ['check.sh', 'pair-from-link.sh']) {
    const script = await read(file);
    assert.match(script, /set -euo pipefail/, `${file} debe ser fail-fast`);
    assert.match(script, new RegExp(`AGENT_USER="${AGENT_USER}"`), `${file}: mismo usuario`);
  }
  const check = await read('check.sh');
  assert.match(check, new RegExp(`APP_DIR="${APP_DIR}"`), 'check.sh: mismo APP_DIR');
  assert.match(check, new RegExp(`CONF_FILE="${CONF_FILE}"`), 'check.sh: misma config');
  // Fuerza HOME al invocar: sin esto el diagnóstico miraría el HOME de root.
  assert.match(check, /HOME="\/home\/\$\{AGENT_USER\}"/, 'check.sh: HOME explícito');
});

test('el diagnóstico no imprime el token ni reclama jobs', async () => {
  const source = await read('cloud-agent-check.mjs');

  // Nunca debe existir un console.log que vuelque el token.
  assert.doesNotMatch(source, /console\.log\([^)]*\btoken\b(?!.*64 hex)/i,
    'el diagnóstico no puede imprimir el token');
  assert.match(source, /presente \(64 hex\)/, 'solo informa la forma del token');

  // Debe verificar el device con una acción inválida, sin tocar la cola.
  assert.match(source, /action: '__diagnostico__'/, 'usa una acción que el server rechaza por esquema');
  assert.doesNotMatch(source, /action:\s*'claim'/, 'no debe reclamar jobs');
  assert.doesNotMatch(source, /action:\s*'complete'/, 'no debe completar jobs');

  // Reutiliza el bridge en vez de reimplementar la detección.
  assert.match(source, /grows-bridge\.mjs/, 'importa el bridge real');
  assert.match(source, /detectCapabilities/, 'reutiliza detectCapabilities');
  assert.match(source, /fetchAgentContext/, 'reutiliza fetchAgentContext');
});

test('el diagnóstico corre y detecta configuración faltante sin filtrar nada', async () => {
  const { spawnSync } = await import('node:child_process');
  // Sin URL ni token: debe salir 1 y explicar qué falta, sin romperse.
  const result = spawnSync(process.execPath, [path.join(here, 'cloud-agent-check.mjs')], {
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, GROWS_BRIDGE_URL: '', GROWS_BRIDGE_TOKEN: '' },
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  assert.match(output, /Grows Cloud Worker/, 'imprime el encabezado');
  assert.match(output, /GROWS_BRIDGE_URL no está definida/, 'reporta la URL faltante');
  assert.match(output, /GROWS_BRIDGE_TOKEN no está definido/, 'reporta el token faltante');
  assert.equal(result.status, 1, 'sale con código 1 cuando falta configuración');
});

test('el .env de ejemplo no trae secretos reales', async () => {
  const example = await read('grows-agent.env.example');
  assert.match(example, /^GROWS_BRIDGE_URL=/m);
  assert.match(example, /^GROWS_BRIDGE_TOKEN=/m);
  // El placeholder no puede parecerse a un token válido de 64 hex.
  const token = example.match(/^GROWS_BRIDGE_TOKEN=(.*)$/m)?.[1] ?? '';
  assert.doesNotMatch(token, /^[a-f0-9]{64}$/, 'el ejemplo no puede contener un token real');
});

test('el README documenta los tres tests de persistencia', async () => {
  const readme = await read('README.md');
  for (const marker of ['TEST A', 'TEST B', 'TEST C']) {
    assert.ok(readme.includes(marker), `el README debe incluir ${marker}`);
  }
  // El paso crítico: el login debe hacerse como grows-agent.
  assert.match(readme, /sudo -iu grows-agent/, 'documenta el login con el usuario correcto');
  assert.ok(readme.includes('Terminate'), 'advierte sobre Terminate y la pérdida del disco');
});
