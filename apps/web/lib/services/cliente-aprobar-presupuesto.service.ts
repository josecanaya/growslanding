import { sincronizarTareaTrasPresupuestoAprobado } from '@/lib/services/sync-tarea-presupuesto-aprobado.service';

export type AprobarPresupuestoResult =
  | { ok: true }
  | { ok: false; error: string; httpStatus?: number };

/**
 * Aprueba un presupuesto (tareas_presupuestos) como titular de la org de la tarea.
 */
export async function aprobarPresupuestoCliente(
  supabaseAny: any,
  user: { id: string; email?: string | null },
  presupuestoId: string,
): Promise<AprobarPresupuestoResult> {
  const { data: presupRow, error: presupErr } = await supabaseAny
    .from('tareas_presupuestos')
    .select(
      `
        id,
        tarea_id,
        socio_id,
        estado,
        tareas!inner (
          id,
          title,
          org_id,
          obra_id
        )
      `,
    )
    .eq('id', presupuestoId)
    .maybeSingle();

  if (presupErr || !presupRow) {
    return {
      ok: false,
      error: presupErr?.message ?? 'Presupuesto no encontrado',
      httpStatus: 404,
    };
  }

  const tarea = presupRow.tareas as {
    id: string;
    title: string | null;
    org_id: string;
    obra_id: string | null;
  };
  const orgId = tarea.org_id;
  const obraId = tarea.obra_id;

  const { data: orgRow, error: orgErr } = await supabaseAny
    .from('organizations')
    .select('user_id')
    .eq('id', orgId)
    .maybeSingle();

  if (orgErr || !orgRow || orgRow.user_id !== user.id) {
    return {
      ok: false,
      error: 'No tenés permiso para aprobar presupuestos de esta organización',
      httpStatus: 403,
    };
  }

  const estado = String(presupRow.estado ?? '').toUpperCase();
  if (!['ENVIADO', 'PENDIENTE'].includes(estado)) {
    return {
      ok: false,
      error: 'Este presupuesto no está pendiente de respuesta',
      httpStatus: 400,
    };
  }

  const socioId = presupRow.socio_id as string | null;
  if (!socioId || !presupRow.tarea_id || !obraId) {
    return { ok: false, error: 'Datos incompletos en el presupuesto', httpStatus: 400 };
  }

  let { data: socioData, error: socioError } = await supabaseAny
    .from('socios')
    .select('id, nombre, email, org_id')
    .eq('id', socioId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (socioError) {
    return { ok: false, error: socioError.message ?? 'Error al cargar el socio', httpStatus: 500 };
  }

  if (!socioData) {
    const fb = await supabaseAny
      .from('socios')
      .select('id, nombre, email, org_id')
      .eq('id', socioId)
      .maybeSingle();
    if (fb.error) {
      return { ok: false, error: fb.error.message ?? 'Error al cargar el socio', httpStatus: 500 };
    }
    socioData = fb.data;
  }

  if (!socioData) {
    return { ok: false, error: 'Socio no encontrado para este presupuesto', httpStatus: 404 };
  }

  const { error: updatePresupuestoError } = await supabaseAny
    .from('tareas_presupuestos')
    .update({
      estado: 'APROBADO',
      updated_at: new Date().toISOString(),
    })
    .eq('id', presupuestoId);

  if (updatePresupuestoError) {
    return { ok: false, error: updatePresupuestoError.message, httpStatus: 500 };
  }

  const syncTarea = await sincronizarTareaTrasPresupuestoAprobado(supabaseAny, {
    tareaId: tarea.id,
    socioId,
  });

  if (!syncTarea.ok) {
    return { ok: false, error: syncTarea.error, httpStatus: 500 };
  }

  await supabaseAny
    .from('tareas_presupuestos')
    .update({
      estado: 'RECHAZADO',
      updated_at: new Date().toISOString(),
    })
    .eq('tarea_id', presupRow.tarea_id)
    .neq('socio_id', socioId);

  const { error: eventoError } = await supabaseAny.from('eventos').insert({
    tarea_id: tarea.id,
    org_id: orgId,
    obra_id: obraId,
    actor_name: user.email ?? 'Sistema',
    actor_role: 'Cliente',
    actor_method: 'login',
    notas: `Tarea asignada a ${socioData.nombre ?? 'socio'} (presupuesto aprobado)`,
    checklist: null,
    has_nc: false,
    nuevo_estado: 'pendiente' as const,
    snapshot_json: null,
    created_at: new Date().toISOString(),
  });

  if (eventoError) {
    console.warn('[aprobarPresupuestoCliente] evento:', eventoError);
  }

  const notifFull = {
    org_id: orgId,
    obra_id: obraId,
    tarea_id: tarea.id,
    remitente_id: user.id,
    destinatario_id: socioId,
    socio_id: socioId,
    tipo: 'presupuesto_aprobado',
    titulo: 'Presupuesto aprobado',
    mensaje: `Tu presupuesto para la tarea «${tarea.title ?? 'Tarea'}» fue aprobado y la tarea te quedó asignada.`,
    leida: false,
    created_at: new Date().toISOString(),
  };
  let notifError = (await supabaseAny.from('notificaciones').insert(notifFull)).error;
  if (
    notifError &&
    (notifError.code === '42703' ||
      String(notifError.message).includes('destinatario_id') ||
      String(notifError.message).includes('remitente_id'))
  ) {
    notifError = (
      await supabaseAny.from('notificaciones').insert({
        org_id: orgId,
        obra_id: obraId,
        tarea_id: tarea.id,
        socio_id: socioId,
        tipo: 'presupuesto_aprobado',
        titulo: 'Presupuesto aprobado',
        mensaje: `Tu presupuesto para la tarea «${tarea.title ?? 'Tarea'}» fue aprobado y la tarea te quedó asignada.`,
        leida: false,
        created_at: new Date().toISOString(),
      })
    ).error;
  }
  if (notifError) {
    console.error('[aprobarPresupuestoCliente] notificación:', notifError);
  }

  return { ok: true };
}
