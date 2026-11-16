#!/usr/bin/env node
// Ejecutor de simulación de GROWS. Uso:
//   node scripts/simulacion/ejecutor.mjs corrida [--escenarios vivienda,edificio,fallas] [--hasta-dia N | --avanzar N]
//                                               [--semilla N] [--interrumpir-en escenario:paso] [--id nombre]
//   node scripts/simulacion/ejecutor.mjs estado | pausar | reanudar
//   node scripts/simulacion/ejecutor.mjs limpiar --escenario vivienda | --todo        (administrativo: borra la obra simulada)
//   node scripts/simulacion/ejecutor.mjs reporte --corrida <id>
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { admin, cargarEntorno, RAIZ } from '../entorno-pruebas/entorno.mjs';
import { abrirDiario, abrirSesiones, DIR, DIR_ESTADO, ejecutarEscenario, guardarJson, leerJson, ordenarPasos, rutaControl, rutaEstado, version } from './motor.mjs';
import { armarReporte, escribirReporte } from './reporte.mjs';

const CONFIG = leerJson(resolve(DIR, 'config.json'), {});
export async function cargarEscenarios(claves) {
  const todas = ['vivienda', 'edificio', 'fallas'];
  const out = [];
  for (const clave of (claves?.length ? claves : todas)) {
    if (!todas.includes(clave)) throw new Error(`Escenario desconocido: ${clave}`);
    if (existsSync(resolve(DIR, 'escenarios', `${clave}.mjs`))) out.push((await import(`./escenarios/${clave}.mjs`)).default);
  }
  return out;
}
const args = process.argv.slice(2);
const opcion = (nombre) => { const i = args.indexOf(`--${nombre}`); return i >= 0 ? args[i + 1] ?? true : undefined; };

export async function corrida({ escenarios: claves, hastaDia, avanzar, semilla = CONFIG.semilla ?? 1, interrumpirEn, id, origen = 'manual' } = {}) {
  const entorno = cargarEntorno();
  const salud = await fetch(entorno.web + '/api/inversion/posicion').catch(() => null);
  if (!salud || salud.status !== 401) throw new Error(`La app de pruebas no responde en ${entorno.web} (esperaba 401 sin sesión, hubo ${salud?.status ?? 'sin respuesta'}). Levantala con scripts/entorno-pruebas/web.sh`);
  if (leerJson(rutaControl(), {}).pausado) { console.log('El ejecutor está en pausa (reanudar para continuar).'); return { pausado: true }; }
  const escenarios = await cargarEscenarios(claves);
  const corridaId = id ?? `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}-${origen}`;
  const diario = abrirDiario(corridaId);
  const sesiones = abrirSesiones(entorno);
  const [esc, pasoCorte] = String(interrumpirEn ?? '').split(':');
  console.log(`Corrida ${corridaId} · versión ${version()} · semilla ${semilla} · instancia ${entorno.web}`);
  const resumenes = [];
  for (const escenario of escenarios) {
    const previo = leerJson(rutaEstado(escenario.clave), null);
    const limite = hastaDia ?? ((previo?.dia_actual ?? -1) + Number(avanzar ?? CONFIG.dias_por_corrida ?? 30));
    console.log(`\n▶ ${escenario.nombre} (hasta el día simulado ${limite}${previo ? `, retoma desde el día ${previo.dia_actual ?? 0}` : ''})`);
    const r = await ejecutarEscenario(escenario, { entorno, sesiones, corrida: corridaId, semilla: previo?.semilla ?? Number(semilla), hastaDia: Number(limite),
      interrumpirEn: esc === escenario.clave ? pasoCorte : undefined, registrar: diario.registrar });
    resumenes.push({ ...r, hasta_dia: limite });
    console.log(`  ${r.ejecutados} ejecutados (${r.retomados} retomados) · ${r.aprobado} ✓ · ${r.fallido} ✗ · ${r.bloqueado} ■ · pendientes ${r.pendientes}/${r.total}${r.detenido ? ` · detenido: ${r.detenido}` : ''}`);
  }
  const reporte = armarReporte(corridaId, escenarios, { version: version(), semilla: Number(semilla), instancia: entorno.web, origen, hasta_dia: hastaDia ?? `+${avanzar ?? CONFIG.dias_por_corrida ?? 30}`, resumenes });
  const carpeta = escribirReporte(reporte, resolve(DIR_ESTADO, 'reportes', corridaId));
  console.log(`\nReporte: ${carpeta}/reporte.md`);
  return { corrida: corridaId, resumenes, carpeta, ok: resumenes.every((r) => r.fallido === 0 && r.bloqueado === 0) };
}

