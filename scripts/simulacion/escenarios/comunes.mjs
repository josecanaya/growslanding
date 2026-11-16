// Bloques de pasos reutilizables por los tres escenarios. Todo ocurre por las APIs normales del
// producto con la sesión de cada actor; acá no hay acceso administrativo ni escrituras directas a la base.
import { afirmar, exito, rechazo } from '../motor.mjs';

export const paso = (id, dia, actor, accion, ejecutar, tipo = 'producto') => ({ id, dia, actor, accion, ejecutar, tipo });
const r2 = (n) => Math.round(n * 100) / 100;

/** Estado del circuito visto por un actor. */
export async function ver(c, actor, corte) {
  return exito(await c.s[actor].get(`/api/obras/${c.v.obra}/circuito${corte ? `?corte=${corte}` : ''}`), `vista de ${actor}`);
}
export async function verContratista(c, actor) {
  const todo = exito(await c.s[actor].get('/api/socio/circuito'), `trabajo de ${actor}`);
  const obra = todo.obras.find((o) => o.obra.id === c.v.obra);
  afirmar(obra, `${actor} no ve la obra en su trabajo`);
  return obra;
}
export const ficha = async (c, actor) => exito(await c.s[actor ?? 'inversor1'].get(`/api/inversion/obras/${c.v.obra}`, actor ? {} : { anonimo: true }), 'ficha de inversión');

// ───────────────────────── Alta de obra, agenda, participantes y publicación en el feed
export function alta(cfg) {
  const nombre = (c) => `[SIM] ${cfg.nombre} · semilla ${c.semilla}`;
  return [
    paso('alta.obra', 0, 'arquitecto', 'Crear la obra', async (c) => {
      // La creación de obra no es idempotente en el producto: antes de crear se busca por nombre exacto.
      const lista = exito(await c.s.arquitecto.get('/api/obras'), 'listar obras');
      const previa = (lista.data ?? []).find((o) => (o.name ?? o.nombre) === nombre(c));
      const obra = previa ?? exito(await c.s.arquitecto.post('/api/obras', { org_id: c.s.arquitecto.identidad.org_id, nombre: nombre(c), localizacion: cfg.direccion, tipo_obra: cfg.tipo }), 'crear obra').obra;
      c.v.obra = obra.id;
      return { id: obra.id, evidencia: { reutilizada: Boolean(previa), nombre: nombre(c) } };
    }),
    ...['contratista1', 'contratista2', 'contratista3'].map((k) => paso(`alta.agenda.${k}`, 0, 'arquitecto', `Agendar a ${k}`, async (c) => {
      const res = exito(await c.s.arquitecto.post('/api/cliente/socios/agendar', { socioId: c.s[k].identidad.socio_id, source: 'id' }), 'agendar');
      return { id: c.s[k].identidad.socio_id, evidencia: { ya_estaba: res.data?.alreadyInAgenda ?? null } };
    })),
    ...['coordinador', 'auditor'].map((rol) => paso(`alta.participante.${rol}`, 0, 'arquitecto', `Sumar ${rol} a la obra`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'participante-agregar', { user_id: c.s[rol].id, rol }, c.idem));
      return { id: res.participante_id, evidencia: { rol } };
    })),
    ...(cfg.unidades ? [paso('alta.unidades', 0, 'arquitecto', `Cargar ${cfg.unidades.length} unidades`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'unidades-guardar', { unidades: cfg.unidades }, c.idem));
      return { id: c.v.obra, evidencia: res };
    })] : []),
    paso('alta.feed', 0, 'arquitecto', 'Publicar la obra en el feed', async (c) => {
      const actual = exito(await c.s.arquitecto.get(`/api/obras/${c.v.obra}/publicacion`), 'leer publicación');
      if (!actual.publication.visible) {
        exito(await c.s.arquitecto.put(`/api/obras/${c.v.obra}/publicacion`, { revision: actual.revision, publication: {
          visible: true, title: cfg.nombre, summary: cfg.resumen, location: cfg.localidad, stage: 'Proyecto y contratación', coverUrl: '', progress: 0,
          contractorNotes: 'Se licita por paquetes con pliego publicado.', investorNotes: 'Inversión ficticia de ensayo con MCU. Sin dinero real.',
          milestones: [{ title: 'Pliego publicado', status: 'pendiente' }, { title: 'Estructura', status: 'pendiente' }] } }), 'publicar');
      }
      const feed = await c.s.inversor1.get('/inversores', { anonimo: true });
      afirmar(feed.status === 200 && JSON.stringify(feed.cuerpo).includes(cfg.nombre), 'la obra no aparece en el feed público');
      return { id: c.v.obra, evidencia: { feed: '/inversores?obra=' + c.v.obra + '&vista=inversor', visible_sin_sesion: true } };
    }),
    paso('alta.permiso.inversor-no-ve-obra', 0, 'inversor1', 'Un inversor intenta leer el circuito interno de la obra → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.inversor1.get(`/api/obras/${c.v.obra}/circuito`), 403) }), 'permiso'),
  ];
}

