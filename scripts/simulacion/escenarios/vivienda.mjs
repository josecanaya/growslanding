// Escenario 1 · Vivienda con recorrido normal.
// Pliego → plan → ronda única que financia el 100% (terreno, obra, honorarios y reserva) → cotización a tres →
// adjudicación (con dos pedidos simultáneos) → avance → certificado rechazado, corregido y aprobado → pago único.
import { auditarObra } from '../auditor.mjs';
import { afirmar, exito, rechazo } from '../motor.mjs';
import { adjudicar, alta, avance, certificadoSimple, ficha, itemsCertificado, licitacion, paso, plan, pliego, puntoAuditoria, suscribirEIntegrar, ver, verContratista } from './comunes.mjs';

const PARTIDAS = [
  { codigo: 'V-01', paquete: 'obra-gruesa', titulo: 'Fundaciones', alcance: 'Excavación, zapatas corridas y vigas de fundación de HºAº H-21 según plano E-01.', cantidad: 45, unidad: 'm3',
    fuente: 'Plano E-01 Fundaciones', fuente_revision: 'B', evidencia_requerida: 'Remitos de hormigón, fotos de armaduras antes del colado y protocolo de probetas.',
    criterio_aceptacion: 'Cotas ±1 cm, armaduras según planilla, resistencia a 7 días ≥ 65% de la característica.', responsable: 'Contratista de obra gruesa', precio_referencia: 380, orden: 1 },
  { codigo: 'V-02', paquete: 'obra-gruesa', titulo: 'Estructura de HºAº', alcance: 'Columnas, vigas y losa sobre planta baja en HºAº H-25 según planos E-02 y E-03.', cantidad: 60, unidad: 'm3',
    fuente: 'Planos E-02/E-03 Estructura', fuente_revision: 'B', evidencia_requerida: 'Acta de inspección de armaduras, remitos y ensayo de probetas.',
    criterio_aceptacion: 'Inspección municipal aprobada, plomo ≤ 5 mm por piso, sin nidos de abeja.', responsable: 'Contratista de obra gruesa', precio_referencia: 520, orden: 2 },
  { codigo: 'V-03', paquete: 'obra-gruesa', titulo: 'Mampostería de elevación', alcance: 'Muros de ladrillo cerámico hueco 18 cm con dinteles y encadenados según A-03.', cantidad: 220, unidad: 'm2',
    fuente: 'Plano A-03 Planta y cortes', fuente_revision: 'C', evidencia_requerida: 'Fotos por paño con regla y nivel, remito de ladrillos.',
    criterio_aceptacion: 'Plomo y nivel ≤ 3 mm por metro, juntas trabadas, vanos según carpinterías.', responsable: 'Contratista de obra gruesa', precio_referencia: 85, orden: 3 },
];
const TAREAS = [
  { clave: 'V-FUND', titulo: 'Fundaciones', partida_codigo: 'V-01', frente: 'planta baja', cantidad: 45, duracion_dias: 10, etapa: 'Estructura' },
  { clave: 'V-ESTR', titulo: 'Estructura PB y losa', partida_codigo: 'V-02', frente: 'planta baja', cantidad: 60, duracion_dias: 15, etapa: 'Estructura',
    depende_de: [{ clave: 'V-FUND' }], restricciones: [{ clave: 'V-INSP-ARM', tipo: 'inspeccion', descripcion: 'Inspección municipal de armaduras', dia: 20 }] },
  { clave: 'V-MAMP', titulo: 'Mampostería', partida_codigo: 'V-03', frente: 'planta baja', cantidad: 220, duracion_dias: 12, etapa: 'Albañilería',
    depende_de: [{ clave: 'V-ESTR', lag_dias: 7 }], restricciones: [{ clave: 'V-COMPRA-LAD', tipo: 'compra', descripcion: 'Compra de ladrillos cerámicos', dia: 30 }] },
];
const pagar = (id, dia, costoVar, nombre) => paso(id, dia, 'arquitecto', `Pagar ${nombre} desde la caja de obra`, async (c) => {
  const res = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v[costoVar], fecha: c.fecha() }, c.idem));
  return { id: c.v[costoVar], evidencia: res };
});

