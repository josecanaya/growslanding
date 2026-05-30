import { createServiceSupabaseClient } from '@/lib/supabase-server';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
} from '@/lib/domain/estados-core';

export const SUBTAREA_UI_SELECT = `
  *,
  tareas:tareas (
    id,
    title,
    obra_id,
    estado,
    responsable_socio_id,
    obras:obras (
      id,
      name,
      address
    )
  )
`;

export const SUBTAREA_ENVIAR_VALIDAR_SELECT =
  'id, tarea_id, estado, socio_id, evidencia_obligatoria, evidencia_cargada, evidencia_url, tareas:tareas(org_id, responsable_socio_id)';

/** Select usado por AhoraSection / modal evidencias. */
export const SUBTAREA_AHORA_SELECT = SUBTAREA_UI_SELECT;

function sb() {
  return createServiceSupabaseClient() as any;
}

export class SubtareasRepository {
  static async findById(id: string, select = '*'): Promise<Record<string, unknown> | null> {
    const { data, error } = await sb().from('tareas_subtareas').select(select).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Record<string, unknown> | null;
  }

  static async fetchUi(subtareaId: string) {
    const { data, error } = await sb()
      .from('tareas_subtareas')
      .select(SUBTAREA_UI_SELECT)
      .eq('id', subtareaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await sb()
      .from('tareas_subtareas')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async listByTareaId(tareaId: string, select = SUBTAREA_UI_SELECT) {
    const { data, error } = await sb()
      .from('tareas_subtareas')
      .select(select)
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async tieneBloquesPendientesValidacion(tareaId: string): Promise<boolean> {
    const { data, error } = await sb()
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', tareaId)
      .not('estado', 'in', `(${ESTADO_BLOQUE_PARA_VALIDAR},${ESTADO_BLOQUE_FINAL})`)
      .limit(1);
    if (error) throw new Error(error.message);
    return !data || data.length === 0 ? false : true;
  }

  static async countBySocioTareasAndEstado(
    socioId: string,
    tareaIds: string[],
    estado: string,
  ): Promise<number> {
    if (tareaIds.length === 0) return 0;
    const { count, error } = await sb()
      .from('tareas_subtareas')
      .select('*', { count: 'exact', head: true })
      .in('tarea_id', tareaIds)
      .eq('socio_id', socioId)
      .eq('estado', estado);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async listResumenByTareaId(tareaId: string) {
    const { data, error } = await sb()
      .from('tareas_subtareas')
      .select('id, estado, orden, socio_id')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async findEvidenciaVista(subtareaId: string) {
    const { data, error } = await sb()
      .from('tareas_subtareas')
      .select('evidencia_url, evidencia_cargada')
      .eq('id', subtareaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async countBySocioAndEstado(socioId: string, estado: string): Promise<number> {
    const { count, error } = await sb()
      .from('tareas_subtareas')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId)
      .eq('estado', estado);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
