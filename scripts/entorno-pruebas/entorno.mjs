// Carga y valida el entorno de pruebas. Todo script de preparación o simulación pasa por acá:
// si la URL no es local, se niega a correr (aislamiento de producción).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const leer = (ruta) => Object.fromEntries(readFileSync(ruta, 'utf8').split('\n').filter((l) => l && !l.startsWith('#') && l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));

export function cargarEntorno() {
  const archivo = resolve(RAIZ, 'apps/web/.env.pruebas.local');
  if (!existsSync(archivo)) throw new Error('Falta apps/web/.env.pruebas.local. Corré: node scripts/entorno-pruebas/claves.mjs');
  const env = leer(archivo);
  const api = env.SUPABASE_URL;
  const web = process.env.PRUEBAS_WEB_URL || env.PRUEBAS_WEB_URL;
  for (const url of [api, web]) {
    const host = new URL(url).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') throw new Error(`Entorno rechazado: ${url} no es local. La simulación solo corre contra la instancia de pruebas.`);
  }
  if (env.GROWS_ENTORNO !== 'pruebas') throw new Error('GROWS_ENTORNO debe ser "pruebas".');
  return { env, api, web, anon: env.SUPABASE_ANON_KEY, service: env.SUPABASE_SERVICE_ROLE_KEY, db: env.PRUEBAS_DATABASE_URL,
    identidades: resolve(RAIZ, 'supabase/pruebas/.env.identidades.json') };
}

/** Cliente ADMINISTRATIVO (service role). Solo para preparación y limpieza; las acciones de la simulación no lo usan. */
export function admin(entorno) {
  const headers = { apikey: entorno.service, Authorization: `Bearer ${entorno.service}`, 'Content-Type': 'application/json' };
  const pedir = async (ruta, init = {}) => {
    const res = await fetch(entorno.api + ruta, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
    const texto = await res.text();
    const cuerpo = texto ? JSON.parse(texto) : null;
    if (!res.ok) throw new Error(`admin ${init.method ?? 'GET'} ${ruta} → ${res.status} ${texto.slice(0, 300)}`);
    return cuerpo;
  };
  return {
    pedir,
    rest: (tabla, query = '') => pedir(`/rest/v1/${tabla}${query}`),
    upsert: (tabla, filas, conflicto) => pedir(`/rest/v1/${tabla}${conflicto ? `?on_conflict=${conflicto}` : ''}`, { method: 'POST', body: JSON.stringify(filas),
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }),
    rpc: (fn, args) => pedir(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
  };
}

/** Limpieza selectiva de una obra simulada: archivos de evidencia en Storage + registros (función sim_limpiar_obra). */
export async function limpiarObra(a, obraId) {
  const objetos = await a.pedir(`/rest/v1/objects?select=name&bucket_id=eq.evidencias-obra&name=like.${obraId}/*`, { headers: { 'Accept-Profile': 'storage' } });
  if (objetos.length) await a.pedir('/storage/v1/object/evidencias-obra', { method: 'DELETE', body: JSON.stringify({ prefixes: objetos.map((o) => o.name) }) });
  return { ...(await a.rpc('sim_limpiar_obra', { p_obra: obraId })), evidencias_borradas: objetos.length };
}
/** Archivos de evidencia cuya obra ya no existe (restos de limpiezas anteriores). */
export async function limpiarEvidenciasHuerfanas(a) {
  const objetos = await a.pedir('/rest/v1/objects?select=name&bucket_id=eq.evidencias-obra', { headers: { 'Accept-Profile': 'storage' } });
  const obras = new Set((await a.rest('obras', '?select=id')).map((o) => o.id));
  const huerfanos = objetos.map((o) => o.name).filter((n) => !obras.has(n.split('/')[0]));
  if (huerfanos.length) await a.pedir('/storage/v1/object/evidencias-obra', { method: 'DELETE', body: JSON.stringify({ prefixes: huerfanos }) });
  return huerfanos.length;
}
