import { sincronizarTareaTrasPresupuestoAprobado } from '@/lib/services/sync-tarea-presupuesto-aprobado.service';
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

export type AprobarPresupuestoPaqueteAccion = 'creado_aprobado' | 'actualizado_aprobado' | 'ya_aprobado';

export type AprobarPresupuestoPaqueteResult = {
  presupuestoId: string;
  accion: AprobarPresupuestoPaqueteAccion;
};

type PresupRow = {
  id: string;
  estado?: string | null;
  socio_id?: string | null;
  monto?: number | null;
  dias_reales?: number | null;
};

/**
 * Crea o actualiza un presupuesto como APROBADO y sincroniza la tarea al socio.
 * Usado al enviar un paquete/grupo desde el canvas (aprobación atómica del paquete).
 */
export async function aprobarPresupuestoTareaEnPaquete(
  supabaseAny: any,
  params: {
    tareaId: string;
    socioId: string;
    diasPresupuesto: number;
    notasPayload?: string | null;
  },
): Promise<
  { ok: true; result: AprobarPresupuestoPaqueteResult } | { ok: false; error: string }
> {
  const { tareaId, socioId } = params;
  const dias = Math.max(1, Math.floor(Number(params.diasPresupuesto) || 1));

  const { data: rows, error: listErr } = await supabaseAny
    .from('tareas_presupuestos')
    .select('id, estado, socio_id, monto, dias_reales')
    .eq('tarea_id', tareaId);

  if (listErr) {
    return { ok: false, error: listErr.message ?? 'No se pudo leer presupuestos de la tarea' };
  }

  const list = (rows ?? []) as PresupRow[];
  const forSocio = list.filter((r) => r.socio_id === socioId);
  const approved = forSocio.find((r) => estadoPresupuestoEsAprobado(r.estado));

  if (approved?.id) {
    const sync = await sincronizarTareaTrasPresupuestoAprobado(supabaseAny, { tareaId, socioId });
    if (!sync.ok) return { ok: false, error: sync.error };
    return { ok: true, result: { presupuestoId: approved.id, accion: 'ya_aprobado' } };
  }

  const open = forSocio.find((r) => {
    const e = String(r.estado ?? 'PENDIENTE').toUpperCase();
    return e === 'PENDIENTE' || e === 'ENVIADO';
  });

  const now = new Date().toISOString();
  let presupuestoId: string;
  let accion: AprobarPresupuestoPaqueteAccion;

  if (open?.id) {
    const patch: Record<string, unknown> = {
      estado: 'APROBADO',
      dias_reales: open.dias_reales && open.dias_reales > 0 ? open.dias_reales : dias,
      updated_at: now,
    };
    if (params.notasPayload) patch.notas = params.notasPayload;

    const { error: upErr } = await supabaseAny
      .from('tareas_presupuestos')
      .update(patch)
      .eq('id', open.id);

    if (upErr) {
      return { ok: false, error: upErr.message ?? 'No se pudo aprobar el presupuesto existente' };
    }
    presupuestoId = open.id;
    accion = 'actualizado_aprobado';
  } else {
    const { data: ins, error: insErr } = await supabaseAny
      .from('tareas_presupuestos')
      .insert({
        tarea_id: tareaId,
        socio_id: socioId,
        monto: 0,
        moneda: 'ARS',
        estado: 'APROBADO',
        dias_reales: dias,
        notas: params.notasPayload ?? null,
        updated_at: now,
      })
      .select('id')
      .single();

    if (insErr || !ins?.id) {
      return {
        ok: false,
        error: insErr?.message ?? 'No se pudo crear el presupuesto aprobado',
      };
    }
    presupuestoId = ins.id as string;
    accion = 'creado_aprobado';
  }

  const sync = await sincronizarTareaTrasPresupuestoAprobado(supabaseAny, { tareaId, socioId });
  if (!sync.ok) return { ok: false, error: sync.error };

  await supabaseAny
    .from('tareas_presupuestos')
    .update({ estado: 'RECHAZADO', updated_at: now })
    .eq('tarea_id', tareaId)
    .neq('socio_id', socioId)
    .neq('id', presupuestoId);

  return { ok: true, result: { presupuestoId, accion } };
}
