import type { SupabaseClient } from '@supabase/supabase-js';

import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

/** PostgREST puede devolver relaciones embebidas como objeto o como array de un elemento. */
function unwrapRelationEmbed<T>(val: T | T[] | null | undefined): T | null {
  if (val == null) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

type TareaPresupuestoEmbed = {
  id: string;
  title: string | null;
  org_id: string;
  obra_id: string | null;
  obras?: { name: string | null } | Array<{ name: string | null }> | null;
};

function parseTareaPresupuestoEmbed(raw: unknown): TareaPresupuestoEmbed | null {
  const t = unwrapRelationEmbed(raw as TareaPresupuestoEmbed | TareaPresupuestoEmbed[] | null);
  if (!t?.id || !t.org_id) return null;
  return t;
}

function obraNombreFromEmbed(
  obras: TareaPresupuestoEmbed['obras'],
): string | null {
  const o = unwrapRelationEmbed(obras ?? null);
  return o?.name ?? null;
}

export type SolicitudCambioListItem = {
  id: string;
  presupuesto_id: string;
  socio_id: string;
  monto_actual: number;
  monto_propuesto: number;
  motivo: string;
  estado: string;
  created_at: string;
  socio_nombre: string | null;
  tarea_id: string;
  tarea_titulo: string | null;
  obra_id: string | null;
  obra_nombre: string | null;
  org_id: string;
};

export async function resolveClienteOwnerOrgIds(
  supabaseAny: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabaseAny
    .from('organizations')
    .select('id')
    .eq('user_id', userId);
  return ((data ?? []) as Array<{ id: string }>).map((o) => o.id);
}

export async function listSolicitudesCambioPendientes(
  supabaseAny: SupabaseClient,
  orgIds: string[],
): Promise<SolicitudCambioListItem[]> {
  if (orgIds.length === 0) return [];

  const { data: presupRows, error: presErr } = await supabaseAny
    .from('tareas_presupuestos')
    .select(
      `
      id,
      tarea_id,
      estado,
      tareas!inner (
        id,
        title,
        org_id,
        obra_id,
        obras ( id, name )
      )
    `,
    )
    .in('tareas.org_id', orgIds);

  if (presErr) {
    throw new Error(presErr.message || 'No se pudieron cargar presupuestos de la organización');
  }

  const presupuestoMeta = new Map<
    string,
    {
      tarea_id: string;
      tarea_titulo: string | null;
      org_id: string;
      obra_id: string | null;
      obra_nombre: string | null;
      estado: string | null;
    }
  >();

  for (const p of presupRows ?? []) {
    const tarea = parseTareaPresupuestoEmbed(p.tareas);
    if (!tarea || !orgIds.includes(tarea.org_id)) continue;
    if (!estadoPresupuestoEsAprobado(p.estado)) continue;
    presupuestoMeta.set(p.id, {
      tarea_id: p.tarea_id ?? tarea.id,
      tarea_titulo: tarea.title,
      org_id: tarea.org_id,
      obra_id: tarea.obra_id,
      obra_nombre: obraNombreFromEmbed(tarea.obras),
      estado: p.estado,
    });
  }

  const presupuestoIds = [...presupuestoMeta.keys()];
  if (presupuestoIds.length === 0) return [];

  const { data: solicitudes, error } = await supabaseAny
    .from('presupuesto_solicitudes_cambio')
    .select(
      `
      id,
      presupuesto_id,
      socio_id,
      monto_actual,
      monto_propuesto,
      motivo,
      estado,
      created_at,
      socios ( nombre )
    `,
    )
    .eq('estado', 'pendiente')
    .in('presupuesto_id', presupuestoIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar solicitudes de cambio');
  }

  const items: SolicitudCambioListItem[] = [];
  for (const row of solicitudes ?? []) {
    const meta = presupuestoMeta.get(row.presupuesto_id);
    if (!meta) continue;
    const socio = unwrapRelationEmbed(
      row.socios as { nombre?: string | null } | Array<{ nombre?: string | null }> | null,
    );
    items.push({
      id: row.id,
      presupuesto_id: row.presupuesto_id,
      socio_id: row.socio_id,
      monto_actual: Number(row.monto_actual ?? 0),
      monto_propuesto: Number(row.monto_propuesto ?? 0),
      motivo: String(row.motivo ?? ''),
      estado: String(row.estado ?? 'pendiente'),
      created_at: String(row.created_at ?? ''),
      socio_nombre: socio?.nombre ?? null,
      tarea_id: meta.tarea_id,
      tarea_titulo: meta.tarea_titulo,
      obra_id: meta.obra_id,
      obra_nombre: meta.obra_nombre,
      org_id: meta.org_id,
    });
  }
  return items;
}

export async function assertClientePuedeGestionarSolicitud(
  supabaseAny: SupabaseClient,
  solicitudId: string,
  userId: string,
): Promise<{
  solicitud: {
    id: string;
    presupuesto_id: string;
    socio_id: string;
    monto_actual: number;
    monto_propuesto: number;
    estado: string;
  };
  orgId: string;
  tareaId: string;
  obraId: string | null;
  tareaTitulo: string | null;
}> {
  const ownerOrgIds = await resolveClienteOwnerOrgIds(supabaseAny, userId);
  if (ownerOrgIds.length === 0) {
    throw new Error('FORBIDDEN');
  }

  const { data: row, error } = await supabaseAny
    .from('presupuesto_solicitudes_cambio')
    .select('id, presupuesto_id, socio_id, monto_actual, monto_propuesto, estado')
    .eq('id', solicitudId)
    .maybeSingle();

  if (error || !row) {
    throw new Error('NOT_FOUND');
  }

  const { data: pres, error: presErr } = await supabaseAny
    .from('tareas_presupuestos')
    .select(
      `
      id,
      estado,
      tarea_id,
      tareas!inner ( id, title, org_id, obra_id )
    `,
    )
    .eq('id', row.presupuesto_id)
    .maybeSingle();

  if (presErr || !pres) {
    throw new Error('NOT_FOUND');
  }

  const tarea = parseTareaPresupuestoEmbed(pres.tareas);
  if (!tarea || !ownerOrgIds.includes(tarea.org_id)) {
    throw new Error('FORBIDDEN');
  }

  if (String(row.estado) !== 'pendiente') {
    throw new Error('NOT_PENDING');
  }

  if (!estadoPresupuestoEsAprobado(pres.estado)) {
    throw new Error('PRESUPUESTO_NO_APROBADO');
  }

  return {
    solicitud: {
      id: row.id,
      presupuesto_id: row.presupuesto_id,
      socio_id: row.socio_id,
      monto_actual: Number(row.monto_actual ?? 0),
      monto_propuesto: Number(row.monto_propuesto ?? 0),
      estado: String(row.estado),
    },
    orgId: tarea.org_id,
    tareaId: pres.tarea_id ?? tarea.id,
    obraId: tarea.obra_id,
    tareaTitulo: tarea.title,
  };
}

async function notificarSocioCambioPresupuesto(
  supabaseAny: SupabaseClient,
  opts: {
    clienteUserId: string;
    socioId: string;
    orgId: string;
    obraId: string | null;
    tareaId: string;
    titulo: string;
    mensaje: string;
    tipo: string;
  },
) {
  const { data: socio } = await supabaseAny
    .from('socios')
    .select('user_id, id')
    .eq('id', opts.socioId)
    .maybeSingle();

  const destinatario = (socio as { user_id?: string | null } | null)?.user_id;
  if (!destinatario) return;

  const base: Record<string, unknown> = {
    org_id: opts.orgId,
    obra_id: opts.obraId,
    tarea_id: opts.tareaId,
    remitente_id: opts.clienteUserId,
    destinatario_id: destinatario,
    socio_id: opts.socioId,
    tipo: opts.tipo,
    titulo: opts.titulo,
    mensaje: opts.mensaje,
    leida: false,
    created_at: new Date().toISOString(),
  };

  let err = (await supabaseAny.from('notificaciones').insert(base)).error;
  if (err?.code === '42703') {
    const slim = {
      remitente_id: opts.clienteUserId,
      destinatario_id: destinatario,
      tipo: opts.tipo,
      titulo: opts.titulo,
      mensaje: opts.mensaje,
    };
    err = (await supabaseAny.from('notificaciones').insert(slim)).error;
  }
  if (err) {
    console.warn('[presupuesto-solicitud-cambio] notificación socio:', err.message);
  }
}

export async function responderSolicitudCambioPresupuesto(
  supabaseAny: SupabaseClient,
  input: {
    solicitudId: string;
    userId: string;
    accion: 'aceptar' | 'rechazar';
    respuestaCliente?: string | null;
  },
): Promise<{ montoNuevo?: number }> {
  const ctx = await assertClientePuedeGestionarSolicitud(
    supabaseAny,
    input.solicitudId,
    input.userId,
  );
  const now = new Date().toISOString();
  const respuesta = input.respuestaCliente?.trim() || null;

  if (input.accion === 'rechazar') {
    const { error } = await supabaseAny
      .from('presupuesto_solicitudes_cambio')
      .update({
        estado: 'rechazado',
        respuesta_cliente: respuesta,
        updated_at: now,
      })
      .eq('id', ctx.solicitud.id);

    if (error) throw new Error(error.message);

    await notificarSocioCambioPresupuesto(supabaseAny, {
      clienteUserId: input.userId,
      socioId: ctx.solicitud.socio_id,
      orgId: ctx.orgId,
      obraId: ctx.obraId,
      tareaId: ctx.tareaId,
      titulo: 'Solicitud de precio rechazada',
      mensaje: `El cliente rechazó tu solicitud de revisión para «${ctx.tareaTitulo ?? 'la tarea'}». El monto aprobado se mantiene en $${ctx.solicitud.monto_actual}.`,
      tipo: 'presupuesto_cambio_rechazado',
    });

    return {};
  }

  const montoNuevo = ctx.solicitud.monto_propuesto;
  const { error: updPres } = await supabaseAny
    .from('tareas_presupuestos')
    .update({
      monto: montoNuevo,
      updated_at: now,
    })
    .eq('id', ctx.solicitud.presupuesto_id);

  if (updPres) throw new Error(updPres.message);

  const { error: updSol } = await supabaseAny
    .from('presupuesto_solicitudes_cambio')
    .update({
      estado: 'aceptado',
      respuesta_cliente: respuesta,
      updated_at: now,
    })
    .eq('id', ctx.solicitud.id);

  if (updSol) throw new Error(updSol.message);

  try {
    await supabaseAny.from('eventos').insert({
      tarea_id: ctx.tareaId,
      org_id: ctx.orgId,
      obra_id: ctx.obraId,
      actor_name: 'Cliente',
      actor_role: 'Cliente',
      actor_method: 'login',
      notas: `Monto del presupuesto actualizado por acuerdo: $${ctx.solicitud.monto_actual} → $${montoNuevo}`,
      nuevo_estado: null,
      created_at: now,
    });
  } catch (evErr) {
    console.warn('[presupuesto-solicitud-cambio] evento:', evErr);
  }

  await notificarSocioCambioPresupuesto(supabaseAny, {
    clienteUserId: input.userId,
    socioId: ctx.solicitud.socio_id,
    orgId: ctx.orgId,
    obraId: ctx.obraId,
    tareaId: ctx.tareaId,
    titulo: 'Solicitud de precio aceptada',
    mensaje: `El cliente aceptó el nuevo monto ($${montoNuevo}) para «${ctx.tareaTitulo ?? 'la tarea'}».`,
    tipo: 'presupuesto_cambio_aceptado',
  });

  return { montoNuevo };
}
