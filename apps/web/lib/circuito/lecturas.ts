import { calcularCronograma, curvaS, type Cronograma } from './cronograma';
import { efectoRonda, imputarCostos, necesidadDeFondos, redondear, SUPUESTOS_ENSAYO } from './finanzas';
import { CircuitoError, type Db, type Roles } from './servidor';

type Fila = Record<string, any>;
const hoy = () => new Date().toISOString().slice(0, 10);
const fecha = (v: unknown) => (typeof v === 'string' ? v.slice(0, 10) : null);
const suma = (xs: Fila[], campo: string) => redondear(xs.reduce((s, x) => s + Number(x[campo] ?? 0), 0));

async function leer(db: Db, tabla: string, columna: string, valores: string | string[], orden?: string): Promise<Fila[]> {
  const lista = Array.isArray(valores) ? valores : [valores];
  if (!lista.length) return [];
  const todas: Fila[] = [];
  for (let desde = 0; ; desde += 1000) {
    let q = db.from(tabla).select('*').in(columna, lista).range(desde, desde + 999);
    if (orden) q = q.order(orden);
    const { data, error } = await q;
    if (error) throw new CircuitoError(503, 'No se pudo leer el estado de la obra.');
    todas.push(...(data ?? []));
    if ((data ?? []).length < 1000) return todas;
  }
}

/** Todo lo persistido del circuito de una obra. Las vistas por rol se derivan de acá. */
export async function cargarObra(db: Db, obraId: string) {
  const { data: obra, error } = await db.from('obras').select('id, name, org_id, address, canvas_ui').eq('id', obraId).maybeSingle();
  if (error) throw new CircuitoError(503, 'No se pudo leer la obra.');
  if (!obra) throw new CircuitoError(404, 'Obra no encontrada.', 'GR404');
  const por = (tabla: string, orden?: string) => leer(db, tabla, 'obra_id', obraId, orden);
  const [circuito, unidades, pliegos, revisiones, partidas, partidaTareas, restricciones, lineasBase, solicitudes, ofertas, contratos,
    contratoItems, adendas, avances, evidencias, certificados, pagos, costos, caja, rondas, suscripciones, posiciones, mcuMovimientos,
    ordenes, distribuciones, participantes, eventos] = await Promise.all([
    por('obra_circuito'), por('obra_unidades', 'codigo'), por('pliegos', 'created_at'), por('pliego_revisiones', 'numero'),
    por('pliego_partidas', 'orden'), por('partida_tareas', 'clave'), por('plan_restricciones', 'clave'), por('plan_lineas_base', 'version'),
    por('solicitudes_cotizacion', 'created_at'), por('ofertas', 'created_at'), por('contratos', 'created_at'), por('contrato_items', 'partida_codigo'),
    por('contrato_adendas', 'created_at'), por('avances', 'created_at'), por('evidencias_obra', 'created_at'), por('certificados', 'created_at'),
    por('pagos_obra', 'created_at'), por('obra_costos', 'fecha_prevista'), por('caja_movimientos', 'created_at'), por('mcu_rondas', 'numero'),
    por('mcu_suscripciones', 'created_at'), por('mcu_posiciones', 'user_id'), por('mcu_movimientos', 'created_at'), por('mcu_ordenes_venta', 'created_at'),
    por('mcu_distribuciones', 'created_at'), por('obra_participantes', 'created_at'), por('circuito_eventos', 'created_at'),
  ]);
  const tareaIds = partidaTareas.map((x) => x.tarea_id as string);
  const ids = (xs: Fila[]) => xs.map((x) => x.id as string);
  const [tareas, precedencias, lineaBaseTareas, invitados, ofertaItems, certificadoItems, certificadoHistorial, distribucionPagos, socios] = await Promise.all([
    leer(db, 'tareas', 'id', tareaIds), leer(db, 'tarea_precedencias', 'tarea_id', tareaIds),
    leer(db, 'plan_linea_base_tareas', 'linea_base_id', ids(lineasBase)), leer(db, 'solicitud_invitados', 'solicitud_id', ids(solicitudes)),
    leer(db, 'oferta_items', 'oferta_id', ids(ofertas)), leer(db, 'certificado_items', 'certificado_id', ids(certificados)),
    leer(db, 'certificado_historial', 'certificado_id', ids(certificados), 'created_at'), leer(db, 'mcu_distribucion_pagos', 'distribucion_id', ids(distribuciones)),
    Promise.resolve([] as Fila[]),
  ]).then(async (r) => {
    const socioIds = [...new Set([...contratos.map((x) => x.socio_id), ...ofertas.map((x) => x.socio_id), ...r[3].map((x) => x.socio_id)])] as string[];
    const filas = await leer(db, 'socios', 'id', socioIds);
    r[8] = filas.map((s) => ({ id: s.id, nombre: s.nombre, especialidad: s.especialidad }));
    return r;
  });
  return {
    obra, circuito: circuito[0] ?? { obra_id: obraId, estado: 'normal', reserva_objetivo: 0, fecha_inicio_plan: null, reprogramada_hasta: null, motivo_estado: null, mcu_simbolo: null },
    unidades, pliegos, revisiones, partidas, partidaTareas, tareas, precedencias, restricciones, lineasBase, lineaBaseTareas, solicitudes, invitados,
    ofertas, ofertaItems, contratos, contratoItems, adendas, avances, evidencias, certificados, certificadoItems, certificadoHistorial, pagos, costos,
    caja, rondas, suscripciones, posiciones, mcuMovimientos, ordenes, distribuciones, distribucionPagos, participantes, eventos, socios,
  };
}
export type Modelo = Awaited<ReturnType<typeof cargarObra>>;