export default {
  clave: 'vivienda', nombre: 'Vivienda unifamiliar · recorrido normal', inicio: '2026-11-16',
  pasos: () => [
    ...alta({ nombre: 'Casa Los Ceibos', direccion: 'Los Ceibos 1450, Funes, Santa Fe', localidad: 'Funes', tipo: 'vivienda',
      resumen: 'Vivienda unifamiliar de 140 m² en planta baja. Obra de ensayo con datos ficticios.' }),
    ...pliego({ titulo: 'Pliego de obra gruesa', partidas: PARTIDAS }, 1),
    ...plan({ tareas: TAREAS, diaInicio: 8 }, 2),

    // ── Financiación 100% inversora: terreno + obra + honorarios + reserva
    paso('fin.costos', 3, 'arquitecto', 'Registrar terreno, honorarios y reserva', async (c) => {
      const terreno = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'terreno', descripcion: 'Lote Los Ceibos 1450', monto: 60000, fecha_prevista: c.fecha(7) }, c.idem + ':t'));
      const honorarios = exito(await c.s.arquitecto.accion(c.v.obra, 'costo-registrar', { tipo: 'honorarios', descripcion: 'Proyecto y dirección de obra', monto: 12000, fecha_prevista: c.fecha(19) }, c.idem + ':h'));
      exito(await c.s.arquitecto.accion(c.v.obra, 'reserva-ajustar', { monto: 8000, motivo: 'Reserva para imprevistos (ensayo)' }, c.idem + ':r'));
      c.v.costo_terreno = terreno.costo_id; c.v.costo_honorarios = honorarios.costo_id;
      return { id: terreno.costo_id, evidencia: { terreno: 60000, honorarios: 12000, reserva: 8000 } };
    }),
    paso('fin.ronda1.crear', 3, 'arquitecto', 'Calcular la necesidad de fondos y crear la ronda 1 por el 100%', async (c) => {
      const fin = (await ver(c, 'arquitecto')).financiacion;
      afirmar(fin.caja.saldo === 0 && fin.necesidad.necesidad === fin.necesidad.total_requerido, 'la necesidad inicial debe ser el total requerido');
      const precio = 100;
      const mcu = Math.ceil(fin.necesidad.necesidad / precio);
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', {
        simbolo: 'CEIBO', valuacion_pre: 0, precio_mcu: precio, mcu_ofrecidas: mcu, minimo_mcu: 10, umbral_mcu: mcu, fecha_apertura: c.fecha(3), fecha_cierre: c.fecha(6),
        destino_fondos: [{ concepto: 'Terreno', monto: 60000 }, { concepto: 'Obra gruesa (precio de referencia)', monto: fin.necesidad.estimado_sin_contrato }, { concepto: 'Honorarios', monto: 12000 }, { concepto: 'Reserva', monto: 8000 }],
        que_se_compra: 'MCU de la obra Casa Los Ceibos: una fracción del resultado del proyecto completo. No es una unidad ni un crédito.',
        condiciones_salida: 'Sin salida garantizada. Solo se puede transferir si otro inversor compra la orden de venta. Si la ronda no alcanza el umbral, se devuelve lo integrado.',
      }, c.idem));
      c.v.ronda1 = res.ronda_id; c.v.ronda1_mcu = mcu;
      exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-abrir', { ronda_id: res.ronda_id }, c.idem + ':abrir'));
      return { id: res.ronda_id, evidencia: { necesidad: fin.necesidad.necesidad, precio_mcu: precio, mcu_ofrecidas: mcu, umbral_mcu: mcu, valuacion_pre: 0 } };
    }),
    paso('fin.permiso.arquitecto-no-suscribe', 3, 'arquitecto', 'El responsable intenta suscribir su propia ronda → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda1, mcu: 10 }), 403) }), 'permiso'),
    ...licitacion('obra-gruesa', 3, { factores: [1.02, 0.95, 1.08], ganador: 'contratista2' }),
    paso('inv.ronda1.minimo', 4, 'inversor1', 'Suscribir por debajo del aporte mínimo → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.inversor1.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda1, mcu: 3 }), 422, 'aporte mínimo') }), 'validacion'),
    ...suscribirEIntegrar('ronda1', 'inversor1', 4, 700),
    ...suscribirEIntegrar('ronda1', 'inversor2', 4, 470),
    paso('inv.ronda1.inversor3.calc', 4, 'inversor3', 'Suscribir el resto de la ronda', async (c) => {
      const mcu = c.v.ronda1_mcu - 1170;
      const res = exito(await c.s.inversor3.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda1, mcu }, c.idem));
      c.v['inv.ronda1.inversor3'] = res.suscripcion_id;
      return { id: res.suscripcion_id, evidencia: res };
    }),
    paso('fin.prometido-no-es-caja', 5, 'arquitecto', 'Con una suscripción prometida sin integrar, la caja y la necesidad no cambian', async (c) => {
      const fin = (await ver(c, 'arquitecto')).financiacion;
      afirmar(fin.caja.saldo === 0, 'hay caja antes del cierre de la ronda');
      afirmar(fin.necesidad.no_contado.prometido_no_integrado > 0 && fin.necesidad.no_contado.integrado_en_custodia === 117000, 'lo prometido o lo integrado no se informan aparte');
      afirmar(fin.necesidad.necesidad === fin.necesidad.total_requerido, 'lo prometido redujo la necesidad');
      return { id: c.v.ronda1, evidencia: { caja: fin.caja.saldo, ...fin.necesidad.no_contado, necesidad: fin.necesidad.necesidad } };
    }),
    paso('fin.ronda1.cierre-anticipado', 5, 'arquitecto', 'Pagar el terreno antes de cerrar la ronda → 409 fondos insuficientes', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'costo-pagar', { costo_id: c.v.costo_terreno }), 409, 'FONDOS_INSUFICIENTES') }), 'validacion'),
    paso('inv.ronda1.inversor3.integrar', 5, 'inversor3', 'Integrar la suscripción', async (c) =>
      ({ id: c.v['inv.ronda1.inversor3'], evidencia: exito(await c.s.inversor3.accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: c.v['inv.ronda1.inversor3'] }, c.idem)) })),
    paso('inv.ronda1.cupo', 5, 'inversor2', 'Integrar por encima del cupo de la ronda → 409', async (c) => {
      const extra = exito(await c.s.inversor2.accion(c.v.obra, 'suscribir', { ronda_id: c.v.ronda1, mcu: 50 }, c.idem));
      return { id: extra.suscripcion_id, evidencia: rechazo(await c.s.inversor2.accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: extra.suscripcion_id }), 409, 'CUPO_AGOTADO') };
    }, 'validacion'),
    paso('fin.ronda1.cerrar', 6, 'arquitecto', 'Cerrar la ronda 1: lo integrado pasa a caja de obra', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-cerrar', { ronda_id: c.v.ronda1, fecha: c.fecha() }, c.idem));
      afirmar(res.resultado === 'cerrada_exitosa' && res.completa && res.mcu_prometidas_no_contadas === 50, 'la ronda no cerró completa o contó lo prometido');
      const fin = (await ver(c, 'arquitecto')).financiacion;
      afirmar(fin.caja.saldo === res.caja_aportada && fin.cobertura_inversora.cierra_100, 'la caja no refleja el 100% inversor');
      return { id: c.v.ronda1, evidencia: { ...res, cobertura_inversora_pct: fin.cobertura_inversora.pct, presupuesto: fin.presupuesto_total } };
    }),
    pagar('fin.pagar-terreno', 7, 'costo_terreno', 'el terreno'),

    // ── Adjudicación: dos acciones simultáneas y reintento
    paso('lic.obra-gruesa.adjudicacion-simultanea', 7, 'arquitecto', 'Dos adjudicaciones simultáneas sobre la misma solicitud: gana una sola', async (c) => {
      const pedir = (k, n) => c.s.arquitecto.accion(c.v.obra, 'adjudicar', { solicitud_id: c.v['sol_obra-gruesa'], oferta_id: c.v[`oferta_obra-gruesa_${k}`], retencion_pct: 5 }, `${c.idem}:${n}`);
      const [a, b] = await Promise.all([pedir('contratista2', 'a'), pedir('contratista2', 'b')]);
      const ok = [a, b].filter((r) => r.status === 200);
      const conflicto = [a, b].filter((r) => r.status === 409);
      const otra = await pedir('contratista1', 'otra-oferta');
      const contratos = (await ver(c, 'arquitecto')).contratos;
      afirmar(contratos.length === 1 && otra.status === 409 && (c.retomado || (ok.length === 1 && conflicto.length === 1)), `se esperaba 1 éxito y 1 conflicto; hubo ${ok.length} y ${conflicto.length}, contratos: ${contratos.length}`);
      c.v['contrato_obra-gruesa'] = contratos[0].id; c.v.clave_ganadora = `${c.idem}:${a.status === 200 ? 'a' : 'b'}`;
      afirmar(contratos[0].socio_id === c.s.contratista2.identidad.socio_id, 'el contrato no quedó en la oferta elegida');
      return { id: contratos[0].id, evidencia: { simultaneas: [a.status, b.status], otra_oferta_despues: otra.status, contratos_creados: contratos.length, conflicto: conflicto[0]?.cuerpo?.error ?? null } };
    }, 'concurrencia'),
    paso('lic.obra-gruesa.reintento', 7, 'arquitecto', 'Reintentar la adjudicación ganadora con la misma clave: mismo contrato, sin duplicar', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'adjudicar', { solicitud_id: c.v['sol_obra-gruesa'], oferta_id: c.v['oferta_obra-gruesa_contratista2'], retencion_pct: 5 }, c.v.clave_ganadora));
      afirmar(res.repetida === true && res.contrato_id === c.v['contrato_obra-gruesa'], 'el reintento no devolvió el mismo contrato');
      return { id: res.contrato_id, evidencia: { repetida: res.repetida, mismo_contrato: true } };
    }, 'idempotencia'),
    paso('lic.obra-gruesa.tareas-publicadas', 7, 'arquitecto', 'Las tareas del contrato quedan publicadas para el contratista', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', {}, c.idem));
      const obra = await verContratista(c, 'contratista2');
      afirmar(obra.tareas.length === 3 && obra.tareas.every((t) => t.contratada && t.costo > 0), 'faltan tareas publicadas con costo contractual');
      const perdedor = await verContratista(c, 'contratista1');
      afirmar(perdedor.tareas.length === 0 && perdedor.contratos.length === 0, 'un contratista no adjudicado ve tareas o contratos');
      return { id: c.v['contrato_obra-gruesa'], evidencia: { tareas: obra.tareas.map((t) => ({ clave: t.clave, habilitada: t.habilitada, bloqueo: t.bloqueo, costo: t.costo })) } };
    }),

    // ── Ejecución y primera certificación: rechazada, corregida, aprobada
    paso('av.permiso.otro-contratista', 12, 'contratista1', 'Un contratista no adjudicado intenta informar avance → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista1.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['V-FUND'], fecha: c.fecha(), porcentaje: 50 }), 403) }), 'permiso'),
    paso('av.no-habilitada', 12, 'contratista2', 'Informar avance de una tarea con predecesoras sin terminar → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['V-ESTR'], fecha: c.fecha(), porcentaje: 10 }), 409, 'no habilitada') }), 'validacion'),
    ...avance('V-FUND', 'contratista2', 12, 50),
    ...avance('V-FUND', 'contratista2', 17, 100),
    paso('cert.obra-gruesa.1.exceso', 18, 'contratista2', 'Certificar más que el avance físico aceptado → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v['contrato_obra-gruesa'], fecha: c.fecha(), items: await itemsCertificado(c, 'contratista2', 'obra-gruesa', { 'V-01': 100, 'V-02': 20 }) }), 422, 'avance físico aceptado') }), 'validacion'),
    paso('cert.obra-gruesa.1.presentar', 18, 'contratista2', 'Presentar el certificado 1 (fundaciones 100%)', async (c) => {
      const res = exito(await c.s.contratista2.accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v['contrato_obra-gruesa'], fecha: c.fecha(), items: await itemsCertificado(c, 'contratista2', 'obra-gruesa', { 'V-01': 100 }), nota: 'Certificado 1' }, c.idem));
      c.v.cert1 = res.certificado_id;
      return { id: res.certificado_id, evidencia: res };
    }),
    paso('cert.obra-gruesa.1.autoaprobacion', 18, 'contratista2', 'El contratista intenta aprobar su propio certificado → 403', async (c) =>
      ({ id: c.v.cert1, evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'aprobar' }), 403, 'no puede aprobar') }), 'permiso'),
    paso('cert.obra-gruesa.1.sin-evidencia', 18, 'arquitecto', 'Aprobar un certificado sin evidencia → 422', async (c) =>
      ({ id: c.v.cert1, evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'aprobar' }), 422, 'sin evidencia') }), 'validacion'),
    paso('cert.obra-gruesa.1.evidencia', 18, 'contratista2', 'Adjuntar evidencia (solo remitos)', async (c) => {
      const ev = exito(await c.s.contratista2.evidencia(c.v.obra, 'certificado', c.v.cert1, 'remitos-hormigon.txt', `Remitos de hormigón fundaciones · semilla ${c.semilla}`));
      const repetida = exito(await c.s.contratista2.evidencia(c.v.obra, 'certificado', c.v.cert1, 'remitos-hormigon.txt', `Remitos de hormigón fundaciones · semilla ${c.semilla}`));
      afirmar(repetida.evidencia_id === ev.evidencia_id && repetida.repetida, 'subir dos veces el mismo archivo duplicó la evidencia');
      return { id: ev.evidencia_id, evidencia: { sha256: ev.sha256, storage_path: ev.storage_path, version: ev.version, reenvio_sin_duplicar: true } };
    }),
    paso('cert.obra-gruesa.1.pago-sin-aprobar', 18, 'arquitecto', 'Pagar un certificado sin aprobar → 409', async (c) =>
      ({ id: c.v.cert1, evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1 }), 409, 'aprobado') }), 'validacion'),
    paso('cert.obra-gruesa.1.rechazar', 18, 'arquitecto', 'Rechazar: falta el protocolo de probetas exigido por el pliego', async (c) =>
      ({ id: c.v.cert1, evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'rechazar', motivo: 'Falta el protocolo de probetas a 7 días que exige la partida V-01.' }, c.idem)) })),
    paso('cert.obra-gruesa.1.corregir', 19, 'contratista2', 'Corregir: sumar el protocolo de probetas y volver a presentar', async (c) => {
      const ev = exito(await c.s.contratista2.evidencia(c.v.obra, 'certificado', c.v.cert1, 'protocolo-probetas.txt', `Protocolo de probetas 7 días: 68% f'c · semilla ${c.semilla}`));
      const res = exito(await c.s.contratista2.accion(c.v.obra, 'certificado-corregir', { certificado_id: c.v.cert1, items: await itemsCertificado(c, 'contratista2', 'obra-gruesa', { 'V-01': 100 }), nota: 'Se adjunta protocolo de probetas.' }, c.idem));
      afirmar(res.version === 2 && ev.version === 2, 'la corrección no generó la versión 2');
      return { id: c.v.cert1, evidencia: { version: res.version, estado: res.estado, evidencia_v2: ev.sha256 } };
    }),
    paso('cert.obra-gruesa.1.aprobar', 19, 'arquitecto', 'Aprobar el certificado corregido', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v.cert1, decision: 'aprobar' }, c.idem));
      const cert = (await ver(c, 'arquitecto')).certificados.find((x) => x.id === c.v.cert1);
      const acciones = cert.historial.map((h) => h.accion);
      afirmar(JSON.stringify(acciones) === JSON.stringify(['presentado', 'rechazado', 'corregido', 'aprobado']), `historial inesperado: ${acciones}`);
      return { id: c.v.cert1, evidencia: { estado: res.estado, version: res.version, historial: acciones, evidencias: cert.evidencias.map((e) => `v${e.version} ${e.nombre}`) } };
    }),
    paso('cert.obra-gruesa.1.pagar', 19, 'arquitecto', 'Pagar el certificado 1 (escritura que puede cortarse)', async (c) => {
      const pedido = c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1, fecha: c.fecha() }, c.idem);
      const res = exito(await pedido);
      c.cortarSiCorresponde(); // la corrida muere acá: el pago ya se escribió pero el diario no lo anotó
      const cert = (await ver(c, 'arquitecto')).certificados.find((x) => x.id === c.v.cert1);
      afirmar(cert.pago?.id === res.pago_id, 'el pago no quedó asociado al certificado');
      c.v.pago1 = res.pago_id;
      return { id: res.pago_id, evidencia: { monto: res.monto, repetida: res.repetida, retomado_tras_corte: c.retomado, caja_despues: res.caja_despues ?? null } };
    }, 'recuperacion'),
    paso('cert.obra-gruesa.1.doble-pago', 19, 'arquitecto', 'Pedir el pago otra vez con otra clave y con un pedido abortado: sigue habiendo un solo pago', async (c) => {
      const otra = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1, fecha: c.fecha() }, c.idem + ':otra-clave'));
      afirmar(otra.ya_pagado === true && otra.pago_id === c.v.pago1, 'una segunda clave generó otro pago');
      const corte = new AbortController();
      setTimeout(() => corte.abort(), 15);
      let abortado = false;
      try { await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1 }, c.idem + ':abortada', { signal: corte.signal }); } catch { abortado = true; }
      const [a, b] = await Promise.all([1, 2].map((n) => c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v.cert1 }, `${c.idem}:simultanea-${n}`)));
      const fin = (await ver(c, 'arquitecto')).financiacion;
      const pagos = fin.caja.movimientos.filter((m) => m.tipo === 'pago_certificado' && m.ref_id === c.v.cert1);
      afirmar(pagos.length === 1, `hay ${pagos.length} pagos para el certificado`);
      return { id: c.v.pago1, evidencia: { otra_clave: { ya_pagado: otra.ya_pagado, mismo_pago: true }, pedido_abortado: abortado, simultaneas: [a.status, b.status], pagos_del_certificado: pagos.length } };
    }, 'idempotencia'),
    pagar('fin.pagar-honorarios', 19, 'costo_honorarios', 'los honorarios'),
    puntoAuditoria('certificado-1', 19, auditarObra),

    // ── Continuación (corridas siguientes): estructura, mampostería y cierre
    paso('plan.inspeccion-cumplida', 20, 'coordinador', 'Registrar la inspección de armaduras cumplida', async (c) =>
      ({ evidencia: exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'V-INSP-ARM', estado: 'cumplida' }, c.idem)) })),
    ...avance('V-ESTR', 'contratista2', 28, 60),
    ...avance('V-ESTR', 'contratista2', 34, 100),
    ...certificadoSimple(2, 'obra-gruesa', 'contratista2', 35, { 'V-02': 100 }),
    paso('av.compra-pendiente', 42, 'contratista2', 'Empezar mampostería con la compra de ladrillos pendiente → 409', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas['V-MAMP'], fecha: c.fecha(), porcentaje: 20 }), 409, 'Compras o inspecciones pendientes') }), 'validacion'),
    paso('plan.compra-cumplida', 42, 'coordinador', 'Registrar la compra de ladrillos recibida', async (c) =>
      ({ evidencia: exito(await c.s.coordinador.accion(c.v.obra, 'restriccion-actualizar', { clave: 'V-COMPRA-LAD', estado: 'cumplida' }, c.idem)) })),
    ...avance('V-MAMP', 'contratista2', 53, 100),
    ...certificadoSimple(3, 'obra-gruesa', 'contratista2', 54, { 'V-03': 100 }),
    paso('inv.salida-sin-comprador', 56, 'inversor3', 'Un inversor quiere salir: publica una orden de venta y nadie compra', async (c) => {
      const res = exito(await c.s.inversor3.accion(c.v.obra, 'orden-venta-crear', { cantidad: 100, precio_mcu: 104 }, c.idem));
      c.v.orden_salida = res.orden_id;
      const f = await ficha(c, 'inversor3');
      afirmar(f.mercado_secundario.ordenes_abiertas.some((o) => o.id === res.orden_id && o.propia) && f.mi_posicion.mcu === c.v.ronda1_mcu - 1170, 'la orden no quedó abierta o la posición cambió sin comprador');
      return { id: res.orden_id, evidencia: { estado: res.estado, aviso: res.aviso, posicion_sin_cambios: f.mi_posicion.mcu } };
    }),
    paso('plan.cierre', 60, 'arquitecto', 'Recalcular el plan al cierre: físico, certificado y pagado', async (c) => {
      exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fecha_corte: c.fecha() }, c.idem));
      const p = (await ver(c, 'arquitecto', c.fecha())).plan;
      afirmar(p.avances.avance_fisico.pct === 100 && p.avances.certificado.pct === 100 && p.avances.pagado.pct === 95, `avances inesperados: ${JSON.stringify(p.avances)}`);
      return { id: c.v.obra, evidencia: { fisico_pct: p.avances.avance_fisico.pct, certificado_pct: p.avances.certificado.pct, pagado_pct: p.avances.pagado.pct, retenido: p.avances.retenido, atraso_total_dias: p.atraso_total_dias } };
    }),
    paso('inv.salida-cancelada', 60, 'inversor3', 'Sin comprador, el inversor retira la orden y conserva su posición', async (c) =>
      ({ id: c.v.orden_salida, evidencia: exito(await c.s.inversor3.accion(c.v.obra, 'orden-venta-cancelar', { orden_id: c.v.orden_salida }, c.idem)) })),
    puntoAuditoria('final', 60, auditarObra),
  ],
};
