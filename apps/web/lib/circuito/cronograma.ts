// Cronograma determinista de obra: precedencias fin-inicio con demora, recursos compartidos,
// compras e inspecciones con fecha, reprogramación y avance real. Días corridos.
// Función pura: mismo input ⇒ mismo plan.

export type TareaPlan = {
  id: string;
  duracion: number;
  avance?: number | null; // % aceptado
  inicioReal?: string | null; // YYYY-MM-DD
  finReal?: string | null;
};
export type Precedencia = { tarea: string; dependeDe: string; lag?: number | null };
export type Restriccion = {
  tarea: string;
  tipo: 'recurso' | 'compra' | 'inspeccion';
  recursoClave?: string | null;
  fechaDisponible?: string | null;
  estado?: 'pendiente' | 'cumplida';
};
export type EntradaCronograma = {
  fechaInicio: string;
  tareas: TareaPlan[];
  precedencias: Precedencia[];
  restricciones?: Restriccion[];
  /** Hoy (real o simulado): lo no iniciado no puede empezar antes. */
  fechaCorte?: string | null;
  /** Reprogramación: lo no iniciado no empieza antes de esta fecha. */
  noAntesDe?: string | null;
};
export type TareaCalculada = {
  id: string; es: number; ef: number; ls: number; lf: number; holgura: number; critica: boolean;
  inicio: string; fin: string; duracion: number; motivoInicio: string;
};
export type Cronograma = { tareas: TareaCalculada[]; duracionTotal: number; fin: string; rutaCritica: string[] };

const DIA = 86_400_000;
export const aDia = (fecha: string, origen: string) => Math.round((Date.parse(fecha.slice(0, 10)) - Date.parse(origen.slice(0, 10))) / DIA);
export const sumarDias = (fecha: string, dias: number) => new Date(Date.parse(fecha.slice(0, 10)) + dias * DIA).toISOString().slice(0, 10);

export function calcularCronograma(entrada: EntradaCronograma): Cronograma {
  const { fechaInicio } = entrada;
  const orden = new Map(entrada.tareas.map((t, i) => [t.id, i]));
  const tareas = new Map(entrada.tareas.map((t) => [t.id, t]));
  const preds = new Map<string, Precedencia[]>();
  const succs = new Map<string, Precedencia[]>();
  for (const p of entrada.precedencias) {
    if (!tareas.has(p.tarea) || !tareas.has(p.dependeDe)) continue;
    preds.set(p.tarea, [...(preds.get(p.tarea) ?? []), p]);
    succs.set(p.dependeDe, [...(succs.get(p.dependeDe) ?? []), p]);
  }
  const restricciones = entrada.restricciones ?? [];
  const corte = entrada.fechaCorte ? aDia(entrada.fechaCorte, fechaInicio) : null;
  const noAntes = entrada.noAntesDe ? aDia(entrada.noAntesDe, fechaInicio) : null;

  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  const motivo = new Map<string, string>();
  const recursoLibre = new Map<string, number>();
  // Sucesor implícito por recurso compartido (para el cálculo de holguras).
  const recursoSiguiente = new Map<string, string[]>();
  const recursoUltima = new Map<string, string>();

  const tentativa = (t: TareaPlan): [number, string] => {
    if (t.inicioReal) return [aDia(t.inicioReal, fechaInicio), 'inicio real'];
    let inicio = 0;
    let por = 'inicio de obra';
    const subir = (valor: number, causa: string) => { if (valor > inicio) { inicio = valor; por = causa; } };
    for (const p of preds.get(t.id) ?? []) subir((ef.get(p.dependeDe) ?? 0) + (p.lag ?? 0), 'predecesora');
    for (const r of restricciones) {
      if (r.tarea !== t.id) continue;
      if (r.tipo === 'recurso' && r.recursoClave) subir(recursoLibre.get(r.recursoClave) ?? 0, `recurso compartido (${r.recursoClave})`);
      else if (r.fechaDisponible && r.estado !== 'cumplida') subir(aDia(r.fechaDisponible, fechaInicio), r.tipo);
    }
    if (corte !== null) subir(corte, 'fecha de corte');
    if (noAntes !== null) subir(noAntes, 'reprogramación');
    return [inicio, por];
  };

  const pendientes = new Set(tareas.keys());
  while (pendientes.size) {
    const listas = [...pendientes].filter((id) => (preds.get(id) ?? []).every((p) => ef.has(p.dependeDe)));
    if (!listas.length) throw new Error('El cronograma tiene dependencias circulares');
    const candidatas = listas.map((id) => ({ id, t: tentativa(tareas.get(id)!) }))
      .sort((a, b) => a.t[0] - b.t[0] || orden.get(a.id)! - orden.get(b.id)!);
    const { id, t: [inicio, por] } = candidatas[0];
    const tarea = tareas.get(id)!;
    const duracion = Math.max(1, Math.round(tarea.duracion));
    let fin = inicio + duracion;
    if (tarea.finReal) fin = aDia(tarea.finReal, fechaInicio) + 1;
    else if (tarea.inicioReal && corte !== null) {
      // En curso: lo que falta se proyecta desde la fecha de corte.
      const restante = Math.ceil(duracion * (1 - Math.min(100, tarea.avance ?? 0) / 100));
      fin = Math.max(fin, corte + restante);
    }
    es.set(id, inicio); ef.set(id, fin); motivo.set(id, por);
    for (const r of restricciones) {
      if (r.tarea !== id || r.tipo !== 'recurso' || !r.recursoClave) continue;
      const previa = recursoUltima.get(r.recursoClave);
      if (previa) recursoSiguiente.set(previa, [...(recursoSiguiente.get(previa) ?? []), id]);
      recursoUltima.set(r.recursoClave, id);
      recursoLibre.set(r.recursoClave, Math.max(recursoLibre.get(r.recursoClave) ?? 0, fin));
    }
    pendientes.delete(id);
  }

  const duracionTotal = Math.max(0, ...ef.values());
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();
  const inverso = [...tareas.keys()].sort((a, b) => ef.get(b)! - ef.get(a)! || es.get(b)! - es.get(a)! || orden.get(b)! - orden.get(a)!);
  for (const id of inverso) {
    let limite = duracionTotal;
    for (const s of succs.get(id) ?? []) limite = Math.min(limite, (ls.get(s.tarea) ?? duracionTotal) - (s.lag ?? 0));
    for (const s of recursoSiguiente.get(id) ?? []) limite = Math.min(limite, ls.get(s) ?? duracionTotal);
    lf.set(id, limite);
    ls.set(id, limite - (ef.get(id)! - es.get(id)!));
  }
  const calculadas = entrada.tareas.map((t): TareaCalculada => {
    const holgura = ls.get(t.id)! - es.get(t.id)!;
    return {
      id: t.id, es: es.get(t.id)!, ef: ef.get(t.id)!, ls: ls.get(t.id)!, lf: lf.get(t.id)!, holgura, critica: holgura <= 0,
      inicio: sumarDias(fechaInicio, es.get(t.id)!), fin: sumarDias(fechaInicio, ef.get(t.id)! - 1),
      duracion: ef.get(t.id)! - es.get(t.id)!, motivoInicio: motivo.get(t.id)!,
    };
  });
  return {
    tareas: calculadas, duracionTotal, fin: sumarDias(fechaInicio, Math.max(0, duracionTotal - 1)),
    rutaCritica: calculadas.filter((t) => t.critica).sort((a, b) => a.es - b.es).map((t) => t.id),
  };
}