/** Revisión vigente para leer partidas: la publicada o, si no hay, el último borrador. */
export function revisionVigente(m: Modelo) {
  return m.revisiones.find((r) => r.estado === 'publicada') ?? m.revisiones[m.revisiones.length - 1] ?? null;
}

/** Costo de cada tarea: valor contractual si la partida está contratada; si no, precio de referencia. */
export function costosPorTarea(m: Modelo) {
  const vigente = revisionVigente(m);
  const partidas = m.partidas.filter((p) => p.revision_id === vigente?.id);
  const out = new Map<string, { costo: number; contratado: boolean; contratoItemId: string | null }>();
  for (const pt of m.partidaTareas) {
    const item = m.contratoItems.find((ci) => ci.partida_codigo === pt.partida_codigo && ci.pliego_id === pt.pliego_id);
    const partida = partidas.find((p) => p.codigo === pt.partida_codigo);
    const base = item ? Number(item.subtotal) / Number(item.cantidad || 1) : Number(partida?.precio_referencia ?? 0);
    out.set(pt.tarea_id, { costo: redondear(base * Number(pt.cantidad)), contratado: Boolean(item), contratoItemId: item?.id ?? null });
  }
  return out;
}

export function entradaCronograma(m: Modelo, corte?: string | null) {
  const clave = new Map(m.partidaTareas.map((pt) => [pt.tarea_id, pt.clave as string]));
  const tareas = [...m.tareas].sort((a, b) => String(clave.get(a.id)).localeCompare(String(clave.get(b.id))));
  return {
    fechaInicio: (m.circuito.fecha_inicio_plan as string | null) ?? hoy(),
    tareas: tareas.map((t) => ({ id: t.id as string, duracion: Number(t.dias_presupuesto), avance: Number(t.avance ?? 0), inicioReal: fecha(t.fecha_inicio_real), finReal: fecha(t.fecha_fin_real) })),
    precedencias: m.precedencias.map((p) => ({ tarea: p.tarea_id as string, dependeDe: p.depende_de as string, lag: Number(p.lag_dias ?? 0) })),
    restricciones: m.restricciones.map((r) => ({ tarea: r.tarea_id as string, tipo: r.tipo, recursoClave: r.recurso_clave, fechaDisponible: r.fecha_disponible, estado: r.estado })),
    fechaCorte: corte ?? null,
    noAntesDe: m.circuito.estado === 'reprogramada' ? (m.circuito.reprogramada_hasta as string | null) : null,
  };
}

/** Cálculo listo para circ_plan_aplicar. */
export function calculoParaPersistir(m: Modelo, corte?: string | null) {
  const cronograma = calcularCronograma(entradaCronograma(m, corte));
  const costos = costosPorTarea(m);
  return {
    cronograma,
    calculo: cronograma.tareas.map((t) => ({ tarea_id: t.id, inicio: t.inicio, fin: t.fin, es: t.es, ef: t.ef, ls: t.ls, lf: t.lf,
      holgura: t.holgura, critica: t.critica, duracion: t.duracion, costo: costos.get(t.id)?.costo ?? 0 })),
  };
}

export function avancesDeObra(m: Modelo) {
  const costos = costosPorTarea(m);
  const total = redondear([...costos.values()].reduce((s, x) => s + x.costo, 0));
  const fisico = redondear(m.tareas.reduce((s, t) => s + (costos.get(t.id)?.costo ?? 0) * Number(t.avance ?? 0) / 100, 0));
  const contratado = suma(m.contratos, 'monto_total');
  const aprobados = m.certificados.filter((c) => c.estado === 'aprobado');
  const certificado = suma(aprobados, 'monto_bruto');
  const pagado = suma(m.pagos, 'monto');
  const pct = (a: number, b: number) => (b > 0 ? redondear((a / b) * 100) : 0);
  return {
    presupuesto_plan: total, contratado,
    avance_fisico: { monto: fisico, pct: pct(fisico, total), fuente: 'avances aceptados con evidencia' },
    certificado: { monto: certificado, pct: pct(certificado, contratado), fuente: 'certificados aprobados (bruto)' },
    pagado: { monto: pagado, pct: pct(pagado, contratado), fuente: 'pagos registrados (neto de retención)' },
    retenido: redondear(suma(aprobados.filter((c) => m.pagos.some((p) => p.certificado_id === c.id)), 'retencion')),
    aprobado_impago: redondear(suma(aprobados.filter((c) => !m.pagos.some((p) => p.certificado_id === c.id)), 'monto_neto')),
  };
}

