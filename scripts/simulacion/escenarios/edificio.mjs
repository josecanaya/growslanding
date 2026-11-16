// Escenario 2 · Edificio por etapas con estructura y paquetes comunes, y circuito completo del inversor.
// La estructura común se planifica por frentes, pero se licita, contrata, certifica y paga UNA vez por edificio.
// Financiación en dos rondas (precio distinto por etapa), vínculo posición–unidad, transferencia entre inversores y distribución.
import { auditarObra } from '../auditor.mjs';
import { afirmar, exito, rechazo } from '../motor.mjs';
import { adjudicar, alta, avance, certificadoSimple, ficha, itemsCertificado, licitacion, paso, plan, pliego, puntoAuditoria, suscribirEIntegrar, ver } from './comunes.mjs';

const comun = (codigo, paquete, titulo, alcance, cantidad, unidad, precio, orden, fuente) => ({
  codigo, paquete, titulo, alcance, cantidad, unidad, fuente, fuente_revision: 'A', es_comun: true, precio_referencia: precio, orden,
  evidencia_requerida: 'Remitos, fotos fechadas por frente y acta de medición firmada.',
  criterio_aceptacion: 'Conforme a planos y pliego de especificaciones técnicas, sin observaciones de la dirección de obra.',
  responsable: `Contratista de ${paquete}`,
});
const terminacion = (unidad, m2, orden) => ({
  codigo: `T-${unidad}`, paquete: 'terminaciones', titulo: `Terminaciones interiores unidad ${unidad}`, alcance: `Revoques finos, pisos, pintura y carpinterías interiores de la unidad ${unidad}.`,
  cantidad: m2, unidad: 'm2', fuente: 'Planos A-10 a A-14 y planilla de locales', fuente_revision: 'A', unidad_codigo: unidad, es_comun: false, precio_referencia: 300, orden,
  evidencia_requerida: 'Fotos por local y planilla de terminaciones firmada.', criterio_aceptacion: 'Planilla de locales cumplida; sin fisuras ni manchas; pendientes de piso ≤ 2 mm/m.',
  responsable: 'Contratista de terminaciones',
});
const UNIDADES = [{ codigo: 'A1', descripcion: 'PB frente', m2: 60 }, { codigo: 'A2', descripcion: 'PB contrafrente', m2: 45 }, { codigo: 'B1', descripcion: '1° frente', m2: 60 }, { codigo: 'B2', descripcion: '1° contrafrente', m2: 45 }];
const PARTIDAS = [
  comun('E-01', 'estructura', 'Fundaciones y submuración', 'Bases, vigas de fundación y submuración de medianeras en HºAº H-25.', 80, 'm3', 400, 1, 'Plano E-01'),
  comun('E-02', 'estructura', 'Estructura de HºAº', 'Columnas, vigas y losas de planta baja, primer piso y cubierta en HºAº H-25.', 150, 'm3', 540, 2, 'Planos E-02 a E-06'),
  comun('I-01', 'instalaciones', 'Montantes sanitarias y pluviales', 'Montantes, colectoras y conexión a red de las instalaciones sanitarias comunes.', 1, 'gl', 18000, 3, 'Planos IS-01/IS-02'),
  comun('I-02', 'instalaciones', 'Tablero general y montantes eléctricas', 'Tablero general, montantes y puesta a tierra del edificio.', 1, 'gl', 14000, 4, 'Planos IE-01/IE-02'),
  ...UNIDADES.map((u, i) => terminacion(u.codigo, u.m2, 5 + i)),
];
const TAREAS = [
  { clave: 'E-FUND', titulo: 'Fundaciones', partida_codigo: 'E-01', frente: 'subsuelo', cantidad: 80, duracion_dias: 14, etapa: 'Estructura' },
  // Una sola partida (E-02) repartida en tres frentes, con el encofrado como recurso compartido.
  { clave: 'E-EST-PB', titulo: 'Estructura planta baja', partida_codigo: 'E-02', frente: 'planta baja', cantidad: 60, duracion_dias: 12, etapa: 'Estructura',
    depende_de: [{ clave: 'E-FUND' }], restricciones: [{ clave: 'R-ENC-PB', tipo: 'recurso', recurso_clave: 'encofrado', descripcion: 'Juego de encofrado' }] },
  { clave: 'E-EST-N1', titulo: 'Estructura primer piso', partida_codigo: 'E-02', frente: 'primer piso', cantidad: 50, duracion_dias: 12, etapa: 'Estructura',
    depende_de: [{ clave: 'E-EST-PB', lag_dias: 5 }], restricciones: [{ clave: 'R-ENC-N1', tipo: 'recurso', recurso_clave: 'encofrado', descripcion: 'Juego de encofrado' }] },
  { clave: 'E-EST-CUB', titulo: 'Estructura cubierta', partida_codigo: 'E-02', frente: 'cubierta', cantidad: 40, duracion_dias: 10, etapa: 'Estructura',
    depende_de: [{ clave: 'E-EST-N1', lag_dias: 5 }], restricciones: [{ clave: 'R-ENC-CUB', tipo: 'recurso', recurso_clave: 'encofrado', descripcion: 'Juego de encofrado' },
      { clave: 'INSP-EST', tipo: 'inspeccion', descripcion: 'Inspección municipal de estructura', dia: 57 }] },
  { clave: 'I-SAN', titulo: 'Montantes sanitarias', partida_codigo: 'I-01', frente: 'núcleo', cantidad: 1, duracion_dias: 15, etapa: 'Instalaciones',
    depende_de: [{ clave: 'E-EST-PB' }], restricciones: [{ clave: 'R-MONT-SAN', tipo: 'recurso', recurso_clave: 'montacargas', descripcion: 'Montacargas de obra' }] },
  { clave: 'I-ELE', titulo: 'Tablero y montantes eléctricas', partida_codigo: 'I-02', frente: 'núcleo', cantidad: 1, duracion_dias: 12, etapa: 'Instalaciones',
    depende_de: [{ clave: 'E-EST-PB' }], restricciones: [{ clave: 'R-MONT-ELE', tipo: 'recurso', recurso_clave: 'montacargas', descripcion: 'Montacargas de obra' },
      { clave: 'COMPRA-TABLERO', tipo: 'compra', descripcion: 'Compra del tablero general', dia: 55 }] },
  ...UNIDADES.map((u) => ({ clave: `T-${u.codigo}`, titulo: `Terminaciones ${u.codigo}`, partida_codigo: `T-${u.codigo}`, frente: `unidad ${u.codigo}`, cantidad: u.m2, duracion_dias: 10, etapa: 'Terminaciones',
    depende_de: [{ clave: 'I-SAN' }, { clave: 'I-ELE' }, { clave: u.codigo.startsWith('B') ? 'E-EST-CUB' : 'E-EST-N1' }],
    restricciones: [{ clave: `R-TERM-${u.codigo}`, tipo: 'recurso', recurso_clave: 'cuadrilla-terminaciones', descripcion: 'Cuadrilla de terminaciones' }] })),
];
const SALIDA = 'Sin salida garantizada: una MCU solo se transfiere si otro inversor compra la orden de venta. Si la ronda no alcanza el umbral, se devuelve lo integrado.';
const QUE = 'MCU del edificio Pasaje Alvear: fracción del resultado del proyecto completo. Vincularla a una unidad no crea un segundo derecho.';
const posiciones = async (c) => Object.fromEntries(await Promise.all(['inversor1', 'inversor2', 'inversor3'].map(async (k) => {
  const f = await ficha(c, k);
  return [k, { mcu: f.mi_posicion.mcu, pct: f.mi_posicion.participacion_pct }];
})));
const saldo = async (c, k) => exito(await c.s[k].get('/api/inversion/posicion')).fondos.saldo_disponible;