// ───────────────────────── Pliego: ingeniería general → detalle → publicable
const GENERAL = ['codigo', 'paquete', 'titulo', 'alcance', 'es_comun', 'unidad_codigo', 'precio_referencia', 'orden'];
export function pliego(cfg, dia) {
  const soloGeneral = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => GENERAL.includes(k)));
  return [
    paso('pliego.crear', dia, 'arquitecto', 'Crear pliego (ingeniería general)', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'pliego-crear', { titulo: cfg.titulo }, c.idem));
      c.v.pliego = res.pliego_id; c.v.rev1 = res.revision_id;
      return { id: res.pliego_id, evidencia: { revision_id: res.revision_id, numero: res.numero } };
    }),
    paso('pliego.general', dia, 'arquitecto', `Cargar ${cfg.partidas.length} partidas con alcance general`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'partidas-guardar', { revision_id: c.v.rev1, partidas: cfg.partidas.map(soloGeneral) }, c.idem));
      return { id: c.v.rev1, evidencia: res };
    }),
    paso('pliego.permiso.contratista-no-edita', dia, 'contratista1', 'Un contratista intenta editar el pliego → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista1.accion(c.v.obra, 'partidas-guardar', { revision_id: c.v.rev1, partidas: [{ codigo: 'X-99', titulo: 'Intrusa', alcance: 'x' }] }), 403) }), 'permiso'),
    paso('pliego.detalle', dia, 'arquitecto', 'Pasar a ingeniería de detalle', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'pliego-avanzar', { revision_id: c.v.rev1, etapa: 'ingenieria_detalle' }, c.idem));
      return { id: c.v.rev1, evidencia: res };
    }),
    paso('pliego.publicar-incompleto', dia, 'arquitecto', 'Intentar publicar sin cantidad, fuente, evidencia, criterio ni responsable → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.arquitecto.accion(c.v.obra, 'pliego-avanzar', { revision_id: c.v.rev1, etapa: 'publicable' }), 422, 'No es publicable') }), 'validacion'),
    paso('pliego.completar', dia, 'arquitecto', 'Completar cantidad, unidad, fuente y revisión, evidencia, criterio y responsable', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'partidas-guardar', { revision_id: c.v.rev1, partidas: cfg.partidas }, c.idem));
      c.v.precios_ref = cfg.partidas.map((p) => [p.codigo, p.precio_referencia]);
      return { id: c.v.rev1, evidencia: res };
    }),
    paso('pliego.publicar', dia, 'arquitecto', 'Publicar el pliego (revisión 1)', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'pliego-avanzar', { revision_id: c.v.rev1, etapa: 'publicable' }, c.idem));
      afirmar(res.estado === 'publicada' && res.huella, 'la revisión no quedó publicada con huella');
      const vista = await ver(c, 'arquitecto');
      const incompletas = vista.pliegos[0].revisiones[0].partidas.filter((p) => !(p.alcance && p.cantidad > 0 && p.unidad && p.fuente && p.fuente_revision && p.evidencia_requerida && p.criterio_aceptacion && p.responsable));
      afirmar(incompletas.length === 0, 'hay partidas publicadas sin todos los campos');
      return { id: c.v.rev1, evidencia: { huella: res.huella, partidas: vista.pliegos[0].revisiones[0].partidas.length } };
    }),
  ];
}

