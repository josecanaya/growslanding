import type { SupabaseClient } from '@supabase/supabase-js';
import { persistedToSupabaseRows } from './canvasSupabaseMapper';

export async function listCanvasPlanningOrgIds(client: SupabaseClient<any>, userId: string, email?: string | null) {
  const owned = await client.from('organizations').select('id').eq('user_id', userId);
  if (owned.error) throw owned.error;
  const ids = new Set<string>((owned.data ?? []).map((row) => row.id));
  if (email) {
    const invited = await client.from('leader_invites').select('org_id').eq('email', email).eq('status', 'accepted');
    if (invited.error) throw invited.error;
    for (const row of invited.data ?? []) if (row.org_id) ids.add(row.org_id);
  }
  return [...ids];
}

export async function readCanvasSnapshot(client: SupabaseClient<any>, obraId: string, orgId: string) {
  return client.rpc('read_canvas_snapshot', { p_obra_id: obraId, p_org_id: orgId });
}

export async function saveCanvasSnapshot(
  client: SupabaseClient<any>, obraId: string, orgId: string, revision: number,
  rows: ReturnType<typeof persistedToSupabaseRows>,
) {
  return client.rpc('save_canvas_snapshot', {
    p_obra_id: obraId, p_org_id: orgId, p_expected_revision: revision, p_snapshot: rows,
  });
}

export function canvasPersistenceError(error: { code?: string; message?: string }) {
  if (error.code === '40001') return { status: 409, message: 'La obra cambió en otra sesión. Conservamos tus cambios locales; recargá la obra antes de volver a guardar.' };
  if (error.code === 'PGRST202' || error.code === '42883') return { status: 503, message: 'El guardado seguro está pendiente de habilitación en el servidor. Tus cambios siguen guardados en este dispositivo.' };
  if (error.code === '42501') return { status: 403, message: 'No autorizado para modificar esta obra.' };
  if (error.code === '22023' || error.code === '23503' || error.code === '23505' || error.code === '23514') return { status: 400, message: 'El canvas contiene referencias o valores inválidos. Revisá los nodos y sus conexiones.' };
  return { status: 500, message: 'No se pudo guardar o leer la obra. Tus cambios locales se conservan.' };
}
