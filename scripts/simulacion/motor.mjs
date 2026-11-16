// Motor del ejecutor: recorre los pasos de un escenario de forma determinista y deja todo persistido.
//   estado/<escenario>.json      → cursor, variables (IDs) y resultado de cada paso (permite retomar)
//   estado/corridas/<id>.jsonl   → diario de la corrida (una línea por paso ejecutado)
// Cada paso usa una clave de idempotencia estable (escenario + semilla + paso): si la corrida se corta
// después de enviar una escritura, la corrida siguiente repite el paso y la API devuelve el mismo registro.
import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sesion } from './cliente.mjs';

export const DIR = dirname(fileURLToPath(import.meta.url));
export const DIR_ESTADO = process.env.SIM_DIR_ESTADO || resolve(DIR, 'estado');
export const ACTORES = ['arquitecto', 'contratista1', 'contratista2', 'contratista3', 'inversor1', 'inversor2', 'inversor3', 'coordinador', 'auditor'];
export const RESULTADOS = ['aprobado', 'fallido', 'bloqueado', 'no_probado'];

export class Fallo extends Error {}
export const leerJson = (ruta, porDefecto) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : porDefecto);
export function guardarJson(ruta, datos) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta + '.tmp', JSON.stringify(datos, null, 2));
  renameSync(ruta + '.tmp', ruta); // escritura atómica: un corte nunca deja el estado a medias
}
export const rutaEstado = (escenario) => resolve(DIR_ESTADO, `${escenario}.json`);
export const rutaControl = () => resolve(DIR_ESTADO, 'control.json');
export const sumarDias = (fecha, dias) => new Date(Date.parse(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
export function version() {
  try { return execSync('git rev-parse --short HEAD', { cwd: DIR, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return 'sin-git'; }
}
/** PRNG determinista (mulberry32). */
export function azar(semilla) {
  let a = semilla >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hash = (s) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

/** Orden por día simulado, estable: dentro de un mismo día se respeta el orden causal en que se escribieron. */
export const ordenarPasos = (pasos) => pasos.map((p, i) => [p, i]).sort((a, b) => a[0].dia - b[0].dia || a[1] - b[1]).map(([p]) => p);

export function abrirSesiones(entorno) {
  const identidades = JSON.parse(readFileSync(entorno.identidades, 'utf8'));
  return Object.fromEntries(ACTORES.map((clave) => [clave, new Sesion(entorno, identidades[clave], clave)]));
}

/** Afirmaciones sobre respuestas de la API. */
export function exito(res, que = 'la operación') {
  if (res.status < 200 || res.status >= 300) throw new Fallo(`${que}: se esperaba éxito y respondió ${res.status} ${JSON.stringify(res.cuerpo).slice(0, 240)}`);
  return res.cuerpo;
}
export function rechazo(res, status, contiene) {
  const texto = JSON.stringify(res.cuerpo ?? '');
  if (res.status !== status) throw new Fallo(`se esperaba rechazo ${status} y respondió ${res.status} ${texto.slice(0, 240)}`);
  if (contiene && !texto.includes(contiene)) throw new Fallo(`rechazo ${status} sin el motivo esperado «${contiene}»: ${texto.slice(0, 240)}`);
  return { rechazo: status, motivo: res.cuerpo?.error ?? texto.slice(0, 200) };
}
export function afirmar(condicion, mensaje) { if (!condicion) throw new Fallo(mensaje); }

/**
 * Ejecuta un escenario hasta `hastaDia` (tiempo simulado). Devuelve el resumen de esta corrida.
 * opciones.interrumpirEn: id de paso en el que se simula la caída del proceso justo DESPUÉS de enviar la escritura.
 */
export async function ejecutarEscenario(escenario, { entorno, sesiones, corrida, semilla, hastaDia, interrumpirEn, registrar }) {
  const ruta = rutaEstado(escenario.clave);
  const estado = leerJson(ruta, { escenario: escenario.clave, semilla, inicio: escenario.inicio, vars: {}, pasos: {}, corridas: [] });
  if (estado.semilla !== semilla) throw new Error(`El escenario ${escenario.clave} ya corre con semilla ${estado.semilla}. Limpialo antes de cambiarla.`);
  if (!estado.corridas.includes(corrida)) estado.corridas.push(corrida);
  const pasos = ordenarPasos(escenario.pasos(estado.semilla));
  const duplicados = pasos.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (duplicados.length) throw new Error(`Pasos duplicados en ${escenario.clave}: ${duplicados.join(', ')}`);
  const resumen = { escenario: escenario.clave, ejecutados: 0, retomados: 0, aprobado: 0, fallido: 0, bloqueado: 0, detenido: null, completo: false };
  const ver = version();
  for (let i = 0; i < pasos.length; i++) {
    const paso = pasos[i];
    const previo = estado.pasos[paso.id];
    if (previo?.resultado === 'aprobado') continue;
    if (paso.dia > hastaDia) { resumen.detenido = `tiempo simulado: el día ${paso.dia} queda para la próxima corrida`; break; }
    if (leerJson(rutaControl(), {}).pausado) { resumen.detenido = 'pausa manual'; break; }
    const retomado = previo?.resultado === 'iniciado';
    const idem = `sim:${escenario.clave}:${estado.semilla}:${paso.id}`;
    estado.pasos[paso.id] = { resultado: 'iniciado', corrida, intentos: (previo?.intentos ?? 0) + 1, iniciado_at: new Date().toISOString() };
    guardarJson(ruta, estado);
    const ctx = {
      s: sesiones, v: estado.vars, idem, semilla: estado.semilla, entorno, retomado,
      rng: azar(estado.semilla ^ hash(paso.id)), fecha: (dia = paso.dia) => sumarDias(estado.inicio, dia),
      // Corte simulado: el proceso muere con la escritura ya enviada y sin haber anotado el resultado.
      cortarSiCorresponde: () => { if (interrumpirEn === paso.id && !retomado) { console.log(`\n⚡ Corte simulado en ${escenario.clave}:${paso.id} (escritura enviada, resultado sin anotar)`); process.exit(75); } },
    };
    // El corte también puede caer en cualquier paso: justo después de la escritura con la clave del paso.
    for (const sesion of Object.values(sesiones)) sesion.despuesDeEscribir = (clave) => { if (clave === idem) ctx.cortarSiCorresponde(); };
    let resultado = 'aprobado'; let salida = {}; let error = null;
    const t0 = Date.now();
    try { salida = (await paso.ejecutar(ctx)) ?? {}; }
    catch (e) { error = e.message; resultado = e instanceof Fallo ? 'fallido' : 'bloqueado'; }
    const siguiente = pasos[i + 1];
    const linea = {
      corrida, escenario: escenario.clave, paso: paso.id, obra: estado.vars.obra ?? null, actor: paso.actor,
      fecha_real: new Date().toISOString(), tiempo_simulado: ctx.fecha(), dia_simulado: paso.dia, version: ver, semilla: estado.semilla,
      accion: paso.accion, tipo: paso.tipo ?? 'producto', resultado, retomado, clave_idempotencia: idem,
      id_registro: salida.id ?? null, evidencia: error ? { error } : (salida.evidencia ?? null), ms: Date.now() - t0,
      siguiente_paso: resultado === 'aprobado' ? (siguiente ? siguiente.id : 'fin del escenario') : `reintentar ${paso.id}`,
    };
    registrar(linea);
    estado.pasos[paso.id] = { ...estado.pasos[paso.id], resultado, id: linea.id_registro, error, terminado_at: linea.fecha_real };
    estado.dia_actual = paso.dia;
    guardarJson(ruta, estado);
    resumen.ejecutados++; resumen[resultado]++; if (retomado) resumen.retomados++;
    if (resultado !== 'aprobado') { resumen.detenido = `${resultado} en ${paso.id}: ${error}`; break; }
  }
  resumen.completo = pasos.every((p) => estado.pasos[p.id]?.resultado === 'aprobado');
  resumen.pendientes = pasos.filter((p) => estado.pasos[p.id]?.resultado !== 'aprobado').length;
  resumen.total = pasos.length;
  resumen.obra = estado.vars.obra ?? null;
  return resumen;
}

export function abrirDiario(corrida) {
  const ruta = resolve(DIR_ESTADO, 'corridas', `${corrida}.jsonl`);
  mkdirSync(dirname(ruta), { recursive: true });
  return { ruta, registrar: (linea) => {
    appendFileSync(ruta, JSON.stringify(linea) + '\n');
    const marca = { aprobado: '✓', fallido: '✗', bloqueado: '■' }[linea.resultado];
    console.log(`  ${marca} [${linea.escenario} d${String(linea.dia_simulado).padStart(3)}] ${linea.actor.padEnd(12)} ${linea.accion}${linea.retomado ? ' (retomado)' : ''}${linea.resultado === 'aprobado' ? '' : ' → ' + linea.evidencia.error}`);
  } };
}