// ───────────────────────── Planificación: tareas por frente, dependencias, recursos, compras, inspecciones
export function plan(cfg, dia) {
  return [
    paso('plan.guardar', dia, 'coordinador', `Planificar ${cfg.tareas.length} tareas vinculadas a partidas`, async (c) => {
      const tareas = cfg.tareas.map((t) => ({ ...t, restricciones: t.restricciones?.map((r) => ({ ...r, ...(r.dia !== undefined ? { fecha_disponible: c.fecha(r.dia), dia: undefined } : {}) })) }));
      const res = exito(await c.s.coordinador.accion(c.v.obra, 'plan-guardar', { fecha_inicio: c.fecha(cfg.diaInicio), tareas: JSON.parse(JSON.stringify(tareas)) }, c.idem));
      c.v.tareas = res.tareas;
      return { id: c.v.obra, evidencia: { nuevas: res.nuevas, actualizadas: res.actualizadas, tareas: Object.keys(res.tareas).length } };
    }),
    paso('plan.permiso.contratista-no-planifica', dia, 'contratista2', 'Un contratista intenta cambiar el plan → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.contratista2.accion(c.v.obra, 'plan-guardar', { fecha_inicio: c.fecha(0), tareas: [{ clave: 'X', titulo: 'Intrusa', partida_codigo: cfg.tareas[0].partida_codigo, cantidad: 1, duracion_dias: 1 }] }), 403) }), 'permiso'),
    paso('plan.exceso', dia, 'coordinador', 'Intentar repartir más cantidad que la partida → 422', async (c) =>
      ({ evidencia: rechazo(await c.s.coordinador.accion(c.v.obra, 'plan-guardar', { fecha_inicio: c.fecha(cfg.diaInicio),
        tareas: [{ clave: 'EXCESO', titulo: 'Tarea sobrante', partida_codigo: cfg.tareas[0].partida_codigo, cantidad: 999999, duracion_dias: 1 }] }), 422, 'superan la cantidad') }), 'validacion'),
    paso('plan.linea-base', dia, 'arquitecto', 'Calcular cronograma y fijar línea base', async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'plan-recalcular', { fijar_linea_base: true, motivo: 'Línea base inicial' }, c.idem));
      const vista = await ver(c, 'arquitecto', c.fecha());
      afirmar(vista.plan.linea_base?.version === 1 && vista.plan.curva_s.length > 1 && vista.plan.ruta_critica.length > 0, 'faltan línea base, curva S o ruta crítica');
      afirmar(vista.plan.tareas.every((t) => t.linea_base && t.plan.inicio), 'hay tareas sin fechas');
      return { id: res.linea_base_id, evidencia: { fin_previsto: res.fin_previsto, duracion_dias: res.duracion_total_dias, ruta_critica: res.ruta_critica, puntos_curva_s: vista.plan.curva_s.length } };
    }),
  ];
}