export async function vistaPlan(db: Db, m: Modelo, corte?: string | null) {
  const costos = costosPorTarea(m);
  const lb = m.lineasBase[m.lineasBase.length - 1] ?? null;
  const lbTareas = lb ? m.lineaBaseTareas.filter((x) => x.linea_base_id === lb.id) : [];
  const fechaCorte = corte ?? hoy();
  const { data: bloqueos, error } = await db.rpc('circ_tareas_bloqueos', { p_obra: m.obra.id, p_fecha: fechaCorte });
  if (error) throw new CircuitoError(503, 'No se pudo calcular la habilitación de tareas.');
  const bloqueo = new Map((bloqueos as Fila[]).map((b) => [b.tarea_id, b.bloqueo as string | null]));
  let proyeccion: Cronograma | null = null;
  try { proyeccion = m.tareas.length ? calcularCronograma(entradaCronograma(m, corte ?? null)) : null; } catch { proyeccion = null; }
  const tareas = m.partidaTareas.map((pt) => {
    const t = m.tareas.find((x) => x.id === pt.tarea_id)!;
    const base = lbTareas.find((x) => x.tarea_id === t.id);
    const p = proyeccion?.tareas.find((x) => x.id === t.id);
    const finPrevisto = fecha(t.fecha_fin_real) ?? p?.fin ?? fecha(t.fecha_fin_estimada);
    return {
      id: t.id, clave: pt.clave, titulo: t.title, partida_codigo: pt.partida_codigo, frente: pt.frente, cantidad: Number(pt.cantidad),
      duracion_dias: Number(t.dias_presupuesto), estado: t.estado, avance_fisico_pct: Number(t.avance ?? 0),
      responsable_socio_id: t.responsable_socio_id, costo: costos.get(t.id)?.costo ?? 0, contratada: costos.get(t.id)?.contratado ?? false,
      linea_base: base ? { inicio: base.inicio, fin: base.fin } : null,
      plan: { inicio: fecha(t.fecha_inicio_estimada), fin: fecha(t.fecha_fin_estimada), holgura: t.float === null ? null : Number(t.float), critica: Boolean(t.is_critical) },
      proyeccion: p ? { inicio: p.inicio, fin: p.fin, holgura: p.holgura, critica: p.critica, motivo_inicio: p.motivoInicio } : null,
      real: { inicio: fecha(t.fecha_inicio_real), fin: fecha(t.fecha_fin_real) },
      atraso_dias: base && finPrevisto ? Math.max(0, Math.round((Date.parse(finPrevisto) - Date.parse(base.fin)) / 86_400_000)) : 0,
      habilitada: bloqueo.get(t.id) === null && Number(t.avance ?? 0) < 100, bloqueo: Number(t.avance ?? 0) >= 100 ? 'Terminada' : bloqueo.get(t.id) ?? null,
      depende_de: m.precedencias.filter((x) => x.tarea_id === t.id).map((x) => ({ clave: m.partidaTareas.find((y) => y.tarea_id === x.depende_de)?.clave, lag_dias: Number(x.lag_dias ?? 0) })),
      restricciones: m.restricciones.filter((r) => r.tarea_id === t.id).map((r) => ({ clave: r.clave, tipo: r.tipo, descripcion: r.descripcion, recurso_clave: r.recurso_clave, fecha_disponible: r.fecha_disponible, estado: r.estado })),
    };
  });
  const aceptados = m.avances.filter((a) => a.estado === 'aceptado').sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const previo = new Map<string, number>();
  const fisico = aceptados.map((a) => {
    const delta = Number(a.porcentaje) - (previo.get(a.tarea_id) ?? 0);
    previo.set(a.tarea_id, Number(a.porcentaje));
    return { fecha: a.fecha as string, monto: redondear((costos.get(a.tarea_id)?.costo ?? 0) * delta / 100) };
  });
  const finLb = lbTareas.map((x) => x.fin as string).sort().pop() ?? null;
  return {
    fecha_corte: fechaCorte, fecha_inicio: m.circuito.fecha_inicio_plan,
    estado_obra: m.circuito.estado, reprogramada_hasta: m.circuito.reprogramada_hasta,
    linea_base: lb ? { version: lb.version, motivo: lb.motivo, fijada_at: lb.created_at, fin: finLb, versiones: m.lineasBase.length } : null,
    fin_previsto: proyeccion?.fin ?? null,
    atraso_total_dias: finLb && proyeccion ? Math.max(0, Math.round((Date.parse(proyeccion.fin) - Date.parse(finLb)) / 86_400_000)) : 0,
    ruta_critica: (proyeccion?.rutaCritica ?? []).map((id) => m.partidaTareas.find((pt) => pt.tarea_id === id)?.clave),
    avances: avancesDeObra(m),
    curva_s: curvaS({
      lineaBase: lbTareas.map((x) => ({ inicio: x.inicio, fin: x.fin, costo: Number(x.costo) })), fisico,
      certificado: m.certificados.filter((c) => c.estado === 'aprobado').map((c) => ({ fecha: c.fecha as string, monto: Number(c.monto_bruto) })),
      pagado: m.pagos.map((p) => ({ fecha: p.fecha as string, monto: Number(p.monto) })), hasta: proyeccion?.fin ?? null,
    }),
    tareas,
  };
}

