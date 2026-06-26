import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import { MAX_OFERTORES_POR_PLIEGO } from '@/lib/cliente/pliegoPresupuesto';
import {
  countOfertoresEnGrupo,
  resolveTaskNodeIdsForBudgetGroup,
  resolveTareaIdsForTaskNodes,
} from '@/lib/canvas/budgetGroupTasks';
import { solicitarPresupuestoTareaEnPaquete } from '@/lib/services/solicitar-presupuesto-paquete.service';

export type PostularBolsaResult =
  | {
      ok: true;
      solicitudesCreadas: number;
      solicitudesYaExistentes: number;
      budgetGroupId: string;
      obraId: string;
    }
  | { ok: false; status: number; error: string };

/**
 * Socio se postula a un pliego publicado en bolsa (crea filas PENDIENTE por tarea del paquete).
 */
export async function postularSocioABolsaPliego(
  supabaseAny: any,
  params: {
    obraId: string;
    budgetGroupIdClient: string;
    socioId: string;
  },
): Promise<PostularBolsaResult> {
  const { obraId, socioId } = params;
  let dbGroupId: string;
  try {
    dbGroupId = toDbUuidFromCanvasId(params.budgetGroupIdClient);
  } catch {
    return { ok: false, status: 400, error: 'Grupo inválido' };
  }

  const { data: groupRow, error: gErr } = await supabaseAny
    .from('canvas_budget_groups')
    .select('id, obra_id, name, bolsa_publicada, status, mensaje_socio_borrador')
    .eq('id', dbGroupId)
    .eq('obra_id', obraId)
    .maybeSingle();

  if (gErr || !groupRow) {
    return { ok: false, status: 404, error: 'Pliego no encontrado' };
  }

  if (!Boolean((groupRow as { bolsa_publicada?: boolean }).bolsa_publicada)) {
    return { ok: false, status: 403, error: 'Este paquete no está publicado en bolsa.' };
  }

  const st = String((groupRow as { status?: string }).status ?? '').toLowerCase();
  if (st !== 'enviado' && st !== 'enviado_parcial') {
    return { ok: false, status: 409, error: 'El pliego no está abierto para nuevas postulaciones.' };
  }

  const { taskNodeIds, error: resolveErr } = await resolveTaskNodeIdsForBudgetGroup(
    supabaseAny,
    obraId,
    dbGroupId,
  );
  if (resolveErr) {
    return { ok: false, status: 500, error: resolveErr };
  }

  const { tareaIds, canvasToTarea, error: tareaErr } = await resolveTareaIdsForTaskNodes(
    supabaseAny,
    obraId,
    taskNodeIds,
  );
  if (tareaErr) {
    return { ok: false, status: 500, error: tareaErr };
  }

  const readyNodeIds = taskNodeIds.filter((nid) => canvasToTarea.has(nid));
  if (readyNodeIds.length === 0) {
    return { ok: false, status: 409, error: 'Las tareas del paquete aún no están publicadas.' };
  }

  const ofertores = await countOfertoresEnGrupo(supabaseAny, tareaIds);
  const { data: existingSocio } = await supabaseAny
    .from('tareas_presupuestos')
    .select('id')
    .in('tarea_id', tareaIds.slice(0, 50))
    .eq('socio_id', socioId)
    .limit(1);

  const yaParticipa = (existingSocio ?? []).length > 0;
  if (!yaParticipa && ofertores >= MAX_OFERTORES_POR_PLIEGO) {
    return {
      ok: false,
      status: 409,
      error: `Este pliego ya tiene ${MAX_OFERTORES_POR_PLIEGO} ofertores. No se aceptan más postulaciones.`,
    };
  }

  const mensajeBorrador = (groupRow as { mensaje_socio_borrador?: string | null }).mensaje_socio_borrador;
  const notasPayload = JSON.stringify({
    canvas_budget_group_id: toClientBudgetGroupId(dbGroupId),
    mensaje: mensajeBorrador?.trim() || undefined,
    origen: 'bolsa',
  });

  let solicitudesCreadas = 0;
  let solicitudesYaExistentes = 0;

  for (const nodeId of readyNodeIds) {
    const tareaMeta = canvasToTarea.get(nodeId);
    if (!tareaMeta) continue;
    const result = await solicitarPresupuestoTareaEnPaquete(supabaseAny, {
      tareaId: tareaMeta.id,
      socioId,
      diasPresupuesto: tareaMeta.dias_presupuesto,
      notasPayload,
    });
    if (!result.ok) {
      return { ok: false, status: 500, error: result.error };
    }
    if (result.result.accion === 'ya_solicitado') solicitudesYaExistentes += 1;
    else solicitudesCreadas += 1;
  }

  if (solicitudesCreadas + solicitudesYaExistentes === 0) {
    return { ok: false, status: 409, error: 'No se pudo crear la postulación.' };
  }

  return {
    ok: true,
    solicitudesCreadas,
    solicitudesYaExistentes,
    budgetGroupId: toClientBudgetGroupId(dbGroupId),
    obraId,
  };
}
