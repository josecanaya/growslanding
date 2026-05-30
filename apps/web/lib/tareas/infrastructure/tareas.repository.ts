import { createServiceSupabaseClient } from '@/lib/supabase-server';

/** Campos que solo puede cambiar TareaFsmService / comandos FSM. */
export const TAREA_CAMPOS_FSM = new Set(['estado']);

export type TareaRow = {
  id: string;
  org_id?: string | null;
  obra_id?: string | null;
  elemento_id?: string | null;
  title?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  responsable?: string | null;
  responsable_socio_id?: string | null;
  cuadrilla_id?: string | null;
  prioridad?: string | null;
  avance?: number | null;
  bloques_planificados?: number | null;
  dias_presupuesto?: number | null;
  etapa?: string | null;
  fecha_inicio_estimada?: string | null;
  fecha_fin_estimada?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CrearTareaPayload = {
  obra_id: string;
  elemento_id: string;
  org_id: string;
  title: string;
  descripcion?: string | null;
  bloques_planificados: number;
  dias_presupuesto: number;
  etapa?: string | null;
  fecha_fin_estimada?: string | null;
};

export type CanvasTareaUpsertPayload = {
  obra_id: string;
  org_id: string;
  elemento_id: string;
  canvas_node_id: string;
  title: string;
  descripcion?: string | null;
  dias_presupuesto: number;
  is_critical: boolean;
  source: string;
  published_from_canvas_at: string;
};

const IN_FILTER_CHUNK = 100;

function sb() {
  return createServiceSupabaseClient() as any;
}

export class TareasRepository {
  static async findById(id: string, orgIds?: string[]): Promise<TareaRow | null> {
    let q = sb().from('tareas').select('*').eq('id', id);
    if (orgIds?.length) q = q.in('org_id', orgIds);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data as TareaRow | null;
  }

  static async insert(payload: CrearTareaPayload): Promise<TareaRow> {
    const { data, error } = await sb()
      .from('tareas')
      .insert({
        ...payload,
        estado: 'pendiente',
        prioridad: 'MEDIA',
        avance: 0,
        fecha_inicio_estimada: null,
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la tarea');
    return data as TareaRow;
  }

  static async updateMetadata(
    id: string,
    orgId: string,
    patch: Record<string, unknown>,
  ): Promise<TareaRow> {
    const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) {
      if (TAREA_CAMPOS_FSM.has(k)) continue;
      safe[k] = v;
    }
    const { data, error } = await sb()
      .from('tareas')
      .update(safe)
      .eq('id', id)
      .eq('org_id', orgId)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'No se pudo actualizar la tarea');
    return data as TareaRow;
  }

  static async updateAsignacion(
    id: string,
    orgId: string,
    params: { responsable: string; responsable_socio_id: string; cuadrilla_id?: string | null },
  ): Promise<void> {
    const { error } = await sb()
      .from('tareas')
      .update({
        responsable: params.responsable,
        responsable_socio_id: params.responsable_socio_id,
        cuadrilla_id: params.cuadrilla_id ?? params.responsable_socio_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId);
    if (error) throw new Error(error.message);
  }

  static async registrarEstadoInicial(tareaId: string, actorId: string): Promise<void> {
    const { error } = await sb()
      .from('tareas_estados')
      .insert({
        tarea_id: tareaId,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        actor_tipo: 'CLIENTE_TECNICO',
        actor_id: actorId,
        motivo: 'Tarea creada',
      });
    if (error) {
      console.warn('[TareasRepository.registrarEstadoInicial]', error.message);
    }
  }

  static async findByCanvasNodeIds(
    obraId: string,
    canvasNodeIds: string[],
    select: string,
  ): Promise<unknown[]> {
    if (canvasNodeIds.length === 0) return [];
    const merged: unknown[] = [];
    for (let i = 0; i < canvasNodeIds.length; i += IN_FILTER_CHUNK) {
      const chunk = canvasNodeIds.slice(i, i + IN_FILTER_CHUNK);
      const { data, error } = await sb()
        .from('tareas')
        .select(select)
        .eq('obra_id', obraId)
        .in('canvas_node_id', chunk);
      if (error) throw new Error(error.message);
      merged.push(...(data ?? []));
    }
    return merged;
  }

  static async insertFromCanvas(payload: CanvasTareaUpsertPayload): Promise<TareaRow> {
    const { data, error } = await sb()
      .from('tareas')
      .insert({
        ...payload,
        estado: 'pendiente',
        bloques_planificados: 1,
        prioridad: 'MEDIA',
        avance: 0,
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la tarea desde canvas');
    return data as TareaRow;
  }

  static async updateFromCanvas(id: string, patch: Record<string, unknown>): Promise<void> {
    const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) {
      if (TAREA_CAMPOS_FSM.has(k)) continue;
      safe[k] = v;
    }
    const { error } = await sb().from('tareas').update(safe).eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async findEstadoById(id: string): Promise<string | null> {
    const { data, error } = await sb().from('tareas').select('estado').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.estado as string | null) ?? null;
  }

  static async countBySocioAndEstado(socioId: string, estado: string): Promise<number> {
    const { count, error } = await sb()
      .from('tareas')
      .select('*', { count: 'exact', head: true })
      .eq('responsable_socio_id', socioId)
      .eq('estado', estado);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async listResumenAsignadas(
    orgId: string,
    orFilter: string,
    select = 'id, estado, avance',
  ): Promise<Array<{ id: string; estado?: string | null; avance?: number | null }>> {
    const { data, error } = await sb()
      .from('tareas')
      .select(select)
      .eq('org_id', orgId)
      .or(orFilter);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; estado?: string | null; avance?: number | null }>;
  }

  static async listIdsAsignadas(
    orgId: string,
    orFilter: string,
  ): Promise<string[]> {
    const { data, error } = await sb()
      .from('tareas')
      .select('id')
      .eq('org_id', orgId)
      .or(orFilter)
      .limit(80);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<{ id: string }>).map((r) => r.id).filter(Boolean);
  }
}