export function vistaFinanciacion(m: Modelo) {
  const costos = costosPorTarea(m);
  const vigente = revisionVigente(m);
  const partidas = m.partidas.filter((p) => p.revision_id === vigente?.id);
  const finObra = m.tareas.map((t) => fecha(t.fecha_fin_estimada)).filter(Boolean).sort().pop() ?? hoy();
  const compromisos: { concepto: string; monto: number; fecha: string }[] = [];
  const sinContrato: { concepto: string; monto: number; fecha: string }[] = [];
  // Lo contratado pendiente se ubica en la fecha de fin prevista de cada tarea.
  for (const item of m.contratoItems) {
    const contrato = m.contratos.find((c) => c.id === item.contrato_id)!;
    if (contrato.estado !== 'vigente') continue;
    const certificado = redondear(m.certificadoItems.filter((ci) => ci.contrato_item_id === item.id && m.certificados.find((c) => c.id === ci.certificado_id)?.estado === 'aprobado')
      .reduce((s, ci) => s + Number(ci.monto), 0));
    const pendiente = redondear(Number(item.subtotal) - certificado);
    if (pendiente <= 0) continue;
    const tareas = m.partidaTareas.filter((pt) => pt.partida_codigo === item.partida_codigo).map((pt) => m.tareas.find((t) => t.id === pt.tarea_id)!)
      .filter((t) => Number(t.avance ?? 0) < 100 || true);
    const fechaPago = tareas.map((t) => fecha(t.fecha_fin_estimada)).filter(Boolean).sort().pop() ?? finObra;
    compromisos.push({ concepto: `Contrato · partida ${item.partida_codigo}`, monto: pendiente, fecha: fechaPago });
  }
  // Fondo de reparo retenido en certificados ya pagados: se debe al final de la obra.
  const retenido = redondear(m.certificados.filter((c) => c.estado === 'aprobado' && m.pagos.some((p) => p.certificado_id === c.id)).reduce((s, c) => s + Number(c.retencion), 0));
  if (retenido > 0) compromisos.push({ concepto: 'Fondo de reparo retenido', monto: retenido, fecha: finObra });
  for (const p of partidas) {
    if (m.contratoItems.some((ci) => ci.partida_codigo === p.codigo && ci.pliego_id === p.pliego_id)) continue;
    const monto = redondear(Number(p.precio_referencia ?? 0) * Number(p.cantidad ?? 0));
    if (monto <= 0) continue;
    const tareas = m.partidaTareas.filter((pt) => pt.partida_codigo === p.codigo).map((pt) => m.tareas.find((t) => t.id === pt.tarea_id)!);
    sinContrato.push({ concepto: `Sin contrato · partida ${p.codigo} (precio de referencia)`, monto, fecha: tareas.map((t) => fecha(t.fecha_fin_estimada)).filter(Boolean).sort().pop() ?? finObra });
  }
  const abiertas = m.rondas.filter((r) => r.estado === 'abierta').map((r) => r.id);
  const enRonda = m.suscripciones.filter((s) => abiertas.includes(s.ronda_id));
  const cajaTotal = suma(m.caja, 'monto');
  const necesidad = necesidadDeFondos({
    caja: cajaTotal, reserva: Number(m.circuito.reserva_objetivo ?? 0), compromisos,
    aprobadosImpagos: avancesDeObra(m).aprobado_impago,
    costosPrevistos: m.costos.filter((k) => k.estado === 'previsto').map((k) => ({ tipo: k.tipo, descripcion: k.descripcion, monto: Number(k.monto), fecha: k.fecha_prevista })),
    sinContrato,
    prometidoNoIntegrado: suma(enRonda.filter((s) => s.estado === 'prometida'), 'monto'),
    integradoEnCustodia: suma(enRonda.filter((s) => s.estado === 'integrada'), 'monto'),
  });
  const usos = (tipo: string) => redondear(-m.caja.filter((x) => x.tipo === tipo).reduce((s, x) => s + Number(x.monto), 0));
  const totalCostos = (tipo: string) => suma(m.costos.filter((k) => k.tipo === tipo), 'monto');
  const obra = redondear(suma(m.contratos.filter((c) => c.estado !== 'rescindido'), 'monto_total') + suma(sinContrato as Fila[], 'monto'));
  const aportado = redondear(m.caja.filter((x) => x.tipo === 'aporte_ronda').reduce((s, x) => s + Number(x.monto), 0));
  const presupuesto = { terreno: totalCostos('terreno'), obra, honorarios: totalCostos('honorarios'), otros: totalCostos('otros'), reserva: Number(m.circuito.reserva_objetivo ?? 0) };
  const totalPresupuesto = redondear(Object.values(presupuesto).reduce((s, x) => s + x, 0));
  return {
    moneda: 'USD ficticio (ensayo)', estado_obra: m.circuito.estado, motivo_estado: m.circuito.motivo_estado, reprogramada_hasta: m.circuito.reprogramada_hasta,
    caja: { saldo: cajaTotal, aportado_por_rondas: aportado, pagado_certificados: usos('pago_certificado'), pagado_costos: usos('pago_costo'), distribuido: usos('distribucion'),
      movimientos: m.caja.map((x) => ({ id: x.id, tipo: x.tipo, monto: Number(x.monto), fecha: x.fecha, descripcion: x.descripcion, ref_id: x.ref_id })) },
    presupuesto_total: { ...presupuesto, total: totalPresupuesto },
    // Financiación 100% inversora: todo el presupuesto (terreno, obra, honorarios y reserva) cubierto con aportes de rondas.
    cobertura_inversora: { aportado, pct: totalPresupuesto > 0 ? redondear((aportado / totalPresupuesto) * 100) : 0, cierra_100: totalPresupuesto > 0 && aportado >= totalPresupuesto },
    necesidad, costos: m.costos, supuestos: SUPUESTOS_ENSAYO,
  };
}

