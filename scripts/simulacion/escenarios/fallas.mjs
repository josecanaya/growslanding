// Escenario 3 · Obra con fallas combinadas.
// Ronda fallida → reprogramación → ronda incompleta → evidencia observada → atraso por compra → cambio de alcance
// (revisión 2, solicitudes desactualizadas, adenda con suba de costo) → nueva ronda fallida → pago bloqueado por caja →
// proceso de cierre con prioridad de cobro del contratista y liquidación a prorrata. Un inversor quiere salir y no hay comprador.
import { auditarObra } from '../auditor.mjs';
import { afirmar, exito, rechazo } from '../motor.mjs';
import { adjudicar, alta, avance, ficha, itemsCertificado, licitacion, paso, plan, pliego, puntoAuditoria, ver, verContratista } from './comunes.mjs';

const base = (codigo, paquete, titulo, alcance, cantidad, unidad, precio, orden) => ({
  codigo, paquete, titulo, alcance, cantidad, unidad, precio_referencia: precio, orden, fuente: 'Planos E-01/E-02 y memoria de cálculo', fuente_revision: 'A',
  evidencia_requerida: 'Fotos fechadas con referencia de ubicación, remitos y acta de medición.',
  criterio_aceptacion: 'Conforme a planos y especificaciones; sin observaciones de la dirección de obra.', responsable: `Contratista de ${paquete}`,
});
const PARTIDAS = [
  base('F-01', 'estructura', 'Demolición y movimiento de suelos', 'Demolición de construcción existente, retiro y nivelación del terreno.', 1, 'gl', 9000, 1),
  base('F-02', 'estructura', 'Estructura de HºAº', 'Bases aisladas, columnas, vigas y losa en HºAº H-25.', 70, 'm3', 530, 2),
  base('F-03', 'cubierta', 'Cubierta metálica', 'Estructura de perfiles, chapa trapezoidal, aislación y zinguería.', 180, 'm2', 95, 3),
];
const TAREAS = [
  { clave: 'F-DEM', titulo: 'Demolición y suelos', partida_codigo: 'F-01', frente: 'terreno', cantidad: 1, duracion_dias: 8, etapa: 'Preliminares' },
  { clave: 'F-EST', titulo: 'Estructura', partida_codigo: 'F-02', frente: 'general', cantidad: 70, duracion_dias: 20, etapa: 'Estructura',
    depende_de: [{ clave: 'F-DEM' }], restricciones: [{ clave: 'COMPRA-ACERO', tipo: 'compra', descripcion: 'Compra de acero ADN 420', dia: 25 }] },
  { clave: 'F-CUB', titulo: 'Cubierta', partida_codigo: 'F-03', frente: 'cubierta', cantidad: 180, duracion_dias: 10, etapa: 'Cubierta',
    depende_de: [{ clave: 'F-EST', lag_dias: 5 }], restricciones: [{ clave: 'COMPRA-CHAPAS', tipo: 'compra', descripcion: 'Compra de chapas y perfiles', dia: 45 }] },
];
const SALIDA = 'Sin salida garantizada: una MCU solo se transfiere si otro inversor compra la orden. Si la ronda no alcanza el umbral se devuelve lo integrado. Si la obra entra en cierre, primero cobran los contratistas y el remanente se liquida a prorrata.';
const QUE = 'MCU de la obra PH Las Heras: fracción del resultado del proyecto completo.';
const r2 = (n) => Math.round(n * 100) / 100;
const cuenta = async (c, k) => exito(await c.s[k].get('/api/inversion/posicion')).fondos;
const fin = async (c) => (await ver(c, 'arquitecto')).financiacion;
const crearRonda = (id, dia, cierre, titulo, armar) => paso(id, dia, 'arquitecto', titulo, async (c) => {
  const f = await fin(c);
  const d = armar(c, f);
  const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', { minimo_mcu: 10, fecha_apertura: c.fecha(dia), fecha_cierre: c.fecha(cierre), que_se_compra: QUE, condiciones_salida: SALIDA,
    destino_fondos: [{ concepto: 'Necesidad de fondos calculada (contratos, costos previstos, reserva menos caja)', monto: f.necesidad.necesidad }], ...d }, c.idem));
  c.v[id.split('.')[1]] = res.ronda_id; c.v[`${id.split('.')[1]}_mcu`] = d.mcu_ofrecidas;
  exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-abrir', { ronda_id: res.ronda_id }, c.idem + ':abrir'));
  const r = (await ver(c, 'arquitecto')).rondas.find((x) => x.id === res.ronda_id);
  return { id: res.ronda_id, evidencia: { necesidad: f.necesidad.necesidad, caja: f.caja.saldo, valuacion_pre: r.valuacion_pre, precio_mcu: r.precio_mcu, mcu_ofrecidas: r.mcu_ofrecidas, umbral_mcu: r.umbral_mcu, mcu_previas: r.mcu_previas, efecto: r.efecto } };
});
const suscribir = (ronda, inversor, dia, fraccion, integra) => paso(`inv.${ronda}.${inversor}`, dia, inversor, `Suscribir ${Math.round(fraccion * 100)}% de la ${ronda}${integra ? ' e integrar' : ' SIN integrar (solo promesa)'}`, async (c) => {
  const mcu = Math.floor(c.v[`${ronda}_mcu`] * fraccion);
  const s = exito(await c.s[inversor].accion(c.v.obra, 'suscribir', { ronda_id: c.v[ronda], mcu }, c.idem));
  const i = integra ? exito(await c.s[inversor].accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: s.suscripcion_id }, c.idem + ':int')) : null;
  return { id: s.suscripcion_id, evidencia: { mcu, monto: s.monto, estado: i?.estado ?? s.estado } };
});
const feed = async (c) => { const f = await ficha(c); return { estado: f.obra.estado, motivo: f.obra.motivo_estado, atraso_dias: f.planificacion.atraso_dias, fin_previsto: f.planificacion.fin_previsto, avance: f.avance_verificado, fondos: f.fondos_obra, ronda: f.ronda && { numero: f.ronda.numero, estado: f.ronda.estado } }; };
const planAhora = async (c) => { const p = (await ver(c, 'arquitecto', c.fecha())).plan; return { fin_linea_base: p.linea_base?.fin, fin_previsto: p.fin_previsto, atraso_total_dias: p.atraso_total_dias, ruta_critica: p.ruta_critica }; };

