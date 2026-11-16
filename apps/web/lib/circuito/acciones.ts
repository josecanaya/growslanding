import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { calculoParaPersistir, cargarObra, vistaFinanciacion } from './lecturas';
import { CircuitoError, rolesEnObra, rpc, type Db } from './servidor';

const id = z.string().uuid();
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const texto = (max = 2000) => z.string().trim().max(max);
const dinero = z.number().positive().max(1e11);
const partida = z.object({
  codigo: texto(40).min(1), paquete: texto(80).optional(), titulo: texto(200).optional(), alcance: texto(4000).optional(),
  cantidad: z.number().positive().optional(), unidad: texto(40).optional(), fuente: texto(300).optional(), fuente_revision: texto(80).optional(),
  evidencia_requerida: texto(1000).optional(), criterio_aceptacion: texto(1000).optional(), responsable: texto(200).optional(),
  es_comun: z.boolean().optional(), unidad_codigo: texto(40).nullable().optional(), precio_referencia: z.number().positive().optional(),
  orden: z.number().int().optional(), eliminar: z.boolean().optional(),
}).strict();
const tarea = z.object({
  clave: texto(60).min(1), titulo: texto(200).min(2), partida_codigo: texto(40).min(1), frente: texto(80).optional(),
  cantidad: z.number().positive(), duracion_dias: z.number().int().min(1).max(2000), etapa: texto(80).optional(),
  depende_de: z.array(z.object({ clave: texto(60), lag_dias: z.number().int().min(0).max(365).optional() })).max(30).optional(),
  restricciones: z.array(z.object({ clave: texto(60).min(1), tipo: z.enum(['recurso', 'compra', 'inspeccion']), descripcion: texto(300).optional(),
    recurso_clave: texto(60).optional(), fecha_disponible: dia.optional() })).max(10).optional(),
}).strict();
const precios = z.array(z.object({ partida_codigo: texto(40).min(1), precio_unitario: dinero }).strict()).min(1).max(500);
const certItems = z.array(z.object({ contrato_item_id: id, porcentaje_acumulado: z.number().positive().max(100) }).strict()).min(1).max(500);

type Ctx = { db: Db; user: User; obraId: string; idem: string | null };
type Accion<S extends z.ZodTypeAny> = { schema: S; run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown> };
const accion = <S extends z.ZodTypeAny>(schema: S, run: Accion<S>['run']): Accion<S> => ({ schema, run });
const base = (c: Ctx) => ({ p_actor: c.user.id, p_idem: c.idem });