export function vistaRondas(m: Modelo) {
  const emitidas = m.posiciones.reduce((s, p) => s + Number(p.cantidad), 0);
  return m.rondas.map((r) => {
    const subs = m.suscripciones.filter((s) => s.ronda_id === r.id);
    const mcu = (estado: string) => subs.filter((s) => s.estado === estado).reduce((s, x) => s + Number(x.mcu), 0);
    return {
      id: r.id, numero: r.numero, estado: r.estado, fecha_apertura: r.fecha_apertura, fecha_cierre: r.fecha_cierre,
      valuacion_pre: Number(r.valuacion_pre), precio_mcu: Number(r.precio_mcu), mcu_ofrecidas: r.mcu_ofrecidas, minimo_mcu: r.minimo_mcu, umbral_mcu: r.umbral_mcu,
      mcu_previas: r.mcu_previas, que_se_compra: r.que_se_compra, destino_fondos: r.destino_fondos, condiciones_salida: r.condiciones_salida,
      efecto: efectoRonda({ valuacionPre: Number(r.valuacion_pre), precioMcu: Number(r.precio_mcu), mcuOfrecidas: r.mcu_ofrecidas, mcuPrevias: r.mcu_previas, umbralMcu: r.umbral_mcu, minimoMcu: r.minimo_mcu }),
      // Lo prometido se muestra aparte: no es dinero cobrado.
      mcu_integradas: mcu('integrada') + mcu('asignada'), monto_integrado: suma(subs.filter((s) => ['integrada', 'asignada'].includes(s.estado)), 'monto'),
      mcu_prometidas_sin_integrar: mcu('prometida'), mcu_devueltas: mcu('devuelta'), suscriptores: new Set(subs.filter((s) => s.estado !== 'cancelada').map((s) => s.user_id)).size,
      necesidad_fondos: r.necesidad_fondos,
    };
  }).map((r) => ({ ...r, mcu_emitidas_total: emitidas }));
}

export function vistaImputacion(m: Modelo) {
  const vigente = revisionVigente(m);
  const partidas = m.partidas.filter((p) => p.revision_id === vigente?.id).map((p) => {
    const item = m.contratoItems.find((ci) => ci.partida_codigo === p.codigo && ci.pliego_id === p.pliego_id);
    return { codigo: p.codigo as string, monto: item ? Number(item.subtotal) : redondear(Number(p.precio_referencia ?? 0) * Number(p.cantidad ?? 0)),
      esComun: Boolean(p.es_comun) || !p.unidad_id, unidadCodigo: m.unidades.find((u) => u.id === p.unidad_id)?.codigo ?? null };
  });
  const base = imputarCostos(partidas, m.unidades.map((u) => ({ codigo: u.codigo, m2: Number(u.m2) })));
  const emitidas = m.posiciones.reduce((s, p) => s + Number(p.cantidad), 0);
  return {
    ...base,
    unidades: base.unidades.map((u) => {
      const unidad = m.unidades.find((x) => x.codigo === u.unidad)!;
      const pos = m.posiciones.find((p) => p.unidad_id === unidad.id);
      return { ...u, posicion_vinculada: pos ? { posicion_id: pos.id, user_id: pos.user_id, mcu: pos.cantidad, participacion_resultado_pct: emitidas ? redondear((pos.cantidad / emitidas) * 100) : 0 } : null };
    }),
    partidas_comunes: partidas.filter((p) => p.esComun).map((p) => p.codigo),
    // Control de duplicados: una partida común figura una sola vez en el pliego y en un solo contrato.
    control: {
      partidas_duplicadas: partidas.map((p) => p.codigo).filter((c, i, a) => a.indexOf(c) !== i),
      contratos_por_partida_comun: partidas.filter((p) => p.esComun).map((p) => ({ codigo: p.codigo, contratos: m.contratoItems.filter((ci) => ci.partida_codigo === p.codigo).length })),
    },
  };
}

