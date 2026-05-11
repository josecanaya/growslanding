import { patchTareaTrasPresupuestoAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

/**
 * Tras marcar `tareas_presupuestos` como aprobado, deja consistente la fila `tareas`:
 * socio asignado, responsable texto, estado pendiente si aún no operó la tarea.
 * Usar con service role desde APIs (sin filtrar por org_id para no fallar si hubo desfasaje de org).
 */
export async function sincronizarTareaTrasPresupuestoAprobado(
  supabaseAny: any,
  params: { tareaId: string; socioId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: socio, error: eSoc } = await supabaseAny
    .from('socios')
    .select('id, nombre, email')
    .eq('id', params.socioId)
    .maybeSingle();

  if (eSoc) {
    return { ok: false, error: eSoc.message ?? 'Error al cargar socio' };
  }
  if (!socio?.id) {
    return { ok: false, error: 'Socio no encontrado' };
  }

  const { data: tarea, error: eTar } = await supabaseAny
    .from('tareas')
    .select('id, estado')
    .eq('id', params.tareaId)
    .maybeSingle();

  if (eTar) {
    return { ok: false, error: eTar.message ?? 'Error al cargar tarea' };
  }
  if (!tarea) {
    return { ok: false, error: 'Tarea no encontrada' };
  }

  const patch = patchTareaTrasPresupuestoAprobado({
    socioId: params.socioId,
    socioEmail: socio.email ?? null,
    socioNombre: socio.nombre ?? null,
    estadoTareaActual: tarea.estado,
  });

  const { data: updated, error: eUpd } = await supabaseAny
    .from('tareas')
    .update(patch)
    .eq('id', params.tareaId)
    .select('id');

  if (eUpd) {
    return { ok: false, error: eUpd.message ?? 'No se pudo actualizar la tarea' };
  }

  const n = Array.isArray(updated) ? updated.length : 0;
  if (n === 0) {
    return { ok: false, error: 'No se actualizó ninguna fila en tareas' };
  }

  return { ok: true };
}