export type PuntoCurva = { fecha: string; planificado: number; fisico: number; certificado: number; pagado: number };
/**
 * Curva S en dinero. Planificado = línea base distribuida linealmente en cada tarea.
 * Físico = avance aceptado valorizado. Certificado y pagado van aparte: son hechos distintos.
 */
export function curvaS(args: {
  lineaBase: { inicio: string; fin: string; costo: number }[];
  fisico: { fecha: string; monto: number }[];
  certificado: { fecha: string; monto: number }[];
  pagado: { fecha: string; monto: number }[];
  hasta?: string | null;
  pasoDias?: number;
}): PuntoCurva[] {
  if (!args.lineaBase.length) return [];
  const todas = [...args.lineaBase.flatMap((t) => [t.inicio, t.fin]), ...args.fisico.map((x) => x.fecha),
    ...args.certificado.map((x) => x.fecha), ...args.pagado.map((x) => x.fecha), ...(args.hasta ? [args.hasta] : [])].sort();
  const desde = todas[0];
  const fin = todas[todas.length - 1];
  const paso = args.pasoDias ?? 7;
  const acumulado = (serie: { fecha: string; monto: number }[], fecha: string) =>
    Math.round(serie.filter((x) => x.fecha <= fecha).reduce((s, x) => s + x.monto, 0) * 100) / 100;
  const puntos: PuntoCurva[] = [];
  for (let fecha = desde; ; fecha = sumarDias(fecha, paso)) {
    const f = fecha > fin ? fin : fecha;
    const planificado = args.lineaBase.reduce((s, t) => {
      const total = aDia(t.fin, t.inicio) + 1;
      const hechos = Math.min(total, Math.max(0, aDia(f, t.inicio) + 1));
      return s + (t.costo * hechos) / total;
    }, 0);
    puntos.push({ fecha: f, planificado: Math.round(planificado * 100) / 100, fisico: acumulado(args.fisico, f),
      certificado: acumulado(args.certificado, f), pagado: acumulado(args.pagado, f) });
    if (f === fin) break;
  }
  return puntos;
}