const nombreSocio = (m: Modelo, id: string) => m.socios.find((s) => s.id === id)?.nombre ?? 'Contratista';
const evidenciasDe = (m: Modelo, entidad: string, id: string) => m.evidencias.filter((e) => e.entidad === entidad && e.entidad_id === id)
  .map((e) => ({ id: e.id, version: e.version, nombre: e.nombre, sha256: e.sha256, bytes: e.bytes, storage_path: e.storage_path, created_at: e.created_at }));

function certificadosVista(m: Modelo, filtro: (c: Fila) => boolean) {
  return m.certificados.filter(filtro).map((c) => ({
    id: c.id, contrato_id: c.contrato_id, numero: c.numero, fecha: c.fecha, estado: c.estado, version: c.version, monto_bruto: Number(c.monto_bruto),
    retencion: Number(c.retencion), monto_neto: Number(c.monto_neto), nota: c.nota, motivo_rechazo: c.motivo_rechazo,
    items: m.certificadoItems.filter((i) => i.certificado_id === c.id).map((i) => ({ contrato_item_id: i.contrato_item_id,
      partida_codigo: m.contratoItems.find((ci) => ci.id === i.contrato_item_id)?.partida_codigo, porcentaje_acumulado: Number(i.porcentaje_acumulado),
      porcentaje_anterior: Number(i.porcentaje_anterior), monto: Number(i.monto) })),
    evidencias: evidenciasDe(m, 'certificado', c.id),
    historial: m.certificadoHistorial.filter((h) => h.certificado_id === c.id).map((h) => ({ version: h.version, accion: h.accion, actor: h.actor, nota: h.nota, created_at: h.created_at })),
    pago: m.pagos.filter((p) => p.certificado_id === c.id).map((p) => ({ id: p.id, monto: Number(p.monto), fecha: p.fecha }))[0] ?? null,
  }));
}
function contratosVista(m: Modelo, filtro: (c: Fila) => boolean) {
  return m.contratos.filter(filtro).map((c) => ({
    id: c.id, solicitud_id: c.solicitud_id, oferta_id: c.oferta_id, socio_id: c.socio_id, contratista: nombreSocio(m, c.socio_id), estado: c.estado,
    revision_id: c.revision_id, revision_numero: m.revisiones.find((r) => r.id === c.revision_id)?.numero, monto_total: Number(c.monto_total), retencion_pct: Number(c.retencion_pct),
    items: m.contratoItems.filter((i) => i.contrato_id === c.id).map((i) => {
      const cert = m.certificadoItems.filter((x) => x.contrato_item_id === i.id && m.certificados.find((ce) => ce.id === x.certificado_id)?.estado === 'aprobado');
      const pts = m.partidaTareas.filter((pt) => pt.partida_codigo === i.partida_codigo);
      const cant = pts.reduce((s, pt) => s + Number(pt.cantidad), 0);
      const fis = cant ? redondear(pts.reduce((s, pt) => s + Number(pt.cantidad) * Number(m.tareas.find((t) => t.id === pt.tarea_id)?.avance ?? 0), 0) / cant) : 0;
      return { id: i.id, partida_codigo: i.partida_codigo, cantidad: Number(i.cantidad), precio_unitario: Number(i.precio_unitario), subtotal: Number(i.subtotal),
        avance_fisico_pct: fis, certificado_pct: Math.max(0, ...cert.map((x) => Number(x.porcentaje_acumulado))), certificado_monto: redondear(cert.reduce((s, x) => s + Number(x.monto), 0)) };
    }),
    adendas: m.adendas.filter((a) => a.contrato_id === c.id).map((a) => ({ id: a.id, estado: a.estado, motivo: a.motivo, revision_id: a.revision_id, monto_anterior: Number(a.monto_anterior), monto_nuevo: Number(a.monto_nuevo), items: a.items })),
  }));
}
function avancesVista(m: Modelo, filtro: (a: Fila) => boolean) {
  return m.avances.filter(filtro).map((a) => ({ id: a.id, tarea_id: a.tarea_id, tarea: m.partidaTareas.find((pt) => pt.tarea_id === a.tarea_id)?.clave, contrato_id: a.contrato_id,
    fecha: a.fecha, porcentaje: Number(a.porcentaje), nota: a.nota, estado: a.estado, version: a.version, observacion: a.observacion, evidencias: evidenciasDe(m, 'avance', a.id) }));
}
function pliegoVista(m: Modelo, paquetes?: Set<string>, revisionIds?: Set<string>) {
  return m.pliegos.map((p) => ({
    id: p.id, titulo: p.titulo,
    revisiones: m.revisiones.filter((r) => r.pliego_id === p.id && (!revisionIds || revisionIds.has(r.id))).map((r) => ({
      id: r.id, numero: r.numero, etapa: r.etapa, estado: r.estado, motivo: r.motivo, huella: r.huella, publicada_at: r.publicada_at,
      partidas: m.partidas.filter((x) => x.revision_id === r.id && (!paquetes || paquetes.has(x.paquete))).map((x) => ({
        id: x.id, codigo: x.codigo, paquete: x.paquete, titulo: x.titulo, alcance: x.alcance, cantidad: x.cantidad === null ? null : Number(x.cantidad), unidad: x.unidad,
        fuente: x.fuente, fuente_revision: x.fuente_revision, evidencia_requerida: x.evidencia_requerida, criterio_aceptacion: x.criterio_aceptacion,
        responsable: x.responsable, es_comun: x.es_comun, unidad_codigo: m.unidades.find((u) => u.id === x.unidad_id)?.codigo ?? null,
        ...(paquetes ? {} : { precio_referencia: x.precio_referencia === null ? null : Number(x.precio_referencia) }),
        tareas: m.partidaTareas.filter((pt) => pt.partida_codigo === x.codigo).map((pt) => ({ clave: pt.clave, frente: pt.frente, cantidad: Number(pt.cantidad) })),
      })),
    })),
  }));
}