// ───────────────────────── Cotización a tres contratistas, comparación y adjudicación
/** factores: precio de cada contratista respecto del precio de referencia. */
export function licitacion(paquete, dia, { factores, ganador, plazos = [45, 40, 50], revision = 'rev1', sufijo = '' }) {
  const id = (x) => `lic.${paquete}${sufijo}.${x}`;
  const sol = `sol_${paquete}${sufijo}`;
  const contratistas = ['contratista1', 'contratista2', 'contratista3'];
  return [
    paso(id('solicitud'), dia, 'arquitecto', `Pedir cotización de «${paquete}» a tres contratistas`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'solicitud-crear', { revision_id: c.v[revision], paquete, fecha_limite: c.fecha(dia + 4),
        socio_ids: contratistas.map((k) => c.s[k].identidad.socio_id) }, c.idem));
      c.v[sol] = res.solicitud_id;
      afirmar(res.invitados === 3, 'no quedaron tres invitados');
      return { id: res.solicitud_id, evidencia: { revision: res.revision_numero, invitados: res.invitados } };
    }),
    ...contratistas.map((k, i) => paso(id(`oferta.${k}`), dia + 1 + i, k, `Cotizar la revisión recibida de «${paquete}»`, async (c) => {
      const obra = await verContratista(c, k);
      const s = obra.solicitudes.find((x) => x.id === c.v[sol]);
      afirmar(s, 'el contratista no ve la solicitud');
      const partidas = obra.pliegos[0].revisiones.find((r) => r.id === s.revision_id).partidas.filter((p) => p.paquete === paquete);
      afirmar(partidas.length && partidas.every((p) => p.alcance && p.criterio_aceptacion && !('precio_referencia' in p)), 'el alcance recibido está incompleto o filtra el precio de referencia');
      const ref = Object.fromEntries(c.v.precios_ref ?? []);
      const items = partidas.map((p) => ({ partida_codigo: p.codigo, precio_unitario: r2((ref[p.codigo] ?? 100) * factores[i] * (0.99 + c.rng() * 0.02)) }));
      const res = exito(await c.s[k].accion(c.v.obra, 'oferta-enviar', { solicitud_id: s.id, revision_id: s.revision_id, items, plazo_dias: plazos[i], condiciones: 'Anticipo 0%. Pago contra certificado aprobado.' }, c.idem));
      c.v[`oferta_${paquete}${sufijo}_${k}`] = res.oferta_id;
      afirmar(res.revision_id === s.revision_id, 'la oferta no quedó ligada a la revisión recibida');
      return { id: res.oferta_id, evidencia: { revision_cotizada: s.revision_numero, monto_total: res.monto_total, partidas: items.length } };
    })),
    paso(id('comparar'), dia + 4, 'arquitecto', 'Comparar las tres ofertas sobre la misma revisión', async (c) => {
      const s = (await ver(c, 'arquitecto')).solicitudes.find((x) => x.id === c.v[sol]);
      afirmar(s.ofertas.length === 3 && s.ofertas.every((o) => o.misma_revision && o.estado === 'enviada'), 'no hay tres ofertas comparables');
      return { id: s.id, evidencia: { revision: s.revision_numero, ofertas: s.ofertas.map((o) => ({ contratista: o.contratista, monto: o.monto_total, plazo_dias: o.plazo_dias })) } };
    }),
    paso(id('permiso.coordinador-no-adjudica'), dia + 4, 'coordinador', 'El coordinador intenta adjudicar → 403', async (c) =>
      ({ evidencia: rechazo(await c.s.coordinador.accion(c.v.obra, 'adjudicar', { solicitud_id: c.v[sol], oferta_id: c.v[`oferta_${paquete}${sufijo}_${ganador}`] }), 403) }), 'permiso'),
  ];
}
export function adjudicar(paquete, dia, { ganador, sufijo = '' }) {
  const sol = `sol_${paquete}${sufijo}`;
  return [paso(`lic.${paquete}${sufijo}.adjudicar`, dia, 'arquitecto', `Adjudicar «${paquete}» a ${ganador} y publicar sus tareas`, async (c) => {
    const res = exito(await c.s.arquitecto.accion(c.v.obra, 'adjudicar', { solicitud_id: c.v[sol], oferta_id: c.v[`oferta_${paquete}${sufijo}_${ganador}`], retencion_pct: 5 }, c.idem));
    c.v[`contrato_${paquete}`] = res.contrato_id;
    const obra = await verContratista(c, ganador);
    afirmar(obra.tareas.length >= res.tareas_publicadas && res.tareas_publicadas > 0, 'el contratista no ve sus tareas publicadas');
    return { id: res.contrato_id, evidencia: { monto: res.monto_total, tareas_publicadas: res.tareas_publicadas } };
  })];
}