async function limpiar() {
  const entorno = cargarEntorno();
  const a = admin(entorno); // acceso administrativo: solo preparación y limpieza
  const claves = opcion('todo') ? ['vivienda', 'edificio', 'fallas'] : [opcion('escenario')].filter((x) => typeof x === 'string');
  if (!claves.length) throw new Error('Indicá --escenario <clave> o --todo');
  for (const clave of claves) {
    const estado = leerJson(rutaEstado(clave), null);
    if (estado?.vars?.obra) console.log(clave, JSON.stringify(await a.rpc('sim_limpiar_obra', { p_obra: estado.vars.obra })));
    rmSync(rutaEstado(clave), { force: true });
    console.log(`Estado local de ${clave} borrado.`);
  }
}

const comando = args[0];
if (process.argv[1]?.endsWith('ejecutor.mjs')) {
  try {
    if (comando === 'corrida') {
      const r = await corrida({ escenarios: typeof opcion('escenarios') === 'string' ? opcion('escenarios').split(',') : undefined, hastaDia: opcion('hasta-dia') !== undefined ? Number(opcion('hasta-dia')) : undefined,
        avanzar: opcion('avanzar'), semilla: opcion('semilla') ?? undefined, interrumpirEn: opcion('interrumpir-en'), id: typeof opcion('id') === 'string' ? opcion('id') : undefined });
      process.exit(r.ok || r.pausado ? 0 : 1);
    } else if (comando === 'pausar' || comando === 'reanudar') {
      guardarJson(rutaControl(), { ...leerJson(rutaControl(), {}), pausado: comando === 'pausar', cambiado_at: new Date().toISOString() });
      console.log(comando === 'pausar' ? 'Ejecutor en pausa: la corrida en curso se detiene antes del próximo paso y el programador no dispara.' : 'Ejecutor reanudado.');
    } else if (comando === 'estado') {
      console.log('control:', JSON.stringify(leerJson(rutaControl(), { pausado: false })));
      for (const e of await cargarEscenarios()) {
        const s = leerJson(rutaEstado(e.clave), null);
        const pasos = ordenarPasos(e.pasos(s?.semilla ?? 1));
        const ok = pasos.filter((p) => s?.pasos[p.id]?.resultado === 'aprobado').length;
        const pendiente = pasos.find((p) => s?.pasos[p.id]?.resultado !== 'aprobado');
        console.log(`${e.clave.padEnd(9)} ${s ? `obra ${s.vars.obra ?? '—'} · semilla ${s.semilla} · día simulado ${s.dia_actual ?? 0} · ${ok}/${pasos.length} aprobados · próximo: ${pendiente ? `${pendiente.id} (día ${pendiente.dia}${s.pasos[pendiente.id] ? ', ' + s.pasos[pendiente.id].resultado : ''})` : 'completo'} · corridas: ${s.corridas.length}` : 'sin iniciar'}`);
      }
    } else if (comando === 'limpiar') {
      await limpiar();
    } else if (comando === 'reporte') {
      const id = opcion('corrida') ?? readdirSync(resolve(DIR_ESTADO, 'corridas')).sort().pop()?.replace('.jsonl', '');
      const reporte = armarReporte(id, await cargarEscenarios(), { version: version() });
      console.log(escribirReporte(reporte, resolve(typeof opcion('salida') === 'string' ? resolve(RAIZ, opcion('salida')) : resolve(DIR_ESTADO, 'reportes', id))));
    } else {
      console.log('Comandos: corrida | estado | pausar | reanudar | limpiar | reporte (ver encabezado de este archivo)');
    }
  } catch (e) { console.error('ERROR:', e.message); process.exit(2); }
}