/** Vista del responsable, coordinador y auditor: todo, con ofertas comparadas. */
export async function vistaResponsable(db: Db, m: Modelo, roles: Roles, corte?: string | null) {
  return {
    rol: roles.responsable ? 'responsable' : roles.coordinador ? 'coordinador' : 'auditor',
    obra: { id: m.obra.id, nombre: m.obra.name, estado: m.circuito.estado, motivo_estado: m.circuito.motivo_estado },
    unidades: m.unidades.map((u) => ({ id: u.id, codigo: u.codigo, descripcion: u.descripcion, m2: Number(u.m2) })),
    pliegos: pliegoVista(m),
    plan: await vistaPlan(db, m, corte),
    solicitudes: m.solicitudes.map((s) => ({
      id: s.id, paquete: s.paquete, titulo: s.titulo, estado: s.estado, revision_id: s.revision_id, revision_numero: m.revisiones.find((r) => r.id === s.revision_id)?.numero,
      fecha_limite: s.fecha_limite,
      invitados: m.invitados.filter((i) => i.solicitud_id === s.id).map((i) => ({ socio_id: i.socio_id, estado: i.estado })),
      // Comparación: solo ofertas sobre la misma revisión del alcance, ordenadas por monto.
      ofertas: m.ofertas.filter((o) => o.solicitud_id === s.id).sort((a, b) => Number(a.monto_total) - Number(b.monto_total)).map((o) => ({
        id: o.id, socio_id: o.socio_id, contratista: nombreSocio(m, o.socio_id), revision_id: o.revision_id, misma_revision: o.revision_id === s.revision_id,
        monto_total: Number(o.monto_total), plazo_dias: o.plazo_dias, condiciones: o.condiciones, estado: o.estado,
        items: m.ofertaItems.filter((i) => i.oferta_id === o.id).map((i) => ({ partida_codigo: m.partidas.find((p) => p.id === i.partida_id)?.codigo, cantidad: Number(i.cantidad), precio_unitario: Number(i.precio_unitario), subtotal: Number(i.subtotal) })),
      })),
    })),
    contratos: contratosVista(m, () => true),
    avances: avancesVista(m, () => true),
    certificados: certificadosVista(m, () => true),
    financiacion: vistaFinanciacion(m),
    rondas: vistaRondas(m),
    imputacion: vistaImputacion(m),
    participantes: m.participantes.map((p) => ({ user_id: p.user_id, rol: p.rol })),
  };
}

/** Vista del contratista: solo su alcance, sus ofertas, su contrato, sus tareas y sus cobros. Nunca ofertas ajenas. */
export async function vistaContratista(db: Db, m: Modelo, socioIds: string[], corte?: string | null) {
  const mios = new Set(socioIds);
  const invitaciones = m.invitados.filter((i) => mios.has(i.socio_id));
  const solicitudes = m.solicitudes.filter((s) => invitaciones.some((i) => i.solicitud_id === s.id));
  const contratos = m.contratos.filter((c) => mios.has(c.socio_id));
  const paquetes = new Set(solicitudes.map((s) => s.paquete as string));
  const revisiones = new Set([...solicitudes.map((s) => s.revision_id as string), ...contratos.map((c) => c.revision_id as string)]);
  const plan = await vistaPlan(db, m, corte);
  return {
    rol: 'contratista',
    obra: { id: m.obra.id, nombre: m.obra.name, estado: m.circuito.estado },
    pliegos: pliegoVista(m, paquetes, revisiones),
    solicitudes: solicitudes.map((s) => {
      const oferta = m.ofertas.find((o) => o.solicitud_id === s.id && mios.has(o.socio_id));
      return { id: s.id, paquete: s.paquete, titulo: s.titulo, estado: s.estado, fecha_limite: s.fecha_limite, revision_id: s.revision_id,
        revision_numero: m.revisiones.find((r) => r.id === s.revision_id)?.numero,
        mi_oferta: oferta ? { id: oferta.id, monto_total: Number(oferta.monto_total), plazo_dias: oferta.plazo_dias, estado: oferta.estado, revision_id: oferta.revision_id } : null };
    }),
    contratos: contratosVista(m, (c) => mios.has(c.socio_id)),
    tareas: plan.tareas.filter((t) => t.responsable_socio_id && mios.has(t.responsable_socio_id)),
    avances: avancesVista(m, (a) => mios.has(a.socio_id)),
    certificados: certificadosVista(m, (c) => contratos.some((k) => k.id === c.contrato_id)),
    cobrado: suma(m.pagos.filter((p) => mios.has(p.socio_id)), 'monto'),
  };
}

