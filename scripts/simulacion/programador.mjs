#!/usr/bin/env node
// Programador de corridas. Lee scripts/simulacion/config.json (horarios y zona horaria configurables;
// por defecto 09:00 y 18:00 de America/Argentina/Buenos_Aires) y dispara una corrida acumulativa en cada horario.
//   node scripts/simulacion/programador.mjs              → queda corriendo (requiere programador.activo = true)
//   node scripts/simulacion/programador.mjs --proximas   → muestra los próximos disparos y sale
//   node scripts/simulacion/programador.mjs --una-vez    → dispara ahora una corrida "programada" y sale
// Respeta la pausa manual (ejecutor.mjs pausar) y nunca superpone dos corridas.
import { resolve } from 'node:path';
import { corrida } from './ejecutor.mjs';
import { DIR, DIR_ESTADO, guardarJson, leerJson } from './motor.mjs';

const rutaEstado = resolve(DIR_ESTADO, 'programador.json');
const config = () => leerJson(resolve(DIR, 'config.json'), {}).programador ?? {};

/** Hora de pared en una zona horaria, sin dependencias. */
function enZona(fecha, zona) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(fecha).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}
/** Próximos disparos: recorre minuto a minuto (correcto ante cambios de horario de la zona). */
export function proximosDisparos(desde, { horarios = ['09:00', '18:00'], zona_horaria: zona = 'America/Argentina/Buenos_Aires' } = {}, cuantos = 4) {
  const out = [];
  const t = new Date(Math.ceil((desde.getTime() + 1) / 60000) * 60000);
  for (let i = 0; i < 60 * 24 * 8 && out.length < cuantos; i++, t.setTime(t.getTime() + 60000)) {
    const z = enZona(t, zona);
    if (horarios.includes(z.hora)) out.push({ utc: t.toISOString(), local: `${z.dia} ${z.hora} (${zona})` });
  }
  return out;
}
const anotar = (cambios) => guardarJson(rutaEstado, { ...leerJson(rutaEstado, { historial: [] }), ...cambios, actualizado_at: new Date().toISOString() });

async function disparar(motivo) {
  const c = config();
  const inicio = new Date().toISOString();
  let resultado;
  try { resultado = await corrida({ escenarios: c.escenarios, origen: 'programada' }); }
  catch (e) { resultado = { error: e.message }; }
  const previo = leerJson(rutaEstado, { historial: [] });
  anotar({ historial: [...previo.historial, { motivo, inicio, fin: new Date().toISOString(), corrida: resultado.corrida ?? null, ok: resultado.ok ?? false, pausado: resultado.pausado ?? false, error: resultado.error ?? null,
    resumen: (resultado.resumenes ?? []).map((r) => ({ escenario: r.escenario, ejecutados: r.ejecutados, aprobado: r.aprobado, fallido: r.fallido, bloqueado: r.bloqueado, pendientes: r.pendientes })) }].slice(-50) });
  console.log(`[programador] ${motivo}: ${resultado.error ? 'ERROR ' + resultado.error : resultado.pausado ? 'en pausa, no se ejecutó' : `corrida ${resultado.corrida} ${resultado.ok ? 'sin fallas' : 'con fallas'}`}`);
}

if (process.argv[1]?.endsWith('programador.mjs')) {
  const c = config();
  if (process.argv.includes('--proximas')) {
    console.log(JSON.stringify({ activo: Boolean(c.activo), horarios: c.horarios, zona_horaria: c.zona_horaria, proximos: proximosDisparos(new Date(), c) }, null, 2));
  } else if (process.argv.includes('--una-vez')) {
    await disparar('disparo manual del programador');
  } else {
    if (!c.activo) { console.error('El programador está inactivo (config.json → programador.activo = false). Activarlo solo después de verificar las corridas autenticadas.'); process.exit(3); }
    anotar({ pid: process.pid, iniciado_at: new Date().toISOString(), horarios: c.horarios, zona_horaria: c.zona_horaria });
    console.log(`[programador] activo (pid ${process.pid}) · ${c.horarios.join(' y ')} ${c.zona_horaria}`);
    let ocupado = false;
    for (;;) {
      const actual = config();
      if (!actual.activo) { console.log('[programador] desactivado por configuración: termina.'); anotar({ pid: null, detenido_at: new Date().toISOString() }); break; }
      const [proximo] = proximosDisparos(new Date(), actual, 1);
      anotar({ proximo });
      await new Promise((r) => setTimeout(r, Math.min(Math.max(Date.parse(proximo.utc) - Date.now(), 0), 30_000)));
      if (Date.now() >= Date.parse(proximo.utc) && !ocupado) { ocupado = true; await disparar(`horario ${proximo.local}`); ocupado = false; }
    }
  }
}