/** Acciones del circuito. Cada una valida la forma acá y el permiso dentro de la función circ_* (misma transacción que la escritura). */
export const ACCIONES: Record<string, Accion<any>> = {
  // ── Pliego
  'pliego-crear': accion(z.object({ titulo: texto(200).min(2) }).strict(), (c, b) => rpc(c.db, 'circ_pliego_crear', { ...base(c), p_obra: c.obraId, p_titulo: b.titulo })),
  'partidas-guardar': accion(z.object({ revision_id: id, partidas: z.array(partida).min(1).max(500) }).strict(),
    (c, b) => rpc(c.db, 'circ_pliego_guardar_partidas', { ...base(c), p_revision: b.revision_id, p_partidas: b.partidas })),
  'pliego-avanzar': accion(z.object({ revision_id: id, etapa: z.enum(['ingenieria_detalle', 'publicable']) }).strict(),
    (c, b) => rpc(c.db, 'circ_pliego_avanzar', { ...base(c), p_revision: b.revision_id, p_etapa: b.etapa })),
  'pliego-nueva-revision': accion(z.object({ pliego_id: id, motivo: texto(1000).min(3) }).strict(),
    (c, b) => rpc(c.db, 'circ_pliego_nueva_revision', { ...base(c), p_pliego: b.pliego_id, p_motivo: b.motivo })),
  'unidades-guardar': accion(z.object({ unidades: z.array(z.object({ codigo: texto(40).min(1), descripcion: texto(200).optional(), m2: z.number().positive() }).strict()).min(1).max(500) }).strict(),
    (c, b) => rpc(c.db, 'circ_unidades_guardar', { ...base(c), p_obra: c.obraId, p_unidades: b.unidades })),
  'participante-agregar': accion(z.object({ user_id: id, rol: z.enum(['coordinador', 'auditor']) }).strict(),
    (c, b) => rpc(c.db, 'circ_participante_agregar', { ...base(c), p_obra: c.obraId, p_user: b.user_id, p_rol: b.rol })),
  // ── Plan
  'plan-guardar': accion(z.object({ fecha_inicio: dia, tareas: z.array(tarea).min(1).max(1000) }).strict(),
    (c, b) => rpc(c.db, 'circ_plan_guardar', { ...base(c), p_obra: c.obraId, p_fecha_inicio: b.fecha_inicio, p_tareas: b.tareas })),
  'plan-recalcular': accion(z.object({ fecha_corte: dia.optional(), fijar_linea_base: z.boolean().optional(), motivo: texto(500).optional() }).strict(), async (c, b) => {
    const roles = await rolesEnObra(c.db, c.obraId, c.user.id);
    if (!roles.responsable && !roles.coordinador) throw new CircuitoError(403, 'Solo el responsable o el coordinador pueden planificar esta obra', '42501');
    const m = await cargarObra(c.db, c.obraId);
    if (!m.tareas.length) throw new CircuitoError(409, 'La obra no tiene tareas planificadas', 'GR409');
    let plan;
    try { plan = calculoParaPersistir(m, b.fecha_corte ?? null); } catch (e) { throw new CircuitoError(422, (e as Error).message, 'GR422'); }
    const res = await rpc<Record<string, unknown>>(c.db, 'circ_plan_aplicar', { ...base(c), p_obra: c.obraId, p_calculo: plan.calculo,
      p_fijar_linea_base: b.fijar_linea_base ?? false, p_motivo: b.motivo ?? null });
    return { ...res, fin_previsto: plan.cronograma.fin, duracion_total_dias: plan.cronograma.duracionTotal,
      ruta_critica: plan.cronograma.rutaCritica.map((t) => m.partidaTareas.find((pt) => pt.tarea_id === t)?.clave) };
  }),
  'restriccion-actualizar': accion(z.object({ clave: texto(60).min(1), fecha_disponible: dia.optional(), estado: z.enum(['pendiente', 'cumplida']).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_restriccion_actualizar', { ...base(c), p_obra: c.obraId, p_clave: b.clave, p_fecha: b.fecha_disponible ?? null, p_estado: b.estado ?? null })),
  // ── Cotización y contrato
  'solicitud-crear': accion(z.object({ revision_id: id, paquete: texto(80).min(1), titulo: texto(200).optional(), fecha_limite: dia.optional(), socio_ids: z.array(id).min(1).max(20) }).strict(),
    (c, b) => rpc(c.db, 'circ_solicitud_crear', { ...base(c), p_obra: c.obraId, p_revision: b.revision_id, p_paquete: b.paquete, p_titulo: b.titulo ?? '', p_fecha_limite: b.fecha_limite ?? null, p_socios: b.socio_ids })),
  'oferta-enviar': accion(z.object({ solicitud_id: id, revision_id: id, items: precios, plazo_dias: z.number().int().positive().max(5000), condiciones: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_oferta_enviar', { ...base(c), p_solicitud: b.solicitud_id, p_revision: b.revision_id, p_items: b.items, p_plazo: b.plazo_dias, p_condiciones: b.condiciones ?? '' })),
  adjudicar: accion(z.object({ solicitud_id: id, oferta_id: id, retencion_pct: z.number().min(0).max(20).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_adjudicar', { ...base(c), p_solicitud: b.solicitud_id, p_oferta: b.oferta_id, p_retencion_pct: b.retencion_pct ?? 5 })),
  'adenda-proponer': accion(z.object({ contrato_id: id, revision_id: id, items: precios, motivo: texto(1000).min(3) }).strict(),
    (c, b) => rpc(c.db, 'circ_adenda_proponer', { ...base(c), p_contrato: b.contrato_id, p_revision: b.revision_id, p_items: b.items, p_motivo: b.motivo })),
  'adenda-responder': accion(z.object({ adenda_id: id, acepta: z.boolean() }).strict(),
    (c, b) => rpc(c.db, 'circ_adenda_responder', { ...base(c), p_adenda: b.adenda_id, p_acepta: b.acepta })),
  // ── Avance y certificación
  'avance-informar': accion(z.object({ tarea_id: id, fecha: dia, porcentaje: z.number().positive().max(100), nota: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_avance_informar', { ...base(c), p_tarea: b.tarea_id, p_fecha: b.fecha, p_porcentaje: b.porcentaje, p_nota: b.nota ?? '' })),
  'avance-corregir': accion(z.object({ avance_id: id, porcentaje: z.number().positive().max(100).optional(), nota: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_avance_corregir', { ...base(c), p_avance: b.avance_id, p_porcentaje: b.porcentaje ?? null, p_nota: b.nota ?? null })),
  'avance-revisar': accion(z.object({ avance_id: id, decision: z.enum(['aceptar', 'observar']), observacion: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_avance_revisar', { ...base(c), p_avance: b.avance_id, p_decision: b.decision, p_observacion: b.observacion ?? null })),
  'certificado-presentar': accion(z.object({ contrato_id: id, fecha: dia, items: certItems, nota: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_certificado_presentar', { ...base(c), p_contrato: b.contrato_id, p_fecha: b.fecha, p_items: b.items, p_nota: b.nota ?? '' })),
  'certificado-corregir': accion(z.object({ certificado_id: id, items: certItems, nota: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_certificado_corregir', { ...base(c), p_certificado: b.certificado_id, p_items: b.items, p_nota: b.nota ?? null })),
  'certificado-revisar': accion(z.object({ certificado_id: id, decision: z.enum(['aprobar', 'rechazar']), motivo: texto(2000).optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_certificado_revisar', { ...base(c), p_certificado: b.certificado_id, p_decision: b.decision, p_motivo: b.motivo ?? null })),
  'certificado-pagar': accion(z.object({ certificado_id: id, fecha: dia.optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_pago_certificado', { ...base(c), p_certificado: b.certificado_id, p_fecha: b.fecha ?? null })),
  // ── Costos, caja y estado
  'costo-registrar': accion(z.object({ tipo: z.enum(['terreno', 'honorarios', 'otros']), descripcion: texto(200).min(2), monto: dinero, fecha_prevista: dia }).strict(),
    (c, b) => rpc(c.db, 'circ_costo_registrar', { ...base(c), p_obra: c.obraId, p_tipo: b.tipo, p_descripcion: b.descripcion, p_monto: b.monto, p_fecha: b.fecha_prevista })),
  'costo-pagar': accion(z.object({ costo_id: id, fecha: dia.optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_costo_pagar', { ...base(c), p_costo: b.costo_id, p_fecha: b.fecha ?? null })),
  'reserva-ajustar': accion(z.object({ monto: z.number().min(0).max(1e11), motivo: texto(500).min(3) }).strict(),
    (c, b) => rpc(c.db, 'circ_reserva_ajustar', { ...base(c), p_obra: c.obraId, p_monto: b.monto, p_motivo: b.motivo })),
  'obra-estado': accion(z.object({ estado: z.enum(['normal', 'reprogramada', 'en_cierre', 'cerrada']), hasta: dia.optional(), motivo: texto(1000).min(3) }).strict(),
    (c, b) => rpc(c.db, 'circ_obra_estado', { ...base(c), p_obra: c.obraId, p_estado: b.estado, p_hasta: b.hasta ?? null, p_motivo: b.motivo })),
  // ── Rondas MCU (responsable)
  'ronda-crear': accion(z.object({
    simbolo: texto(12).optional(), valuacion_pre: z.number().min(0).max(1e12), precio_mcu: dinero, mcu_ofrecidas: z.number().int().positive().max(1e9),
    minimo_mcu: z.number().int().positive().optional(), umbral_mcu: z.number().int().positive(), fecha_apertura: dia, fecha_cierre: dia,
    destino_fondos: z.array(z.object({ concepto: texto(120).min(1), monto: z.number().min(0) }).strict()).min(1).max(30),
    que_se_compra: texto(1000).min(10), condiciones_salida: texto(2000).min(10),
  }).strict(), async (c, b) => {
    const roles = await rolesEnObra(c.db, c.obraId, c.user.id);
    if (!roles.responsable) throw new CircuitoError(403, 'Solo el responsable de la obra puede realizar esta acción', '42501');
    // La ronda guarda la necesidad de fondos calculada en el momento (contratos, cronograma de pagos y caja).
    const necesidad = vistaFinanciacion(await cargarObra(c.db, c.obraId)).necesidad;
    return rpc(c.db, 'circ_ronda_crear', { ...base(c), p_obra: c.obraId, p_datos: { ...b, necesidad_fondos: necesidad } });
  }),
  'ronda-abrir': accion(z.object({ ronda_id: id }).strict(), (c, b) => rpc(c.db, 'circ_ronda_abrir', { ...base(c), p_ronda: b.ronda_id })),
  'ronda-cerrar': accion(z.object({ ronda_id: id, fecha: dia.optional() }).strict(), (c, b) => rpc(c.db, 'circ_ronda_cerrar', { ...base(c), p_ronda: b.ronda_id, p_fecha: b.fecha ?? null })),
  'distribucion-crear': accion(z.object({ monto: dinero, concepto: z.enum(['resultado', 'liquidacion']), nota: texto(500).optional(), fecha: dia.optional() }).strict(),
    (c, b) => rpc(c.db, 'circ_distribucion_crear', { ...base(c), p_obra: c.obraId, p_monto: b.monto, p_concepto: b.concepto, p_nota: b.nota ?? '', p_fecha: b.fecha ?? null })),
  // ── Inversor
  suscribir: accion(z.object({ ronda_id: id, mcu: z.number().int().positive().max(1e9) }).strict(), (c, b) => rpc(c.db, 'circ_suscribir', { ...base(c), p_ronda: b.ronda_id, p_mcu: b.mcu })),
  'suscripcion-integrar': accion(z.object({ suscripcion_id: id }).strict(), (c, b) => rpc(c.db, 'circ_suscripcion_integrar', { ...base(c), p_suscripcion: b.suscripcion_id })),
  'suscripcion-cancelar': accion(z.object({ suscripcion_id: id }).strict(), (c, b) => rpc(c.db, 'circ_suscripcion_cancelar', { ...base(c), p_suscripcion: b.suscripcion_id })),
  'orden-venta-crear': accion(z.object({ cantidad: z.number().int().positive(), precio_mcu: dinero }).strict(),
    (c, b) => rpc(c.db, 'circ_orden_venta_crear', { ...base(c), p_obra: c.obraId, p_cantidad: b.cantidad, p_precio: b.precio_mcu })),
  'orden-venta-comprar': accion(z.object({ orden_id: id }).strict(), (c, b) => rpc(c.db, 'circ_orden_venta_comprar', { ...base(c), p_orden: b.orden_id })),
  'orden-venta-cancelar': accion(z.object({ orden_id: id }).strict(), (c, b) => rpc(c.db, 'circ_orden_venta_cancelar', { ...base(c), p_orden: b.orden_id })),
  'posicion-vincular-unidad': accion(z.object({ unidad_codigo: texto(40).min(1) }).strict(),
    (c, b) => rpc(c.db, 'circ_posicion_vincular_unidad', { ...base(c), p_obra: c.obraId, p_unidad_codigo: b.unidad_codigo })),
};