export default {
  clave: 'fallas', nombre: 'Obra con fallas combinadas', inicio: '2026-11-16',
  pasos: () => [
    ...alta({ nombre: 'PH Las Heras', direccion: 'Las Heras 2210, Santa Fe', localidad: 'Santa Fe', tipo: 'ph',
      resumen: 'Dos unidades en propiedad horizontal sobre lote propio. Obra de ensayo con datos ficticios.' }),
    ...pliego({ titulo: 'Pliego de estructura y cubierta', partidas: PARTIDAS }, 1),
    ...plan({ tareas: TAREAS, diaInicio: 15 }, 2),
    paso('fin.costos', 3, 'arquitecto', 'Registrar terreno, honorarios y reserva', async (c) => {
      const t = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'terreno', descripcion: 'Lote Las Heras 2210', monto: 50000, fecha_prevista: c.fecha(14) }, c.idem + ':t'));
      const h = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'honorarios', descripcion: 'Proyecto y dirección de obra', monto: 9000, fecha_prevista: c.fecha(21) }, c.idem + ':h'));
      exito(await c.s.arquitecto.accion(c.v.obra, 'reserva-ajustar', { monto: 4000, motivo: 'Reserva para imprevistos (ensayo)' }, c.idem + ':r'));
      c.v.costo_terreno = t.costo_id; c.v.costo_honorarios = h.costo_id;
      return { id: t.costo_id, evidencia: { terreno: 50000, honorarios: 9000, reserva: 4000 } };
    }),

    // ── Falla 1: ronda que no alcanza el umbral
    crearRonda('fin.ronda1.crear', 3, 8, 'Ronda 1 por el 100% de la necesidad (umbral 80%)', (c, f) => {
      const mcu = Math.ceil(f.necesidad.necesidad / 100);
      return { simbolo: 'HERAS', valuacion_pre: 0, precio_mcu: 100, mcu_ofrecidas: mcu, umbral_mcu: Math.ceil(mcu * 0.8) };
    }),
    ...licitacion('estructura', 3, { factores: [1.05, 1.01, 0.96], ganador: 'contratista3', plazos: [40, 45, 38] }),
    suscribir('ronda1', 'inversor1', 4, 0.35, true),
    suscribir('ronda1', 'inversor2', 4, 0.4, false),
    suscribir('ronda1', 'inversor3', 5, 0.2, true),
    paso('fin.ronda1.cerrar', 8, 'arquitecto', 'Cerrar la ronda 1: lo integrado (55%) no alcanza el umbral → falla y se devuelve', async (c) => {
      const antes = { i1: await cuenta(c, 'inversor1'), i2: await cuenta(c, 'inversor2') };
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda1, fecha: c.fecha() }, c.idem));
      const despues = { i1: await cuenta(c, 'inversor1'), i2: await cuenta(c, 'inversor2') };
      const f = await fin(c);
      afirmar(res.resultado === 'fallida' && res.caja_aportada === 0 && res.devuelto > 0 && res.mcu_prometidas_no_contadas > 0, 'la ronda debía fallar devolviendo lo integrado y sin contar lo prometido');
      afirmar(f.caja.saldo === 0 && f.necesidad.necesidad === f.necesidad.total_requerido, 'una ronda fallida no puede dejar caja');
      afirmar(r2(despues.i1.saldo_disponible - antes.i1.saldo_disponible) === r2(antes.i1.en_custodia_de_ronda) && despues.i1.en_custodia_de_ronda === 0, 'al inversor que integró no se le devolvió todo');
      afirmar(despues.i2.saldo_disponible === antes.i2.saldo_disponible && despues.i2.prometido_sin_integrar === 0, 'la promesa sin integrar debía cancelarse sin mover dinero');
      const pos = await ficha(c, 'inversor1');
      afirmar(pos.mcu_emitidas === 0 && pos.mi_posicion.mcu === 0, 'una ronda fallida no emite MCU');
      return { id: c.v.ronda1, evidencia: { ...res, caja_obra: f.caja.saldo, inversor_que_integro: { antes: antes.i1, despues: despues.i1 }, inversor_que_solo_prometio: { antes: antes.i2, despues: despues.i2 } } };
    }),
    paso('fin.sin-fondos.terreno', 9, 'arquitecto', 'Pagar el terreno sin caja → 409 fondos insuficientes', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_terreno }), 409, 'FONDOS_INSUFICIENTES') }), 'validacion'),
    ...adjudicar('estructura', 9, { ganador: 'contratista3' }),
    paso('obra.reprogramar', 9, 'arquitecto', 'Sin capital: reprogramar el inicio de obra y reflejarlo en plan y feed', async (c) => {
      const antes = await planAhora(c);
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'obra-estado', { estado: 'reprogramada', hasta: c.fecha(20), motivo: 'La ronda 1 no alcanzó el umbral: el inicio se posterga hasta reunir capital.' }, c.idem));
      exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha() }, c.idem + ':plan'));
      const despues = await planAhora(c);
      const f = await feed(c);
      afirmar(despues.atraso_total_dias > 0 && f.estado === 'reprogramada' && f.atraso_dias === despues.atraso_total_dias, 'la reprogramación no se refleja en plan y feed');
      return { id: c.v.obra, evidencia: { estado: res.estado, hasta: res.reprogramada_hasta, plan_antes: antes, plan_despues: despues, feed: f } };
    }),

    // ── Falla 2: ronda incompleta (supera el umbral, no cubre la necesidad)
    crearRonda('fin.ronda2.crear', 10, 14, 'Ronda 2 a menor precio (umbral 60%)', (c, f) => {
      const mcu = Math.ceil(f.necesidad.necesidad / 90);
      return { valuacion_pre: 0, precio_mcu: 90, mcu_ofrecidas: mcu, umbral_mcu: Math.ceil(mcu * 0.6) };
    }),
    suscribir('ronda2', 'inversor1', 11, 0.45, true),
    suscribir('ronda2', 'inversor3', 11, 0.3, true),
    suscribir('ronda2', 'inversor2', 12, 0.25, false),
    paso('fin.ronda2.cerrar', 14, 'arquitecto', 'Cerrar la ronda 2: supera el umbral pero queda incompleta', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda2, fecha: c.fecha() }, c.idem));
      const f = await fin(c);
      afirmar(res.resultado === 'cerrada_exitosa' && res.completa === false && res.mcu_sin_colocar > 0 && res.mcu_prometidas_no_contadas > 0, 'la ronda debía cerrar incompleta');
      afirmar(f.caja.saldo === res.caja_aportada && f.necesidad.necesidad > 0 && !f.cobertura_inversora.cierra_100, 'una ronda incompleta no puede cubrir el 100%');
      return { id: c.v.ronda2, evidencia: { ...res, caja: f.caja.saldo, necesidad_pendiente: f.necesidad.necesidad, primer_deficit: f.necesidad.primer_deficit, cobertura_inversora_pct: f.cobertura_inversora.pct } };
    }),
    paso('av.reprogramada', 16, 'contratista3', 'Informar avance con la obra reprogramada → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista3.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['F-DEM'], fecha: c.fecha(), porcentaje: 30 }), 409, 'reprogramada hasta') }), 'validacion'),
    paso('obra.reanudar', 20, 'arquitecto', 'Reanudar por etapas con capital parcial y pagar terreno y honorarios', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'obra-estado', { estado: 'normal', motivo: 'Capital parcial reunido: se ejecuta la estructura; la cubierta queda sujeta a una ronda posterior.' }, c.idem));
      exito(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_terreno, fecha: c.fecha() }, c.idem + ':t'));
      exito(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_honorarios, fecha: c.fecha() }, c.idem + ':h'));
      exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha() }, c.idem + ':plan'));
      return { id: c.v.obra, evidencia: { plan: await planAhora(c), caja: (await fin(c)).caja.saldo } };
    }),

    // ── Falla 3: evidencia observada y corregida
    paso('av.F-DEM.informar', 27, 'contratista3', 'Informar 100% de demolición con una foto sin fecha', async (c) => {
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['F-DEM'], fecha: c.fecha(), porcentaje: 100, nota: 'Demolición terminada' }, c.idem));
      c.v.av_dem = res.avance_id;
      const ev = exito(await c.s.contratista3.evidencia(c.v.obra, 'avance', res.avance_id, 'foto-sin-fecha.txt', `Foto del terreno sin fecha ni referencia · semilla ${c.semilla}`));
      return { id: res.avance_id, evidencia: { sha256: ev.sha256, version: ev.version } };
    }),
    paso('av.F-DEM.observar', 27, 'arquitecto', 'Rechazar la evidencia: observar el avance', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'avance-revisar', { avance_id: c.v.av_dem, decision: 'observar', observacion: 'La foto no tiene fecha ni referencia de ubicación, como exige el pliego. Falta el remito de retiro de escombros.' }, c.idem));
      const t = (await ver(c, 'arquitecto')).plan.tareas.find((x) => x.clave === 'F-DEM');
      afirmar(res.estado === 'observado' && t.avance_fisico_pct === 0, 'un avance observado no puede contar como avance físico');
      return { id: c.v.av_dem, evidencia: { estado: res.estado, avance_fisico_de_la_tarea: t.avance_fisico_pct } };
    }),
    paso('av.F-DEM.doble', 27, 'contratista3', 'Informar otro avance con uno observado pendiente → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista3.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['F-DEM'], fecha: c.fecha(), porcentaje: 100 }), 409, 'pendiente de revisión') }), 'validacion'),
    paso('av.F-DEM.corregir', 28, 'contratista3', 'Corregir la observación con evidencia nueva', async (c) => {
      const ev = exito(await c.s.contratista3.evidencia(c.v.obra, 'avance', c.v.av_dem, 'foto-fechada-y-remito.txt', `Foto fechada ${c.fecha()} con mojón de referencia + remito de escombros N° 0412 · semilla ${c.semilla}`));
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'avance-corregir', { avance_id: c.v.av_dem, nota: 'Se adjunta foto fechada y remito.' }, c.idem));
      afirmar(res.version === 2 && ev.version === 2, 'la corrección no generó la versión 2');
      return { id: c.v.av_dem, evidencia: { version: res.version, evidencia_v2: ev.sha256 } };
    }),
    paso('av.F-DEM.aceptar', 28, 'arquitecto', 'Aceptar el avance corregido', async (c) =>
      ({ id: c.v.av_dem, evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'avance-revisar', { avance_id: c.v.av_dem, decision: 'aceptar' }, c.idem)) })),
    paso('cert.estructura.1.presentar', 29, 'contratista3', 'Presentar el certificado 1 (demolición)', async (c) => {
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v.contrato_estructura, fecha: c.fecha(), items: await itemsCertificado(c, 'contratista3', 'estructura', { 'F-01': 100 }) }, c.idem));
      c.v.cert1 = res.certificado_id;
      exito(await c.s.contratista3.evidencia(c.v.obra, 'certificado', res.certificado_id, 'acta-sin-firma.txt', `Acta de medición sin firma · semilla ${c.semilla}`));
      return { id: res.certificado_id, evidencia: res };
    }),
    paso('cert.estructura.1.rechazar', 29, 'arquitecto', 'Rechazar el certificado: acta sin firma', async (c) =>
      ({ id: c.v.cert1, evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'rechazar', motivo: 'El acta de medición no está firmada por el representante técnico.' }, c.idem)) })),
    paso('cert.estructura.1.corregir', 30, 'contratista3', 'Corregir con el acta firmada', async (c) => {
      exito(await c.s.contratista3.evidencia(c.v.obra, 'certificado', c.v.cert1, 'acta-firmada.txt', `Acta de medición firmada · semilla ${c.semilla}`));
      return { id: c.v.cert1, evidencia: exito(await c.s.contratista3.accion(c.v.obra, 'certificado-corregir', { certificado_id: c.v.cert1, items: await itemsCertificado(c, 'contratista3', 'estructura', { 'F-01': 100 }) }, c.idem)) };
    }),
    paso('cert.estructura.1.aprobar-pagar', 30, 'arquitecto', 'Aprobar y pagar el certificado corregido', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'aprobar' }, c.idem));
      const pago = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1, fecha: c.fecha() }, c.idem + ':pago'));
      return { id: pago.pago_id, evidencia: pago };
    }),

    // ── Falla 4: atraso por una compra
    paso('atraso.compra-acero', 30, 'coordinador', 'La compra de acero se demora 20 días: replanificar y reflejar el atraso', async (c) => {
      const antes = await planAhora(c);
      exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'COMPRA-ACERO', fecha_disponible: c.fecha(45) }, c.idem));
      const calc = exito(await c.s.coordinador.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha() }, c.idem + ':plan'));
      const despues = await planAhora(c);
      const t = (await ver(c, 'coordinador', c.fecha())).plan.tareas.find((x) => x.clave === 'F-EST');
      const f = await feed(c);
      afirmar(t.proyeccion.inicio === c.fecha(45) && t.proyeccion.motivo_inicio === 'compra' && despues.atraso_total_dias > antes.atraso_total_dias, 'la demora de la compra no movió el cronograma');
      afirmar(f.atraso_dias === despues.atraso_total_dias && calc.ruta_critica.includes('F-EST'), 'el atraso no llegó al feed o la ruta crítica no lo refleja');
      return { id: c.v.obra, evidencia: { plan_antes: antes, plan_despues: despues, tarea: { inicio: t.proyeccion.inicio, motivo: t.proyeccion.motivo_inicio, atraso_dias: t.atraso_dias }, feed: f } };
    }),

    // ── Falla 5: cambio de alcance con solicitudes abiertas y contrato vigente
    paso('alcance.cubierta.solicitud-rev1', 31, 'arquitecto', 'Pedir cotización de «cubierta» sobre la revisión 1', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'solicitud-crear', { revision_id: c.v.rev1, paquete: 'cubierta', socio_ids: ['contratista1', 'contratista2', 'contratista3'].map((k) => c.s[k].identidad.socio_id) }, c.idem));
      c.v.sol_cubierta_rev1 = res.solicitud_id;
      const oferta = exito(await c.s.contratista1.accion(c.v.obra, 'oferta-enviar', { solicitud_id: res.solicitud_id, revision_id: c.v.rev1, items: [{ partida_codigo: 'F-03', precio_unitario: 97 }], plazo_dias: 20 }, c.idem + ':oferta'));
      c.v.oferta_cubierta_rev1 = oferta.oferta_id;
      return { id: res.solicitud_id, evidencia: { oferta_recibida: oferta.oferta_id, revision: 1 } };
    }),
    paso('alcance.rev2', 33, 'arquitecto', 'Cambio de alcance: revisión 2 del pliego (más hormigón por estudio de suelos, cubierta con aislación doble)', async (c) => {
      const rev = exito(await c.s.arquitecto.accion(c.v.obra, 'pliego-nueva-revision', { pliego_id: c.v.pliego, motivo: 'El estudio de suelos exige platea y refuerzos: F-02 pasa de 70 a 85 m3. Cubierta con aislación doble.' }, c.idem));
      c.v.rev2 = rev.revision_id;
      exito(await c.s.arquitecto.accion(c.v.obra, 'partidas-guardar', { revision_id: rev.revision_id, partidas: [
        { codigo: 'F-02', cantidad: 85, alcance: 'Platea, columnas, vigas y losa en HºAº H-25 con refuerzos según estudio de suelos.', fuente_revision: 'B' },
        { codigo: 'F-03', alcance: 'Estructura de perfiles, chapa trapezoidal, aislación doble y zinguería.', fuente_revision: 'B' }] }, c.idem + ':partidas'));
      const pub = exito(await c.s.arquitecto.accion(c.v.obra, 'pliego-avanzar', { revision_id: rev.revision_id, etapa: 'publicable' }, c.idem + ':publicar'));
      const v = await ver(c, 'arquitecto');
      const sol = v.solicitudes.find((s) => s.id === c.v.sol_cubierta_rev1);
      afirmar(pub.ofertas_desactualizadas === 1 && sol.estado === 'desactualizada' && sol.ofertas[0].estado === 'desactualizada', 'la solicitud abierta sobre la revisión anterior debía quedar desactualizada');
      afirmar(v.contratos[0].revision_numero === 1, 'el contrato vigente no debe cambiar de revisión sin adenda');
      return { id: rev.revision_id, evidencia: { numero: rev.numero, huella: pub.huella, solicitud_cubierta: sol.estado, oferta_previa: sol.ofertas[0].estado, contrato_sigue_en_revision: 1 } };
    }),
    paso('alcance.oferta-vieja', 33, 'contratista2', 'Cotizar la solicitud de la revisión reemplazada → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'oferta-enviar', { solicitud_id: c.v.sol_cubierta_rev1, revision_id: c.v.rev1, items: [{ partida_codigo: 'F-03', precio_unitario: 96 }], plazo_dias: 20 }), 409, 'ya no recibe ofertas') }), 'validacion'),
    paso('alcance.adjudicar-vieja', 33, 'arquitecto', 'Adjudicar una oferta hecha sobre la revisión reemplazada → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'adjudicar', { solicitud_id: c.v.sol_cubierta_rev1, oferta_id: c.v.oferta_cubierta_rev1 }), 409, 'ya no es adjudicable') }), 'validacion'),
    paso('alcance.adenda.proponer', 34, 'arquitecto', 'Proponer adenda al contrato de estructura por la revisión 2 (sube el costo)', async (c) => {
      const antes = await fin(c);
      const contrato = (await ver(c, 'arquitecto')).contratos.find((k) => k.id === c.v.contrato_estructura);
      const items = contrato.items.map((i) => ({ partida_codigo: i.partida_codigo, precio_unitario: i.partida_codigo === 'F-02' ? r2(i.precio_unitario * 1.03) : i.precio_unitario }));
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'adenda-proponer', { contrato_id: c.v.contrato_estructura, revision_id: c.v.rev2, items, motivo: 'Mayor volumen de hormigón y acero por estudio de suelos.' }, c.idem));
      c.v.adenda = res.adenda_id; c.v.necesidad_antes_adenda = antes.necesidad.necesidad;
      afirmar(res.monto_nuevo > res.monto_anterior, 'la adenda debía subir el monto');
      return { id: res.adenda_id, evidencia: res };
    }),
    paso('alcance.adenda.autoaceptar', 34, 'arquitecto', 'El responsable intenta aceptar su propia adenda → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'adenda-responder', { adenda_id: c.v.adenda, acepta: true }), 403) }), 'permiso'),
    paso('alcance.adenda.aceptar', 35, 'contratista3', 'El contratista acepta la adenda: sube el contrato y la necesidad de fondos', async (c) => {
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'adenda-responder', { adenda_id: c.v.adenda, acepta: true }, c.idem));
      exito(await c.s.coordinador.accion(c.v.obra, 'plan-guardar', { fecha_inicio: c.fecha(15), tareas: [{ clave: 'F-EST', titulo: 'Estructura (rev. 2)', partida_codigo: 'F-02', frente: 'general', cantidad: 85, duracion_dias: 24 }] }, c.idem + ':plan'));
      const lb = exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha(), fijar_linea_base: true, motivo: 'Cambio de alcance: revisión 2 y adenda de estructura' }, c.idem + ':lb'));
      const f = await fin(c);
      const v = await ver(c, 'arquitecto');
      afirmar(v.contratos[0].revision_numero === 2 && v.contratos[0].monto_total === res.monto_contrato && f.necesidad.necesidad > c.v.necesidad_antes_adenda, 'la adenda no actualizó contrato y necesidad');
      afirmar(v.plan.linea_base.version === 2 && v.plan.tareas.find((t) => t.clave === 'F-EST').cantidad === 85, 'el plan no refleja el nuevo alcance');
      afirmar(v.certificados[0].estado === 'aprobado' && v.certificados[0].pago, 'el certificado ya pagado debía conservarse');
      return { id: c.v.adenda, evidencia: { monto_contrato: res.monto_contrato, necesidad_antes: c.v.necesidad_antes_adenda, necesidad_despues: f.necesidad.necesidad, linea_base_version: lb.linea_base_version, fin_previsto: lb.fin_previsto, feed: await feed(c) } };
    }),
    ...licitacion('cubierta', 34, { factores: [0.99, 1.07, 1.03], ganador: 'contratista1', plazos: [20, 25, 22], revision: 'rev2', sufijo: '.r2' }),
    ...adjudicar('cubierta', 38, { ganador: 'contratista1', sufijo: '.r2' }),
    puntoAuditoria('cambio-de-alcance', 38, auditarObra),

    // ── Falla 6: la suba de costo no consigue capital
    crearRonda('fin.ronda3.crear', 38, 42, 'Ronda 3 por la suba de costo, a menor precio (umbral 90%)', (c, f) => {
      const mcu = Math.ceil(f.necesidad.necesidad / 80);
      c.v.pos_antes_r3 = null;
      return { valuacion_pre: 0, precio_mcu: 80, mcu_ofrecidas: mcu, umbral_mcu: Math.ceil(mcu * 0.9) };
    }),
    paso('fin.ronda3.efecto', 38, 'inversor1', 'Ver en la ficha el efecto de la ronda 3 sobre inversores anteriores, nuevos y caja', async (c) => {
      const f = await ficha(c, 'inversor1');
      afirmar(f.ronda.numero === 3 && f.ronda.mcu_previas > 0 && f.ronda.efecto.dilucion_anteriores_pct > 0 && f.ronda.precio_mcu < 90, 'la ficha no muestra dilución ni precio de la ronda 3');
      return { id: c.v.ronda3, evidencia: { precio_ronda_anterior: 90, precio_ronda_3: f.ronda.precio_mcu, mcu_previas: f.ronda.mcu_previas, mcu_ofrecidas: f.ronda.mcu_ofrecidas,
        si_se_completa: { anteriores_pct: f.ronda.efecto.participacion_anteriores_pct, nuevos_pct: f.ronda.efecto.participacion_nuevos_pct, caja_adicional: f.ronda.efecto.capital_objetivo },
        mi_posicion: { mcu: f.mi_posicion.mcu, hoy_pct: f.mi_posicion.participacion_pct, tras_ronda_pct: r2((f.mi_posicion.mcu / (f.ronda.mcu_previas + f.ronda.mcu_ofrecidas)) * 100) } } };
    }),
    suscribir('ronda3', 'inversor2', 39, 0.7, false),
    suscribir('ronda3', 'inversor1', 40, 0.2, true),
    paso('fin.ronda3.cerrar', 42, 'arquitecto', 'Cerrar la ronda 3: falla; nadie se diluye y la caja no cambia', async (c) => {
      const cajaAntes = (await fin(c)).caja.saldo;
      const antes = await ficha(c, 'inversor1');
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda3, fecha: c.fecha() }, c.idem));
      const despues = await ficha(c, 'inversor1');
      const f = await fin(c);
      afirmar(res.resultado === 'fallida' && f.caja.saldo === cajaAntes && despues.mcu_emitidas === antes.mcu_emitidas && despues.mi_posicion.participacion_pct === antes.mi_posicion.participacion_pct, 'la ronda fallida alteró caja o posiciones');
      return { id: c.v.ronda3, evidencia: { ...res, caja_sin_cambio: f.caja.saldo, participacion_inversor1_sin_cambio: despues.mi_posicion.participacion_pct, necesidad_sin_cubrir: f.necesidad.necesidad } };
    }),
    paso('plan.compra-acero-cumplida', 45, 'coordinador', 'Llega el acero', async (c) =>
      ({ evidencia: exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'COMPRA-ACERO', estado: 'cumplida' }, c.idem)) })),
    paso('inv.quiere-salir', 50, 'inversor3', 'Un inversor quiere salir: publica toda su posición y nadie compra', async (c) => {
      const f = await ficha(c, 'inversor3');
      const res = exito(await c.s.inversor3.accion(c.v.obra, 'orden-venta-crear', { cantidad: f.mi_posicion.mcu, precio_mcu: 85 }, c.idem));
      c.v.orden_salida = res.orden_id; c.v.inv3_mcu = f.mi_posicion.mcu; c.v.inv3_costo = f.mi_posicion.costo_total;
      return { id: res.orden_id, evidencia: { estado: res.estado, cantidad: f.mi_posicion.mcu, aviso: res.aviso } };
    }),
    ...avance('F-EST', 'contratista3', 57, 50),
    paso('cert.estructura.2', 58, 'contratista3', 'Certificado 2 (estructura 50%): presentado, aprobado y pagado', async (c) => {
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v.contrato_estructura, fecha: c.fecha(), items: await itemsCertificado(c, 'contratista3', 'estructura', { 'F-02': 50 }) }, c.idem));
      exito(await c.s.contratista3.evidencia(c.v.obra, 'certificado', res.certificado_id, 'acta-2.txt', `Acta de medición 2 firmada · semilla ${c.semilla}`));
      exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: res.certificado_id, decision: 'aprobar' }, c.idem + ':aprobar'));
      const pago = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: res.certificado_id, fecha: c.fecha() }, c.idem + ':pago'));
      return { id: res.certificado_id, evidencia: { monto_neto: res.monto_neto, pago_id: pago.pago_id, caja_despues: pago.caja_despues } };
    }),
    ...avance('F-EST', 'contratista3', 66, 60),

    // ── Falla 7: sin caja para pagar → proceso de cierre
    paso('cert.estructura.3.bloqueado', 67, 'arquitecto', 'Certificado 3 aprobado pero impago: la caja no alcanza sin tocar la reserva → 409', async (c) => {
      const res = exito(await c.s.contratista3.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v.contrato_estructura, fecha: c.fecha(), items: await itemsCertificado(c, 'contratista3', 'estructura', { 'F-02': 60 }) }, c.idem));
      c.v.cert3 = res.certificado_id;
      exito(await c.s.contratista3.evidencia(c.v.obra, 'certificado', res.certificado_id, 'acta-3.txt', `Acta de medición 3 firmada · semilla ${c.semilla}`));
      exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: res.certificado_id, decision: 'aprobar' }, c.idem + ':aprobar'));
      const pago = rechazo(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: res.certificado_id }), 409, 'FONDOS_INSUFICIENTES');
      const f = await fin(c);
      afirmar(f.necesidad.certificados_aprobados_impagos === res.monto_neto && f.necesidad.primer_deficit === 'inmediato', 'el certificado impago no figura como déficit inmediato');
      return { id: res.certificado_id, evidencia: { monto_neto: res.monto_neto, pago, caja: f.caja.saldo, reserva: f.necesidad.reserva_objetivo, deficit: f.necesidad.primer_deficit } };
    }, 'validacion'),
    paso('cierre.liquidar-antes', 67, 'arquitecto', 'Liquidar a inversores con la obra en curso → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'distribucion-crear', { monto: 100, concepto: 'liquidacion' }), 409, 'solo procede con la obra en cierre') }), 'validacion'),
    paso('cierre.iniciar', 68, 'arquitecto', 'Entrar en proceso de cierre: se cancelan órdenes y la reserva se libera', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'obra-estado', { estado: 'en_cierre', motivo: 'La ronda 3 falló y no hay capital para terminar la estructura ni la cubierta.' }, c.idem));
      const f = await feed(c);
      const inv3 = await ficha(c, 'inversor3');
      afirmar(f.estado === 'en_cierre' && inv3.mercado_secundario.ordenes_abiertas.length === 0 && inv3.mi_posicion.mcu === c.v.inv3_mcu, 'el cierre no canceló la orden o alteró la posición');
      return { id: c.v.obra, evidencia: { estado: res.estado, feed: f, orden_de_salida: 'cancelada sin comprador', posicion_inversor3_intacta: inv3.mi_posicion.mcu } };
    }),
    paso('cierre.sin-acciones-nuevas', 68, 'contratista3', 'En cierre no se informa avance ni se abren rondas → 409', async (c) => {
      const a = rechazo(await c.s.contratista3.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['F-EST'], fecha: c.fecha(), porcentaje: 70 }), 409, 'proceso de cierre');
      const b = rechazo(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', { valuacion_pre: 0, precio_mcu: 50, mcu_ofrecidas: 100, umbral_mcu: 50, fecha_apertura: c.fecha(), fecha_cierre: c.fecha(70),
        destino_fondos: [{ concepto: 'x', monto: 1 }], que_se_compra: QUE, condiciones_salida: SALIDA }), 409, 'en cierre');
      return { evidencia: { avance: a, ronda: b } };
    }, 'validacion'),
    paso('cierre.liquidar-con-deuda', 68, 'arquitecto', 'Liquidar a inversores con un certificado aprobado impago → 409 (cobra primero el contratista)', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'distribucion-crear', { monto: 100, concepto: 'liquidacion' }), 409, 'cobran antes') }), 'validacion'),
    paso('cierre.pagar-contratista', 69, 'arquitecto', 'Pagar el certificado 3 con la reserva liberada', async (c) => {
      const pago = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert3, fecha: c.fecha() }, c.idem));
      return { id: pago.pago_id, evidencia: pago };
    }),
    paso('cierre.liquidar', 70, 'arquitecto', 'Liquidar el remanente a prorrata de MCU y cerrar la obra', async (c) => {
      const f = await fin(c);
      afirmar(f.caja.saldo > 0, 'no quedó remanente para liquidar');
      const antes = await cuenta(c, 'inversor3');
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'distribucion-crear', { monto: f.caja.saldo, concepto: 'liquidacion', nota: 'Liquidación por cierre', fecha: c.fecha() }, c.idem));
      const cierre = exito(await c.s.arquitecto.accion(c.v.obra, 'obra-estado', { estado: 'cerrada', motivo: 'Liquidación completa.' }, c.idem + ':cerrar'));
      const despues = await cuenta(c, 'inversor3');
      const recuperado = r2(despues.saldo_disponible - antes.saldo_disponible);
      const v = await ver(c, 'arquitecto');
      afirmar(res.caja_despues === 0 && cierre.estado === 'cerrada' && v.contratos.every((k) => k.estado === 'rescindido'), 'el cierre no dejó caja en cero y contratos rescindidos');
      afirmar(recuperado < c.v.inv3_costo, 'se esperaba una pérdida para el inversor (no hay garantía de salida)');
      return { id: res.distribucion_id, evidencia: { liquidado: res.monto, pagos: res.pagos, estado: cierre.estado, feed: await feed(c),
        inversor_que_quiso_salir: { aportado: c.v.inv3_costo, recuperado, perdida: r2(c.v.inv3_costo - recuperado), mcu: c.v.inv3_mcu } } };
    }),
    puntoAuditoria('final', 70, auditarObra),
  ],
};
