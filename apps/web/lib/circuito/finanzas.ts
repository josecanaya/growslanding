// Cálculos financieros puros del circuito (dinero ficticio de ensayo).
// Los SUPUESTOS económicos abiertos viven en SUPUESTOS_ENSAYO: son reversibles y no forman
// parte de ninguna configuración comercial definitiva.

export const SUPUESTOS_ENSAYO = {
  version: 'ensayo-2026-11',
  derecho: 'La MCU da derecho a una fracción del resultado del PROYECTO completo, no a una unidad. Vincular una posición a una unidad solo identifica una opción de adjudicación y la imputación de costos; no crea un segundo derecho económico.',
  dilucion: 'Cada ronda emite MCU nuevas. Los inversores anteriores conservan su cantidad y se diluyen en porcentaje; no hay derecho de preferencia.',
  precioPorRonda: 'El responsable fija el precio de cada ronda. La valuación previa es informativa: precio de referencia = valuación previa / MCU en circulación.',
  devoluciones: 'Si lo integrado no alcanza el umbral al cierre, la ronda falla y se devuelve el 100% de lo integrado. Lo prometido sin integrar se cancela y nunca cuenta como caja.',
  prioridadDeCobro: 'En un cierre, los certificados aprobados de contratistas se pagan antes de liquidar caja a los inversores. La liquidación es a prorrata de MCU.',
  votacion: 'Sin votación en el ensayo: reprogramar o cerrar lo decide el responsable y queda registrado con motivo.',
  liquidez: 'No hay salida garantizada. Una MCU solo se transfiere si otro inversor compra la orden; el dinero va al vendedor y la caja de obra no cambia.',
  imputacionComun: 'Los costos comunes del edificio se imputan a las unidades por superficie (m² de la unidad / m² totales). Los resultados se reparten por MCU.',
  retencion: 'Cada certificado retiene un fondo de reparo (5% por defecto). Su devolución al contratista no está modelada: se informa como compromiso al final de la obra.',
} as const;

const c = (n: number) => Math.round(n * 100); // a centavos
const m = (centavos: number) => Math.round(centavos) / 100;
export const redondear = (n: number) => m(c(n));

/** Reparte un total en centavos según pesos, por mayor resto: la suma siempre es exacta. */
export function repartir(total: number, pesos: { clave: string; peso: number }[]): Record<string, number> {
  const suma = pesos.reduce((s, p) => s + p.peso, 0);
  const salida: Record<string, number> = {};
  if (suma <= 0) return Object.fromEntries(pesos.map((p) => [p.clave, 0]));
  const centavos = c(total);
  const partes = pesos.map((p) => {
    const exacto = (centavos * p.peso) / suma;
    return { clave: p.clave, base: Math.floor(exacto), resto: exacto - Math.floor(exacto) };
  });
  let sobrante = centavos - partes.reduce((s, p) => s + p.base, 0);
  for (const p of [...partes].sort((a, b) => b.resto - a.resto || a.clave.localeCompare(b.clave))) {
    salida[p.clave] = m(p.base + (sobrante-- > 0 ? 1 : 0));
  }
  return salida;
}

