import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import { TareaMetadataService } from '@/lib/tareas';
import { TareasRepository } from '@/lib/tareas/infrastructure/tareas.repository';
import { resolveElementoForProyectoVivoTransformacion } from '@/lib/proyecto-vivo/resolveElementoEjecucion';

const TIPO_DEPENDENCIA_FS = 'FINISH_TO_START';

export type ActivarEjecucionResult = {
  tareaId: string;
  created: boolean;
  createdPrecedences: number;
  warnings: string[];
};

type CanvasNodeRow = {
  id: string;
  obra_id: string;
  org_id: string | null;
  type: string;
  title: string | null;
  description: string | null;
  planned_duration_days: number | null;
  is_critical: boolean | null;
  transform_kind: string | null;
  from_node_id: string | null;
  to_node_id: string | null;
  metadata: Record<string, unknown> | null;
};

type CanvasEdgeRow = {
  source_node_id: string;
  target_node_id: string;
  type: string;
  lag_days: number | null;
};

/**
 * Publica una sola transformación `ejecucion` (proyecto_vivo) en `tareas` + precedencias locales.
 */
export async function activarEjecucionTransformacion(params: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  obraId: string;
  obraOrgId: string;
  actorId: string;
  canvasNodeId: string;
}): Promise<ActivarEjecucionResult> {
  const warnings: string[] = [];
  const supabaseAny = params.supabase as any;

  const { data: node, error: nErr } = await supabaseAny
    .from('canvas_nodes')
    .select(
      'id, obra_id, org_id, type, title, description, planned_duration_days, is_critical, transform_kind, from_node_id, to_node_id, metadata',
    )
    .eq('obra_id', params.obraId)
    .eq('id', params.canvasNodeId)
    .maybeSingle();

  if (nErr || !node) {
    throw new Error(nErr?.message ?? 'Nodo de transformación no encontrado');
  }

  const row = node as CanvasNodeRow;
  if (row.type !== 'tarea') {
    throw new Error('El nodo no es una transformación (type=tarea).');
  }
  if (row.transform_kind !== 'ejecucion') {
    throw new Error('Solo transformaciones transform_kind=ejecucion pueden activarse en obra.');
  }
  if (!row.from_node_id || !row.to_node_id) {
    throw new Error('Faltan from_node_id / to_node_id en la transformación.');
  }
  const orq = row.metadata?.orquestador;
  if (
    orq &&
    typeof orq === 'object' &&
    (orq as { estado?: string }).estado === 'pendiente'
  ) {
    throw new Error('Aceptá la propuesta del orquestador antes de activar ejecución.');
  }

  const elementoId = await resolveElementoForProyectoVivoTransformacion(
    params.supabase,
    params.obraId,
    row.to_node_id,
    warnings,
  );

  const existingRows = await TareasRepository.findByCanvasNodeIds(
    params.obraId,
    [row.id],
    'id, canvas_node_id, elemento_id',
  );
  const existing = existingRows?.[0] as
    | { id: string; canvas_node_id: string | null; elemento_id: string | null }
    | undefined;

  const title = (row.title ?? '').trim() || '(Sin título)';
  const planned = row.planned_duration_days;
  const diasPresupuesto = Math.max(1, Math.floor(Number(planned) || 1));
  const nowIso = new Date().toISOString();
  const orgId = row.org_id || params.obraOrgId;

  const upsert = await TareaMetadataService.upsertDesdeCanvas({
    existingId: existing?.id ?? null,
    existingElementoId: existing?.elemento_id ?? null,
    actorId: params.actorId,
    payload: {
      obra_id: params.obraId,
      org_id: orgId,
      elemento_id: elementoId,
      canvas_node_id: row.id,
      title,
      descripcion: row.description ?? null,
      dias_presupuesto: diasPresupuesto,
      is_critical: Boolean(row.is_critical),
      source: 'canvas',
      published_from_canvas_at: nowIso,
    },
  });

  await supabaseAny
    .from('canvas_nodes')
    .update({ graph_status: 'en_curso' })
    .eq('id', row.id);

  const { data: edgeRows } = await supabaseAny
    .from('canvas_edges')
    .select('source_node_id, target_node_id, type, lag_days')
    .eq('obra_id', params.obraId);

  const edges = (edgeRows ?? []) as CanvasEdgeRow[];
  const relatedNodeIds = new Set<string>();
  for (const e of edges) {
    if (e.type !== 'precedencia') continue;
    if (e.source_node_id === row.id || e.target_node_id === row.id) {
      relatedNodeIds.add(e.source_node_id);
      relatedNodeIds.add(e.target_node_id);
    }
  }

  const publishedMap = new Map<string, string>();
  publishedMap.set(row.id, upsert.id);

  if (relatedNodeIds.size > 1) {
    const others = [...relatedNodeIds].filter((id) => id !== row.id);
    const tareas = await TareasRepository.findByCanvasNodeIds(
      params.obraId,
      others,
      'id, canvas_node_id',
    );
    for (const t of tareas ?? []) {
      const r = t as { id: string; canvas_node_id: string | null };
      if (r.canvas_node_id) publishedMap.set(r.canvas_node_id, r.id);
    }
  }

  let createdPrecedences = 0;
  for (const edge of edges) {
    if (edge.type !== 'precedencia') continue;
    const involves =
      edge.source_node_id === row.id ||
      edge.target_node_id === row.id;
    if (!involves) continue;

    const predTareaId = publishedMap.get(edge.source_node_id);
    const succTareaId = publishedMap.get(edge.target_node_id);
    if (!predTareaId || !succTareaId || predTareaId === succTareaId) continue;

    const { data: dup } = await supabaseAny
      .from('tarea_precedencias')
      .select('id')
      .eq('tarea_id', succTareaId)
      .eq('depende_de', predTareaId)
      .maybeSingle();

    if (dup?.id) continue;

    const lag = edge.lag_days != null ? Number(edge.lag_days) : 0;
    const { error: pInsErr } = await supabaseAny.from('tarea_precedencias').insert({
      tarea_id: succTareaId,
      depende_de: predTareaId,
      lag_dias: Number.isFinite(lag) ? lag : 0,
      tipo_dependencia: TIPO_DEPENDENCIA_FS,
    });
    if (!pInsErr) createdPrecedences++;
    else warnings.push(`Precedencia omitida: ${pInsErr.message}`);
  }

  return {
    tareaId: upsert.id,
    created: upsert.created,
    createdPrecedences,
    warnings,
  };
}
