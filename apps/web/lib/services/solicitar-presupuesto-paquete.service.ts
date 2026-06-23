export type SolicitarPresupuestoPaqueteAccion = 'creado' | 'ya_solicitado';

export type SolicitarPresupuestoPaqueteResult = {
  presupuestoId: string;
  accion: SolicitarPresupuestoPaqueteAccion;
};

/**
 * Crea solicitud PENDIENTE de presupuesto sin asignar la tarea al socio.
 */
export async function solicitarPresupuestoTareaEnPaquete(
  supabaseAny: any,
  params: {
    tareaId: string;
    socioId: string;
    diasPresupuesto: number;
    notasPayload?: string | null;
  },
): Promise<
  { ok: true; result: SolicitarPresupuestoPaqueteResult } | { ok: false; error: string }
> {
  const { tareaId, socioId } = params;
  const dias = Math.max(1, Math.floor(Number(params.diasPresupuesto) || 1));

  const { data: rows, error: listErr } = await supabaseAny
    .from('tareas_presupuestos')
    .select('id, estado, socio_id')
    .eq('tarea_id', tareaId)
    .eq('socio_id', socioId);

  if (listErr) {
    return { ok: false, error: listErr.message ?? 'No se pudo leer presupuestos de la tarea' };
  }

  const list = (rows ?? []) as Array<{ id: string; estado?: string | null }>;
  const open = list.find((r) => {
    const e = String(r.estado ?? 'PENDIENTE').toUpperCase();
    return e === 'PENDIENTE' || e === 'ENVIADO';
  });

  if (open?.id) {
    return { ok: true, result: { presupuestoId: open.id, accion: 'ya_solicitado' } };
  }

  const approved = list.find((r) => {
    const e = String(r.estado ?? '').toUpperCase();
    return e === 'APROBADO';
  });
  if (approved?.id) {
    return { ok: true, result: { presupuestoId: approved.id, accion: 'ya_solicitado' } };
  }

  const now = new Date().toISOString();
  const notas =
    params.notasPayload?.trim() ||
    'Solicitud de presupuesto por paquete de tareas (canvas)';

  const { data: ins, error: insErr } = await supabaseAny
    .from('tareas_presupuestos')
    .insert({
      tarea_id: tareaId,
      socio_id: socioId,
      monto: 0,
      moneda: 'ARS',
      estado: 'PENDIENTE',
      dias_reales: dias,
      notas,
      updated_at: now,
    })
    .select('id')
    .single();

  if (insErr || !ins?.id) {
    return {
      ok: false,
      error: insErr?.message ?? 'No se pudo crear la solicitud de presupuesto',
    };
  }

  return { ok: true, result: { presupuestoId: ins.id as string, accion: 'creado' } };
}
