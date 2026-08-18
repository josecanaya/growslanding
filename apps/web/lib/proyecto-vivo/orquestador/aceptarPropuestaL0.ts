import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import { toDbUuidFromCanvasId } from '@/lib/canvas/canvasSupabaseMapper';
import { appendPatronAnonimo } from '@/lib/proyecto-vivo/orquestador/appendPatronAnonimo';

export type AceptarPropuestaResult = {
  transformacionId: string;
  executorKind: string;
};

/**
 * Humano acepta una sugerencia L0. No marca realizada, no crea tarea, no toca wallet.
 */
export async function aceptarPropuestaL0(params: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  obraId: string;
  canvasNodeId: string;
  actorId: string;
}): Promise<AceptarPropuestaResult> {
  const dbId = toDbUuidFromCanvasId(params.canvasNodeId);
  const supabaseAny = params.supabase as any;

  const { data: row, error } = await supabaseAny
    .from('canvas_nodes')
    .select('id, type, title, transform_kind, from_node_id, to_node_id, executor_kind, graph_status, metadata')
    .eq('obra_id', params.obraId)
    .eq('id', dbId)
    .maybeSingle();

  if (error || !row) throw new Error(error?.message ?? 'Propuesta no encontrada');
  if (row.type !== 'tarea') throw new Error('Solo se aceptan transformaciones.');
  if (row.graph_status === 'realizada') {
    throw new Error('No se puede aceptar una transformación ya realizada.');
  }

  const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<
    string,
    unknown
  >;
  const prevOrq =
    meta.orquestador && typeof meta.orquestador === 'object'
      ? (meta.orquestador as Record<string, unknown>)
      : {};

  const nextMeta = {
    ...meta,
    orquestador: {
      ...prevOrq,
      origen: 'agente',
      estado: 'aceptada',
      formulaId: 'l0',
      accepted_at: new Date().toISOString(),
      accepted_by: params.actorId,
    },
  };

  const { error: updErr } = await supabaseAny
    .from('canvas_nodes')
    .update({
      executor_kind: 'sin_asignar',
      metadata: nextMeta,
    })
    .eq('obra_id', params.obraId)
    .eq('id', dbId);

  if (updErr) throw new Error(updErr.message);

  try {
    const fromId = row.from_node_id as string | null;
    const toId = row.to_node_id as string | null;
    const titles: Record<string, string> = {};
    const ids = [fromId, toId].filter(Boolean) as string[];
    if (ids.length > 0) {
      const { data: extremos } = await supabaseAny
        .from('canvas_nodes')
        .select('id, title')
        .eq('obra_id', params.obraId)
        .in('id', ids);
      for (const n of extremos ?? []) {
        titles[n.id as string] = String(n.title ?? '');
      }
    }
    appendPatronAnonimo({
      evento: 'aceptada',
      transform_kind: (row.transform_kind as string | null) ?? null,
      verbo: String(row.title ?? 'transformacion'),
      estado_a: fromId ? titles[fromId] ?? null : null,
      estado_b: toId ? titles[toId] ?? null : null,
    });
  } catch {
    /* el accept no depende del corpus */
  }

  return { transformacionId: params.canvasNodeId, executorKind: 'sin_asignar' };
}