/** Ficha pública de inversión: solo datos verificados y condiciones de la ronda. */
export function fichaInversion(m: Modelo, userId: string | null) {
  const rondas = vistaRondas(m);
  const ronda = rondas.find((r) => r.estado === 'abierta') ?? rondas.find((r) => r.estado === 'programada') ?? rondas[rondas.length - 1] ?? null;
  const avances = avancesDeObra(m);
  const emitidas = m.posiciones.reduce((s, p) => s + Number(p.cantidad), 0);
  const fin = vistaFinanciacion(m);
  const lb = m.lineasBase[m.lineasBase.length - 1];
  const finLb = lb ? m.lineaBaseTareas.filter((x) => x.linea_base_id === lb.id).map((x) => x.fin as string).sort().pop() : null;
  const finPlan = m.tareas.map((t) => fecha(t.fecha_fin_estimada)).filter(Boolean).sort().pop() ?? null;
  const pos = userId ? m.posiciones.find((p) => p.user_id === userId) : null;
  const misSubs = userId ? m.suscripciones.filter((s) => s.user_id === userId) : [];
  return {
    obra: { id: m.obra.id, nombre: m.obra.name, simbolo: m.circuito.mcu_simbolo, estado: m.circuito.estado, motivo_estado: m.circuito.motivo_estado, reprogramada_hasta: m.circuito.reprogramada_hasta },
    ronda: ronda ? { ...ronda, necesidad_fondos: undefined, aporte_minimo: ronda.efecto.aporte_minimo } : null,
    rondas: rondas.map((r) => ({ numero: r.numero, estado: r.estado, precio_mcu: r.precio_mcu, mcu_ofrecidas: r.mcu_ofrecidas, mcu_integradas: r.mcu_integradas, fecha_cierre: r.fecha_cierre })),
    mcu_emitidas: emitidas,
    // Avance verificado: nunca lo declarado por el contratista sin aceptar.
    avance_verificado: { fisico_pct: avances.avance_fisico.pct, certificado_pct: avances.certificado.pct, pagado_pct: avances.pagado.pct },
    planificacion: { fin_linea_base: finLb, fin_previsto: finPlan, atraso_dias: finLb && finPlan ? Math.max(0, Math.round((Date.parse(finPlan) - Date.parse(finLb)) / 86_400_000)) : 0 },
    fondos_obra: { caja: fin.caja.saldo, aportado_por_rondas: fin.caja.aportado_por_rondas, pagado_a_contratistas: fin.caja.pagado_certificados, pagado_costos: fin.caja.pagado_costos,
      distribuido: fin.caja.distribuido, necesidad_pendiente: fin.necesidad.necesidad, cobertura_inversora_pct: fin.cobertura_inversora.pct },
    mercado_secundario: {
      aviso: SUPUESTOS_ENSAYO.liquidez,
      ordenes_abiertas: m.ordenes.filter((o) => o.estado === 'abierta').map((o) => ({ id: o.id, cantidad: o.cantidad, precio_mcu: Number(o.precio_mcu), monto: redondear(o.cantidad * Number(o.precio_mcu)), propia: o.vendedor === userId })),
    },
    distribuciones: m.distribuciones.map((d) => ({ id: d.id, concepto: d.concepto, monto_total: Number(d.monto_total), mcu_base: d.mcu_base, fecha: fecha(d.created_at) })),
    supuestos: SUPUESTOS_ENSAYO,
    mi_posicion: userId ? {
      posicion_id: pos?.id ?? null, mcu: pos?.cantidad ?? 0, costo_total: Number(pos?.costo_total ?? 0),
      participacion_pct: emitidas && pos ? redondear((pos.cantidad / emitidas) * 100) : 0,
      unidad: m.unidades.find((u) => u.id === pos?.unidad_id)?.codigo ?? null,
      suscripciones: misSubs.map((s) => ({ id: s.id, ronda: m.rondas.find((r) => r.id === s.ronda_id)?.numero, mcu: s.mcu, monto: Number(s.monto), estado: s.estado })),
      historial: m.mcuMovimientos.filter((x) => x.user_id === userId).map((x) => ({ tipo: x.tipo, cantidad: x.cantidad, precio_mcu: Number(x.precio_mcu), fecha: x.created_at })),
      distribuciones_cobradas: m.distribucionPagos.filter((d) => d.user_id === userId).map((d) => ({ distribucion_id: d.distribucion_id, mcu: d.mcu, monto: Number(d.monto) })),
    } : null,
  };
}
