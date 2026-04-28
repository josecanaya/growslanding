import { createServiceSupabaseClient } from '@/lib/supabase-server';

type SupabaseClient = ReturnType<typeof createServiceSupabaseClient>;

/**
 * El arquitecto puede asignar / pedir presupuesto a un socio si:
 * - el socio "pertenece" a la misma org (legacy), o
 * - está en cliente_socio_agenda para esa org (contacto agendado).
 */
export async function socioEsContactoDeOrg(
  supabase: SupabaseClient,
  socioId: string,
  orgId: string,
): Promise<boolean> {
  const any = supabase as any;

  const { data: socio, error: socioErr } = await any
    .from('socios')
    .select('org_id')
    .eq('id', socioId)
    .maybeSingle();

  if (socioErr || !socio) {
    return false;
  }

  if (socio.org_id === orgId) {
    return true;
  }

  const { data: ag, error: agErr } = await any
    .from('cliente_socio_agenda')
    .select('id')
    .eq('org_id', orgId)
    .eq('socio_id', socioId)
    .in('estado', ['activo', 'pendiente'])
    .maybeSingle();

  if (agErr) {
    const msg = String(agErr.message || '').toLowerCase();
    if (agErr.code === '42P01' || msg.includes('does not exist')) {
      return false;
    }
  }

  return Boolean(ag);
}

/**
 * El socio puede ver/editar datos de una obra de un cliente si es contacto de esa org
 * o ya tiene presupuesto / tarea asignada en esa obra.
 */
export async function socioPuedeAccederDatosObra(
  supabase: SupabaseClient,
  socioId: string,
  obra: { id: string; org_id: string },
): Promise<boolean> {
  if (await socioEsContactoDeOrg(supabase, socioId, obra.org_id)) {
    return true;
  }

  const any = supabase as any;

  const { data: tareaRows } = await any.from('tareas').select('id').eq('obra_id', obra.id);
  const tareaIds = (tareaRows ?? []).map((t: { id: string }) => t.id);
  if (tareaIds.length === 0) {
    return false;
  }

  const { data: pres } = await any
    .from('tareas_presupuestos')
    .select('id')
    .eq('socio_id', socioId)
    .in('tarea_id', tareaIds)
    .limit(1)
    .maybeSingle();

  if (pres) {
    return true;
  }

  const { data: tas } = await any
    .from('tareas')
    .select('id')
    .eq('obra_id', obra.id)
    .eq('responsable_socio_id', socioId)
    .limit(1)
    .maybeSingle();

  return Boolean(tas);
}