export type EntradaNecesidad = {
  caja: number;
  reserva: number;
  /** Tareas con costo contractual pendiente de certificar/pagar y su fecha estimada de fin. */
  compromisos: { concepto: string; monto: number; fecha: string }[];
  /** Certificados aprobados todavía impagos. */
  aprobadosImpagos: number;
  costosPrevistos: { tipo: string; descripcion: string; monto: number; fecha: string }[];
  /** Partidas sin contrato, a precio de referencia. */
  sinContrato: { concepto: string; monto: number; fecha: string }[];
  /** Dinero prometido en rondas abiertas: se informa, pero NO reduce la necesidad. */
  prometidoNoIntegrado: number;
  /** Dinero integrado en una ronda aún no cerrada: en custodia, tampoco es caja. */
  integradoEnCustodia: number;
};
export function necesidadDeFondos(e: EntradaNecesidad) {
  const sum = (xs: { monto: number }[]) => redondear(xs.reduce((s, x) => s + x.monto, 0));
  const contratado = sum(e.compromisos);
  const costos = sum(e.costosPrevistos);
  const estimado = sum(e.sinContrato);
  const requerido = redondear(contratado + e.aprobadosImpagos + costos + estimado + e.reserva);
  const necesidad = Math.max(0, redondear(requerido - e.caja));
  const porMes = new Map<string, number>();
  const cargar = (fecha: string, monto: number) => porMes.set(fecha.slice(0, 7), redondear((porMes.get(fecha.slice(0, 7)) ?? 0) + monto));
  for (const x of [...e.compromisos, ...e.costosPrevistos, ...e.sinContrato]) cargar(x.fecha, x.monto);
  let saldo = redondear(e.caja - e.aprobadosImpagos);
  let primerDeficit: string | null = saldo < e.reserva && e.aprobadosImpagos > 0 ? 'inmediato' : null;
  const cronograma = [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, pagos]) => {
    saldo = redondear(saldo - pagos);
    if (primerDeficit === null && saldo < e.reserva) primerDeficit = mes;
    return { mes, pagos, caja_proyectada: saldo };
  });
  return {
    caja_disponible: e.caja,
    reserva_objetivo: e.reserva,
    contratado_pendiente: contratado,
    certificados_aprobados_impagos: e.aprobadosImpagos,
    costos_previstos: costos,
    estimado_sin_contrato: estimado,
    total_requerido: requerido,
    necesidad,
    cubierto: necesidad === 0,
    primer_deficit: necesidad === 0 ? null : primerDeficit,
    cronograma_pagos: cronograma,
    no_contado: {
      prometido_no_integrado: e.prometidoNoIntegrado,
      integrado_en_custodia: e.integradoEnCustodia,
      nota: 'Ni lo prometido ni lo integrado en una ronda abierta son caja de obra hasta que la ronda cierra con éxito.',
    },
  };
}

/** Efecto de una ronda sobre inversores anteriores, nuevos y caja. */
export function efectoRonda(r: { valuacionPre: number; precioMcu: number; mcuOfrecidas: number; mcuPrevias: number; umbralMcu: number; minimoMcu: number }) {
  const post = r.mcuPrevias + r.mcuOfrecidas;
  return {
    aporte_minimo: redondear(r.minimoMcu * r.precioMcu),
    capital_objetivo: redondear(r.mcuOfrecidas * r.precioMcu),
    capital_minimo_para_cerrar: redondear(r.umbralMcu * r.precioMcu),
    precio_referencia_por_valuacion: r.mcuPrevias > 0 ? redondear(r.valuacionPre / r.mcuPrevias) : null,
    valuacion_post: redondear(r.valuacionPre + r.mcuOfrecidas * r.precioMcu),
    participacion_nuevos_pct: redondear((r.mcuOfrecidas / post) * 100),
    participacion_anteriores_pct: redondear((r.mcuPrevias / post) * 100),
    dilucion_anteriores_pct: r.mcuPrevias > 0 ? redondear((r.mcuOfrecidas / post) * 100) : 0,
  };
}

export type PartidaCosto = { codigo: string; monto: number; esComun: boolean; unidadCodigo: string | null };
export type UnidadObra = { codigo: string; m2: number };
/**
 * Imputación de costos a unidades. Cada partida entra UNA vez: directa a su unidad, o común repartida
 * por superficie. La suma de lo imputado es exactamente el costo total (sin duplicar partidas).
 */
export function imputarCostos(partidas: PartidaCosto[], unidades: UnidadObra[]) {
  const totalM2 = unidades.reduce((s, u) => s + u.m2, 0);
  const directo = new Map<string, number>(unidades.map((u) => [u.codigo, 0]));
  let comun = 0;
  for (const p of partidas) {
    if (p.unidadCodigo && directo.has(p.unidadCodigo) && !p.esComun) directo.set(p.unidadCodigo, redondear(directo.get(p.unidadCodigo)! + p.monto));
    else comun = redondear(comun + p.monto);
  }
  const comunPorUnidad = repartir(comun, unidades.map((u) => ({ clave: u.codigo, peso: u.m2 })));
  const filas = unidades.map((u) => ({
    unidad: u.codigo, m2: u.m2, coeficiente_pct: totalM2 ? redondear((u.m2 / totalM2) * 100) : 0,
    costo_directo: directo.get(u.codigo)!, costo_comun_imputado: comunPorUnidad[u.codigo] ?? 0,
    costo_total: redondear(directo.get(u.codigo)! + (comunPorUnidad[u.codigo] ?? 0)),
  }));
  const total = redondear(partidas.reduce((s, p) => s + p.monto, 0));
  const imputado = redondear(filas.reduce((s, f) => s + f.costo_total, 0));
  return { regla: SUPUESTOS_ENSAYO.imputacionComun, costo_comun: comun, costo_total: total, imputado, cierra: unidades.length === 0 || total === imputado, unidades: filas };
}
