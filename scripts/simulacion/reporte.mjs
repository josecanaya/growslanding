// Reporte de una corrida: lee el diario JSONL y produce JSON + Markdown.
// Distingue aprobado / fallido / bloqueado / no_probado y separa los pasos de producto de los de prueba.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DIR_ESTADO, leerJson, ordenarPasos, rutaEstado } from './motor.mjs';

export function leerDiario(corrida) {
  const ruta = resolve(DIR_ESTADO, 'corridas', `${corrida}.jsonl`);
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function armarReporte(corrida, escenarios, meta = {}) {
  const lineas = leerDiario(corrida);
  const porEscenario = escenarios.map((e) => {
    const estado = leerJson(rutaEstado(e.clave), { pasos: {}, vars: {} });
    const pasos = ordenarPasos(e.pasos(estado.semilla ?? meta.semilla ?? 1));
    const propias = lineas.filter((l) => l.escenario === e.clave);
    const cuenta = { aprobado: 0, fallido: 0, bloqueado: 0, no_probado: 0 };
    const filas = pasos.map((p) => {
      const enCorrida = propias.filter((l) => l.paso === p.id).pop();
      const acumulado = estado.pasos[p.id]?.resultado;
      // Estado acumulado del recorrido: lo que nunca se ejecutó (o quedó iniciado) es "no probado".
      const resultado = acumulado === 'aprobado' ? 'aprobado' : acumulado === 'fallido' ? 'fallido' : acumulado === 'bloqueado' ? 'bloqueado' : 'no_probado';
      cuenta[resultado]++;
      return { paso: p.id, dia: p.dia, actor: p.actor, accion: p.accion, tipo: p.tipo, resultado, en_esta_corrida: Boolean(enCorrida), retomado: enCorrida?.retomado ?? false,
        id_registro: enCorrida?.id_registro ?? estado.pasos[p.id]?.id ?? null, corrida_origen: estado.pasos[p.id]?.corrida ?? null, error: estado.pasos[p.id]?.error ?? null };
    });
    return { escenario: e.clave, nombre: e.nombre, obra: estado.vars?.obra ?? null, semilla: estado.semilla ?? null, corridas: estado.corridas ?? [], total: pasos.length, acumulado: cuenta,
      ejecutados_en_corrida: propias.length, retomados_en_corrida: propias.filter((l) => l.retomado).length, completo: cuenta.aprobado === pasos.length, pasos: filas };
  });
  return { corrida, generado_at: new Date().toISOString(), ...meta, total_lineas: lineas.length, escenarios: porEscenario, diario: lineas };
}

export function reporteMarkdown(r) {
  const icono = { aprobado: '✅', fallido: '❌', bloqueado: '⛔', no_probado: '⬜' };
  let md = `# Corrida ${r.corrida}\n\n`;
  md += `- Generado: ${r.generado_at}\n- Versión del código: \`${r.version ?? '—'}\`\n- Semilla: ${r.semilla ?? '—'}\n- Instancia: ${r.instancia ?? '—'}\n- Tiempo simulado hasta el día: ${r.hasta_dia ?? '—'}\n`;
  if (r.interrupcion) md += `- **Corrida interrumpida a propósito en** \`${r.interrupcion}\` (la siguiente la retoma)\n`;
  md += `\n| Escenario | Obra | Ejecutados en esta corrida | Retomados | ✅ aprobado | ❌ fallido | ⛔ bloqueado | ⬜ no probado | Completo |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const e of r.escenarios) md += `| ${e.nombre} | \`${e.obra ?? '—'}\` | ${e.ejecutados_en_corrida} | ${e.retomados_en_corrida} | ${e.acumulado.aprobado} | ${e.acumulado.fallido} | ${e.acumulado.bloqueado} | ${e.acumulado.no_probado} | ${e.completo ? 'sí' : 'no'} |\n`;
  md += `\nLos conteos por resultado son **acumulados** del recorrido (todas las corridas); «no probado» son pasos que todavía no se ejecutaron.\n`;
  md += `Tipos de paso: \`producto\` = acción normal de un rol · \`permiso\`, \`validacion\`, \`concurrencia\`, \`idempotencia\`, \`recuperacion\` = pruebas que esperan un rechazo o un comportamiento · \`auditoria\` = relectura de lo persistido.\n`;
  for (const e of r.escenarios) {
    md += `\n## ${e.nombre}\n\nObra \`${e.obra ?? '—'}\` · semilla ${e.semilla ?? '—'} · corridas: ${e.corridas.join(', ') || '—'}\n\n`;
    md += `| | Día | Actor | Acción | Tipo | ID del registro | Corrida |\n|---|---|---|---|---|---|---|\n`;
    for (const p of e.pasos) md += `| ${icono[p.resultado]} | ${p.dia} | ${p.actor} | ${p.accion}${p.retomado ? ' **(retomado)**' : ''}${p.error ? ` — ${p.error.slice(0, 160)}` : ''} | ${p.tipo} | ${p.id_registro ? `\`${p.id_registro}\`` : '—'} | ${p.corrida_origen ?? '—'}${p.en_esta_corrida ? ' ●' : ''} |\n`;
  }
  md += `\n● = ejecutado en esta corrida.\n`;
  return md;
}

export function escribirReporte(reporte, carpeta) {
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(resolve(carpeta, 'reporte.json'), JSON.stringify(reporte, null, 2));
  writeFileSync(resolve(carpeta, 'reporte.md'), reporteMarkdown(reporte));
  writeFileSync(resolve(carpeta, 'diario.jsonl'), reporte.diario.map((l) => JSON.stringify(l)).join('\n') + '\n');
  return carpeta;
}