export default {
  clave: 'edificio', nombre: 'Edificio por etapas · estructura y paquetes comunes', inicio: '2026-11-16',
  pasos: () => [
    ...alta({ nombre: 'Pasaje Alvear', direccion: 'Pasaje Alvear 742, Rosario, Santa Fe', localidad: 'Rosario', tipo: 'edificio', unidades: UNIDADES,
      resumen: 'Edificio de planta baja y un piso con cuatro unidades. Obra de ensayo con datos ficticios.' }),
    ...pliego({ titulo: 'Pliego general del edificio', partidas: PARTIDAS }, 1),
    ...plan({ tareas: TAREAS, diaInicio: 10 }, 2),
    paso('plan.frentes-y-recursos', 2, 'coordinador', 'Verificar: partida común repartida en frentes y recursos compartidos sin superposición', async (c) => {
      const v = await ver(c, 'coordinador');
      const e02 = v.pliegos[0].revisiones[0].partidas.find((p) => p.codigo === 'E-02');
      afirmar(e02.es_comun && e02.tareas.length === 3 && e02.tareas.reduce((s, t) => s + t.cantidad, 0) === 150, 'E-02 no quedó repartida en tres frentes por su cantidad total');
      const t = Object.fromEntries(v.plan.tareas.map((x) => [x.clave, x]));
      afirmar(t['I-ELE'].plan.inicio > t['I-SAN'].plan.fin || t['I-SAN'].plan.inicio > t['I-ELE'].plan.fin, 'las dos tareas que comparten montacargas se superponen');
      const term = ['T-A1', 'T-A2', 'T-B1', 'T-B2'].map((k) => t[k]).sort((a, b) => a.plan.inicio.localeCompare(b.plan.inicio));
      afirmar(term.every((x, i) => i === 0 || x.plan.inicio > term[i - 1].plan.fin), 'la cuadrilla de terminaciones está en dos unidades a la vez');
      afirmar(t['I-ELE'].plan.inicio >= c.fecha(55) && t['E-EST-CUB'].plan.inicio >= c.fecha(57), 'la compra o la inspección no condicionan las fechas');
      return { id: c.v.obra, evidencia: { frentes_E02: e02.tareas, montacargas: { 'I-SAN': t['I-SAN'].plan, 'I-ELE': t['I-ELE'].plan }, terminaciones: term.map((x) => `${x.clave} ${x.plan.inicio}→${x.plan.fin}`), ruta_critica: v.plan.ruta_critica } };
    }),

    // ── Etapa 1: terreno + estructura + honorarios
    paso('fin.costos', 3, 'arquitecto', 'Registrar terreno y honorarios', async (c) => {
      const terreno = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'terreno', descripcion: 'Lote Pasaje Alvear 742', monto: 120000, fecha_prevista: c.fecha(9) }, c.idem + ':t'));
      const honorarios = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'honorarios', descripcion: 'Proyecto y dirección de obra', monto: 25000, fecha_prevista: c.fecha(30) }, c.idem + ':h'));
      c.v.costo_terreno = terreno.costo_id; c.v.costo_honorarios = honorarios.costo_id;
      return { id: terreno.costo_id, evidencia: { terreno: 120000, honorarios: 25000 } };
    }),
    paso('fin.ronda1.crear', 3, 'arquitecto', 'Ronda 1 (etapa 1): terreno, estructura y honorarios', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', {
        simbolo: 'ALVEAR', valuacion_pre: 0, precio_mcu: 100, mcu_ofrecidas: 2580, minimo_mcu: 10, umbral_mcu: 2064, fecha_apertura: c.fecha(3), fecha_cierre: c.fecha(8),
        destino_fondos: [{ concepto: 'Terreno', monto: 120000 }, { concepto: 'Estructura común (precio de referencia)', monto: 113000 }, { concepto: 'Honorarios', monto: 25000 }],
        que_se_compra: QUE, condiciones_salida: SALIDA }, c.idem));
      c.v.ronda1 = res.ronda_id;
      exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-abrir', { ronda_id: res.ronda_id }, c.idem + ':abrir'));
      return { id: res.ronda_id, evidencia: { precio_mcu: 100, mcu_ofrecidas: 2580, umbral_mcu: 2064, capital_objetivo: 258000 } };
    }),
    ...licitacion('estructura', 3, { factores: [0.97, 1.04, 1.1], ganador: 'contratista1', plazos: [60, 70, 65] }),
    ...suscribirEIntegrar('ronda1', 'inversor1', 4, 1200),
    ...suscribirEIntegrar('ronda1', 'inversor2', 4, 900),
    ...suscribirEIntegrar('ronda1', 'inversor3', 5, 480),
    paso('fin.ronda1.cerrar', 8, 'arquitecto', 'Cerrar la ronda 1', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda1, fecha: c.fecha() }, c.idem));
      afirmar(res.resultado === 'cerrada_exitosa' && res.caja_aportada === 258000, 'la ronda 1 no aportó lo esperado');
      c.v.posiciones_r1 = await posiciones(c);
      return { id: c.v.ronda1, evidencia: { ...res, posiciones: c.v.posiciones_r1 } };
    }),
    ...adjudicar('estructura', 8, { ganador: 'contratista1' }),
    paso('fin.pagar-terreno', 9, 'arquitecto', 'Pagar el terreno', async (c) =>
      ({ id: c.v.costo_terreno, evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_terreno, fecha: c.fecha() }, c.idem)) })),
    paso('comun.una-sola-licitacion', 9, 'arquitecto', 'Volver a licitar la estructura común ya contratada → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'solicitud-crear', { revision_id: c.v.rev1, paquete: 'estructura', socio_ids: [c.s.contratista2.identidad.socio_id] }), 409, 'ya tiene una solicitud vigente') }), 'validacion'),

    // ── Posiciones vinculadas a unidades e imputación de costos comunes
    paso('unidad.vincular.inversor1', 9, 'inversor1', 'Vincular la posición a la unidad A1', async (c) =>
      ({ evidencia: exito(await c.s.inversor1.accion(c.v.obra, 'posicion-vincular-unidad', { unidad_codigo: 'A1' }, c.idem)) })),
    paso('unidad.vincular.duplicada', 9, 'inversor2', 'Otro inversor intenta vincularse a la misma unidad → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.inversor2.accion(c.v.obra, 'posicion-vincular-unidad', { unidad_codigo: 'A1' }), 409, 'ya está vinculada') }), 'validacion'),
    paso('unidad.vincular.inversor2', 9, 'inversor2', 'Vincular la posición a la unidad B1', async (c) =>
      ({ evidencia: exito(await c.s.inversor2.accion(c.v.obra, 'posicion-vincular-unidad', { unidad_codigo: 'B1' }, c.idem)) })),
    paso('unidad.imputacion', 9, 'arquitecto', 'Imputar costos comunes a unidades por superficie, sin duplicar partidas', async (c) => {
      const im = (await ver(c, 'arquitecto')).imputacion;
      afirmar(im.cierra && im.control.partidas_duplicadas.length === 0, 'la imputación no cierra o duplica partidas');
      afirmar(im.control.contratos_por_partida_comun.every((x) => x.contratos <= 1), 'una partida común tiene más de un contrato');
      const a1 = im.unidades.find((u) => u.unidad === 'A1');
      afirmar(a1.posicion_vinculada && a1.costo_directo === 18000 && a1.costo_comun_imputado > 0, 'A1 sin posición vinculada o sin costo imputado');
      return { id: c.v.obra, evidencia: { regla: im.regla, costo_comun: im.costo_comun, costo_total: im.costo_total, imputado: im.imputado,
        unidades: im.unidades.map((u) => ({ unidad: u.unidad, coef_pct: u.coeficiente_pct, directo: u.costo_directo, comun: u.costo_comun_imputado, total: u.costo_total, resultado_pct: u.posicion_vinculada?.participacion_resultado_pct ?? null })) } };
    }),
    puntoAuditoria('etapa-1-financiada', 9, auditarObra),

    // ── Ejecución de la estructura común: tres frentes, un contrato, certificados sobre una sola partida
    ...avance('E-FUND', 'contratista1', 23, 100),
    ...certificadoSimple(1, 'estructura', 'contratista1', 24, { 'E-01': 100 }),
    ...licitacion('instalaciones', 25, { factores: [1.06, 0.98, 1.03], ganador: 'contratista2', plazos: [40, 35, 45] }),
    ...adjudicar('instalaciones', 30, { ganador: 'contratista2' }),
    paso('fin.pagar-honorarios', 30, 'arquitecto', 'Pagar honorarios', async (c) =>
      ({ id: c.v.costo_honorarios, evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_honorarios, fecha: c.fecha() }, c.idem)) })),
    ...avance('E-EST-PB', 'contratista1', 35, 100),

    // ── Etapa 2: instalaciones + terminaciones + reserva, a otro precio
    paso('fin.ronda2.crear', 38, 'arquitecto', 'Ronda 2 (etapa 2): necesidad calculada desde contratos, cronograma de pagos y caja', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'reserva-ajustar', { monto: 15000, motivo: 'Reserva de la etapa 2 (ensayo)' }, c.idem + ':reserva'));
      const fin = (await ver(c, 'arquitecto')).financiacion;
      afirmar(fin.necesidad.necesidad > 0 && fin.necesidad.cronograma_pagos.length > 1, 'no hay necesidad de fondos o falta el cronograma de pagos');
      const precio = 115; // precio ofrecido de la etapa 2; la valuación previa es informativa
      const mcu = Math.ceil(fin.necesidad.necesidad / precio);
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', {
        valuacion_pre: 2580 * precio, precio_mcu: precio, mcu_ofrecidas: mcu, minimo_mcu: 10, umbral_mcu: Math.ceil(mcu * 0.8), fecha_apertura: c.fecha(38), fecha_cierre: c.fecha(44),
        destino_fondos: [{ concepto: 'Saldo de estructura e instalaciones contratadas', monto: fin.necesidad.contratado_pendiente }, { concepto: 'Terminaciones por unidad (precio de referencia)', monto: fin.necesidad.estimado_sin_contrato }, { concepto: 'Reserva', monto: 15000 }],
        que_se_compra: QUE, condiciones_salida: SALIDA }, c.idem));
      c.v.ronda2 = res.ronda_id; c.v.ronda2_mcu = mcu;
      exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-abrir', { ronda_id: res.ronda_id }, c.idem + ':abrir'));
      const r = (await ver(c, 'arquitecto')).rondas.find((x) => x.id === res.ronda_id);
      return { id: res.ronda_id, evidencia: { necesidad: fin.necesidad, valuacion_pre: r.valuacion_pre, precio_mcu: r.precio_mcu, mcu_ofrecidas: r.mcu_ofrecidas, efecto: r.efecto } };
    }),
    paso('inv.ronda2.inversor2', 39, 'inversor2', 'Suscribir e integrar 40% de la ronda 2', async (c) => {
      const mcu = Math.floor(c.v.ronda2_mcu * 0.4);
      const s = exito(await c.s.inversor2.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda2, mcu }, c.idem));
      return { id: s.suscripcion_id, evidencia: exito(await c.s.inversor2.accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: s.suscripcion_id }, c.idem + ':int')) };
    }),
    paso('inv.ronda2.inversor3', 40, 'inversor3', 'Suscribir e integrar el resto de la ronda 2', async (c) => {
      const mcu = c.v.ronda2_mcu - Math.floor(c.v.ronda2_mcu * 0.4);
      const s = exito(await c.s.inversor3.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda2, mcu }, c.idem));
      return { id: s.suscripcion_id, evidencia: exito(await c.s.inversor3.accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: s.suscripcion_id }, c.idem + ':int')) };
    }),
    paso('fin.ronda2.cerrar', 44, 'arquitecto', 'Cerrar la ronda 2 y medir el efecto sobre inversores anteriores, nuevos y caja', async (c) => {
      const cajaAntes = (await ver(c, 'arquitecto')).financiacion.caja.saldo;
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda2, fecha: c.fecha() }, c.idem));
      const despues = await posiciones(c);
      const fin = (await ver(c, 'arquitecto')).financiacion;
      afirmar(res.resultado === 'cerrada_exitosa' && despues.inversor1.mcu === c.v.posiciones_r1.inversor1.mcu && despues.inversor1.pct < c.v.posiciones_r1.inversor1.pct, 'el inversor anterior debía conservar sus MCU y diluirse en porcentaje');
      afirmar(fin.caja.saldo === Math.round((cajaAntes + res.caja_aportada) * 100) / 100 && fin.necesidad.necesidad === 0, 'la caja no refleja la ronda o queda necesidad sin cubrir');
      return { id: c.v.ronda2, evidencia: { resultado: res.resultado, caja_antes: cajaAntes, caja_aportada: res.caja_aportada, caja_despues: fin.caja.saldo,
        inversores_anteriores: { antes: c.v.posiciones_r1, despues }, nota: 'inversor1 no suscribió la ronda 2: mismas MCU, menor porcentaje' } };
    }),
    ...licitacion('terminaciones', 45, { factores: [1.05, 1.02, 0.96], ganador: 'contratista3', plazos: [50, 55, 45] }),
    ...adjudicar('terminaciones', 50, { ganador: 'contratista3' }),
    ...avance('I-SAN', 'contratista2', 50, 100),
    ...avance('E-EST-N1', 'contratista1', 52, 100),
    paso('cert.estructura.2.exceso', 53, 'contratista1', 'Certificar la partida común por encima de los frentes terminados → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista1.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v.contrato_estructura, fecha: c.fecha(), items: await itemsCertificado(c, 'contratista1', 'estructura', { 'E-02': 90 }) }), 422, 'avance físico aceptado') }), 'validacion'),
    ...certificadoSimple(2, 'estructura', 'contratista1', 53, { 'E-02': 73.33 }),
    puntoAuditoria('estructura-parcial', 54, auditarObra),
    paso('plan.compra-tablero', 55, 'coordinador', 'Registrar la compra del tablero recibida', async (c) =>
      ({ evidencia: exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'COMPRA-TABLERO', estado: 'cumplida' }, c.idem)) })),
    paso('plan.inspeccion-estructura', 57, 'coordinador', 'Registrar la inspección de estructura cumplida', async (c) =>
      ({ evidencia: exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'INSP-EST', estado: 'cumplida' }, c.idem)) })),

    // ── Mercado secundario: comprar una MCU existente transfiere la posición y paga al vendedor
    paso('mcu.venta.exceso', 60, 'inversor1', 'Ofrecer más MCU de las que se tienen → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.inversor1.accion(c.v.obra, 'orden-venta-crear', { cantidad: 999999, precio_mcu: 120 }), 422, 'Podés ofrecer hasta') }), 'validacion'),
    paso('mcu.venta.crear', 60, 'inversor1', 'Publicar una orden de venta de 300 MCU', async (c) => {
      const res = exito(await c.s.inversor1.accion(c.v.obra, 'orden-venta-crear', { cantidad: 300, precio_mcu: 120 }, c.idem));
      c.v.orden = res.orden_id;
      return { id: res.orden_id, evidencia: res };
    }),
    paso('mcu.venta.comprar', 61, 'inversor3', 'Comprar la orden: la posición cambia de titular y el dinero va al vendedor', async (c) => {
      const antes = { pos: await posiciones(c), vendedor: await saldo(c, 'inversor1'), comprador: await saldo(c, 'inversor3'), caja: (await ver(c, 'arquitecto')).financiacion.caja.saldo };
      const res = exito(await c.s.inversor3.accion(c.v.obra, 'orden-venta-comprar', { orden_id: c.v.orden }, c.idem));
      const despues = { pos: await posiciones(c), vendedor: await saldo(c, 'inversor1'), comprador: await saldo(c, 'inversor3'), caja: (await ver(c, 'arquitecto')).financiacion.caja.saldo };
      afirmar(despues.pos.inversor1.mcu === antes.pos.inversor1.mcu - 300 && despues.pos.inversor3.mcu === antes.pos.inversor3.mcu + 300, 'la posición no se transfirió');
      afirmar(despues.vendedor === antes.vendedor + 36000 && despues.comprador === antes.comprador - 36000, 'el dinero no fue del comprador al vendedor');
      afirmar(despues.caja === antes.caja && res.caja_obra_antes === res.caja_obra_despues, 'la transferencia movió la caja de obra');
      const f = await ficha(c, 'inversor1');
      afirmar(f.mcu_emitidas === Object.values(despues.pos).reduce((s, p) => s + p.mcu, 0), 'la transferencia cambió la cantidad emitida');
      return { id: c.v.orden, evidencia: { monto: res.monto, vendedor: { antes: antes.vendedor, despues: despues.vendedor }, comprador: { antes: antes.comprador, despues: despues.comprador },
        caja_obra: { antes: antes.caja, despues: despues.caja }, posiciones: despues.pos, mcu_emitidas_sin_cambio: f.mcu_emitidas } };
    }),
    paso('mcu.venta.ya-ejecutada', 61, 'inversor2', 'Comprar una orden ya ejecutada → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.inversor2.accion(c.v.obra, 'orden-venta-comprar', { orden_id: c.v.orden }), 409, 'ya no está disponible') }), 'validacion'),

    // ── Resto de la obra
    ...avance('I-ELE', 'contratista2', 66, 100),
    ...certificadoSimple(1, 'instalaciones', 'contratista2', 67, { 'I-01': 100, 'I-02': 100 }),
    ...avance('E-EST-CUB', 'contratista1', 67, 100),
    ...certificadoSimple(3, 'estructura', 'contratista1', 68, { 'E-02': 100 }),
    ...avance('T-A1', 'contratista3', 78, 100),
    ...avance('T-A2', 'contratista3', 88, 100),
    ...certificadoSimple(1, 'terminaciones', 'contratista3', 89, { 'T-A1': 100, 'T-A2': 100 }),
    ...avance('T-B1', 'contratista3', 98, 100),
    ...avance('T-B2', 'contratista3', 108, 100),
    ...certificadoSimple(2, 'terminaciones', 'contratista3', 109, { 'T-B1': 100, 'T-B2': 100 }),
    paso('fin.distribucion', 112, 'arquitecto', 'Obra terminada: liberar la reserva y distribuir excedente a prorrata de MCU', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'reserva-ajustar', { monto: 0, motivo: 'Obra terminada: se libera la reserva' }, c.idem + ':reserva'));
      const fin = (await ver(c, 'arquitecto')).financiacion;
      // Se conserva en caja el fondo de reparo retenido a los contratistas.
      const disponible = Math.floor(fin.caja.saldo - fin.necesidad.contratado_pendiente);
      afirmar(disponible > 0, `no hay excedente para distribuir (caja ${fin.caja.saldo}, comprometido ${fin.necesidad.contratado_pendiente})`);
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'distribucion-crear', { monto: disponible, concepto: 'resultado', nota: 'Excedente de caja del ensayo', fecha: c.fecha() }, c.idem));
      afirmar(Math.abs(res.pagos.reduce((s, p) => s + p.monto, 0) - disponible) < 0.005, 'la distribución no suma el total');
      return { id: res.distribucion_id, evidencia: { monto: disponible, mcu_base: res.mcu_base, pagos: res.pagos, caja_despues: res.caja_despues, fondo_de_reparo_en_caja: fin.necesidad.contratado_pendiente } };
    }),
    paso('plan.cierre', 112, 'arquitecto', 'Plan al cierre: físico, certificado y pagado por separado', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha() }, c.idem));
      const p = (await ver(c, 'arquitecto', c.fecha())).plan;
      afirmar(p.avances.avance_fisico.pct === 100 && p.avances.certificado.pct === 100 && p.avances.pagado.pct === 95, `avances inesperados: ${JSON.stringify(p.avances)}`);
      return { id: c.v.obra, evidencia: { fisico_pct: 100, certificado_pct: 100, pagado_pct: 95, retenido: p.avances.retenido, atraso_total_dias: p.atraso_total_dias, fin_linea_base: p.linea_base.fin, fin_previsto: p.fin_previsto } };
    }),
    puntoAuditoria('final', 112, auditarObra),
  ],
};
