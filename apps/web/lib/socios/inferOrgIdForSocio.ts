import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cuando `socios.org_id` es null, intenta obtener la organización desde tareas o presupuestos del socio.
 */
export async function inferOrgIdForSocio(
  supabase: SupabaseClient<any>,
  socioId: string,
): Promise<string | null> {
  const { data: t1 } = await supabase
    .from('tareas')
    .select('org_id')
    .or(`responsable_socio_id.eq.${socioId},cuadrilla_id.eq.${socioId}`)
    .not('org_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (t1?.org_id) return t1.org_id as string;

  const { data: tpRows } = await supabase
    .from('tareas_presupuestos')
    .select('tarea_id')
    .eq('socio_id', socioId)
    .not('tarea_id', 'is', null)
    .limit(50);

  const tareaIds = [
    ...new Set(
      (tpRows ?? [])
        .map((r: { tarea_id: string | null }) => r.tarea_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (tareaIds.length === 0) return null;

  const { data: t2 } = await supabase
    .from('tareas')
    .select('org_id')
    .in('id', tareaIds)
    .not('org_id', 'is', null)
    .limit(1)
    .maybeSingle();

  return (t2?.org_id as string | null) ?? null;
}
