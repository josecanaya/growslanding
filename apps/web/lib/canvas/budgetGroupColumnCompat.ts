/**
 * `canvas_budget_groups.scheduled_socio_id` y `mensaje_socio_borrador` se agregan en
 * supabase/migrations/20260502120000_canvas_budget_groups_socio_mensaje.sql.
 * Si el proyecto remoto aún no aplicó el SQL, PostgREST devuelve error de schema cache.
 */

export function isMissingOptionalBudgetGroupSocioColumnsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { message?: string; code?: string; hint?: string };
  const msg = String(e.message || '').toLowerCase();
  const code = String(e.code || '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('mensaje_socio_borrador') ||
    msg.includes('scheduled_socio_id') ||
    msg.includes('schema cache') ||
    (msg.includes('could not find') && msg.includes('column'))
  );
}

/** Quita columnas opcionales no desplegadas en Supabase (guardado degrade). */
export function stripBudgetGroupSocioOptionalFields<T extends Record<string, unknown>>(
  groups: T[],
): Omit<T, 'scheduled_socio_id' | 'mensaje_socio_borrador'>[] {
  return groups.map((g) => {
    const {
      scheduled_socio_id: _s,
      mensaje_socio_borrador: _m,
      ...rest
    } = g as T & { scheduled_socio_id?: unknown; mensaje_socio_borrador?: unknown };
    return rest as Omit<T, 'scheduled_socio_id' | 'mensaje_socio_borrador'>;
  });
}