// ───────────────────────── Avance con evidencia y certificación
export function avance(clave, contratista, dia, porcentaje, { sufijo = '' } = {}) {
  const id = `av.${clave}.${porcentaje}${sufijo}`;
  return [
    paso(`${id}.informar`, dia, contratista, `Informar ${porcentaje}% de ${clave} con evidencia`, async (c) => {
      const res = exito(await c.s[contratista].accion(c.v.obra, 'avance-informar', { tarea_id: c.v.tareas[clave], fecha: c.fecha(), porcentaje, nota: `Parte diario ${clave}` }, c.idem));
      c.v[id] = res.avance_id;
      const ev = exito(await c.s[contratista].evidencia(c.v.obra, 'avance', res.avance_id, `parte-${clave}-${porcentaje}.txt`, `Parte de avance ${clave} ${porcentaje}% · ${c.fecha()} · semilla ${c.semilla}`));
      return { id: res.avance_id, evidencia: { evidencia_id: ev.evidencia_id, sha256: ev.sha256, storage_path: ev.storage_path } };
    }),
    paso(`${id}.aceptar`, dia, 'arquitecto', `Revisar y aceptar el avance de ${clave}`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'avance-revisar', { avance_id: c.v[id], decision: 'aceptar' }, c.idem));
      return { id: c.v[id], evidencia: res };
    }),
  ];
}
export async function itemsCertificado(c, contratista, paquete, porcentajes) {
  const contrato = (await verContratista(c, contratista)).contratos.find((k) => k.id === c.v[`contrato_${paquete}`]);
  return Object.entries(porcentajes).map(([codigo, pct]) => ({ contrato_item_id: contrato.items.find((i) => i.partida_codigo === codigo).id, porcentaje_acumulado: pct }));
}
/** Certificado en el camino feliz: presentar con evidencia → aprobar → pagar. */
export function certificadoSimple(n, paquete, contratista, dia, porcentajes) {
  const id = `cert.${paquete}.${n}`;
  return [
    paso(`${id}.presentar`, dia, contratista, `Presentar certificado ${n} de «${paquete}» con evidencia`, async (c) => {
      const res = exito(await c.s[contratista].accion(c.v.obra, 'certificado-presentar', { contrato_id: c.v[`contrato_${paquete}`], fecha: c.fecha(), items: await itemsCertificado(c, contratista, paquete, porcentajes), nota: `Certificado ${n}` }, c.idem));
      c.v[id] = res.certificado_id;
      const ev = exito(await c.s[contratista].evidencia(c.v.obra, 'certificado', res.certificado_id, `acta-medicion-${paquete}-${n}.txt`, `Acta de medición ${paquete} N°${n} · ${c.fecha()} · semilla ${c.semilla}`));
      return { id: res.certificado_id, evidencia: { numero: res.numero, monto_neto: res.monto_neto, sha256: ev.sha256 } };
    }),
    paso(`${id}.aprobar`, dia, 'arquitecto', `Aprobar certificado ${n} de «${paquete}»`, async (c) =>
      ({ id: c.v[id], evidencia: exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-revisar', { certificado_id: c.v[id], decision: 'aprobar' }, c.idem)) })),
    paso(`${id}.pagar`, dia + 1, 'arquitecto', `Pagar certificado ${n} de «${paquete}»`, async (c) => {
      const res = exito(await c.s.arquitecto.accion(c.v.obra, 'certificado-pagar', { certificado_id: c.v[id], fecha: c.fecha() }, c.idem));
      return { id: res.pago_id, evidencia: { monto: res.monto, caja_despues: res.caja_despues } };
    }),
  ];
}

// ───────────────────────── Inversión
export function suscribirEIntegrar(ronda, inversor, dia, mcu, { integra = true, sufijo = '' } = {}) {
  const id = `inv.${ronda}.${inversor}${sufijo}`;
  return [
    paso(`${id}.suscribir`, dia, inversor, `Entrar por el feed y suscribir ${mcu} MCU`, async (c) => {
      const f = await ficha(c, inversor);
      afirmar(f.ronda?.estado === 'abierta' && f.ronda.aporte_minimo > 0 && f.ronda.que_se_compra && f.ronda.destino_fondos.length && f.ronda.condiciones_salida && f.ronda.fecha_cierre,
        'la ficha no muestra aporte mínimo, qué se compra, destino, estado, fecha o condiciones de salida');
      const res = exito(await c.s[inversor].accion(c.v.obra, 'suscribir', { ronda_id: c.v[ronda], mcu }, c.idem));
      c.v[id] = res.suscripcion_id;
      return { id: res.suscripcion_id, evidencia: { estado: res.estado, monto: res.monto, aporte_minimo: f.ronda.aporte_minimo, participacion_si_se_completa_pct: r2((mcu / (f.ronda.mcu_previas + f.ronda.mcu_ofrecidas)) * 100) } };
    }),
    ...(integra ? [paso(`${id}.integrar`, dia + 1, inversor, `Integrar la suscripción (dinero ficticio a custodia de la ronda)`, async (c) => {
      const res = exito(await c.s[inversor].accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: c.v[id] }, c.idem));
      return { id: c.v[id], evidencia: res };
    })] : []),
  ];
}

/** Auditoría de un punto del recorrido: se registra como paso para que quede en el diario. */
export function puntoAuditoria(id, dia, auditar) {
  return paso(`auditoria.${id}`, dia, 'auditor', 'Releer lo persistido y contrastar lo que ve cada rol', async (c) => {
    const informe = await auditar(c);
    afirmar(informe.fallas.length === 0, `auditoría con ${informe.fallas.length} hallazgos: ${informe.fallas.join(' | ')}`);
    return { id: c.v.obra, evidencia: { controles: informe.controles.length, hallazgos: 0, resumen: informe.resumen } };
  }, 'auditoria');
}
