import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';
import {
  buildBloquesPorTareaMap,
  filtrarTareasOperativasSocio,
  tareaEstaCerradaParaSocio,
} from '@/lib/socio/tareas-operativas-socio';

export const TAREA_AHORA_SELECT = `
  id,
  title,
  descripcion,
  estado,
  prioridad,
  avance,
  fecha_inicio_estimada,
  fecha_fin_estimada,
  obra_id,
  responsable,
  responsable_socio_id,
  canvas_node_id,
  obras (
    id,
    name,
    address
  ),
  elemento_id,
  elemento:elementos (
    cantidad,
    unidad
  )
`;

export type TareaAhoraRow = {
  id: string;
  title: string | null;
  descripcion: string | null;
  estado: string | null;
  prioridad: string | null;
  avance: number | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  obra_id: string | null;
  responsable: string | null;
  responsable_socio_id?: string | null;
  canvas_node_id?: string | null;
  obras?: {
    id: string;
    name: string | null;
    address: string | null;
  } | null;
  elemento?: {
    cantidad: number | null;
    unidad: string | null;
  } | null;
};

/**
 * Asignación al socio — alineada con operación backend (A responsable_socio_id + B presupuesto aprobado).
 */
export async function buildOrClauseAsignacionSocio(
  supabaseAny: any,
  socioId: string | null | undefined,
): Promise<string[]> {
  if (!socioId?.trim()) return [];

  const partes: string[] = [`responsable_socio_id.eq.${socioId}`];

  const { data: presRows } = await supabaseAny
    .from('tareas_presupuestos')
    .select('tarea_id, estado')
    .eq('socio_id', socioId)
    .limit(800);

  const tareaIdsPresupuesto = [
    ...new Set(
      (presRows ?? [])
        .filter((r: { estado?: string | null }) => estadoPresupuestoEsAprobado(r.estado))
        .map((r: { tarea_id?: string | null }) => r.tarea_id)
        .filter((tid: string | null | undefined): tid is string => !!tid),
    ),
  ];

  if (tareaIdsPresupuesto.length > 0) {
    partes.push(`id.in.(${tareaIdsPresupuesto.join(',')})`);
  }

  return partes;
}

/** Cliente: misma regla que SocioTareaOperacionService (A ∨ B). */
export function tareaAsignadaAlSocioParaOperar(
  t: Pick<TareaAhoraRow, 'id' | 'responsable_socio_id'>,
  socioId: string,
  tareasConPresupuestoAprobado: Set<string>,
): boolean {
  if (t.responsable_socio_id === socioId) return true;
  return tareasConPresupuestoAprobado.has(t.id);
}

export type CargarTareaAhoraResult = {
  tarea: TareaAhoraRow | null;
  operativas: TareaAhoraRow[];
  error: string | null;
};

/**
 * Una sola tarea operativa para Ahora: CPM + precedencias + bloques + sin cerradas/en validación.
 */
export async function cargarTareaOperativaAhora(
  supabaseAny: any,
  opts: {
    orgId: string;
    socioId: string | null;
  },
): Promise<CargarTareaAhoraResult> {
  const { orgId, socioId } = opts;

  if (!socioId) {
    return { tarea: null, operativas: [], error: 'No se pudo vincular tu perfil de socio.' };
  }

  const orPartes = await buildOrClauseAsignacionSocio(supabaseAny, socioId);
  if (orPartes.length === 0) {
    return { tarea: null, operativas: [], error: 'No tenés tareas asignadas con presupuesto aprobado.' };
  }

  const { data, error: queryError } = await supabaseAny
    .from('tareas')
    .select(TAREA_AHORA_SELECT)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .or(orPartes.join(','));

  if (queryError) {
    return { tarea: null, operativas: [], error: 'No se pudieron cargar tus tareas.' };
  }

  const tareasBase = (data ?? []) as TareaAhoraRow[];

  const { data: presRows } = await supabaseAny
    .from('tareas_presupuestos')
    .select('tarea_id, estado')
    .eq('socio_id', socioId)
    .limit(800);

  const presupuestoAprobadoIds = new Set(
    (presRows ?? [])
      .filter((r: { estado?: string | null }) => estadoPresupuestoEsAprobado(r.estado))
      .map((r: { tarea_id?: string | null }) => r.tarea_id)
      .filter(Boolean) as string[],
  );

  const asignadas = tareasBase.filter((t) =>
    tareaAsignadaAlSocioParaOperar(t, socioId, presupuestoAprobadoIds),
  );

  let precedencias: Array<{ tarea_id: string; depende_de?: string }> = [];
  if (asignadas.length > 0) {
    const ids = asignadas.map((t) => t.id);
    const { data: precData } = await supabaseAny
      .from('tarea_precedencias')
      .select('tarea_id, depende_de')
      .in('tarea_id', ids);

    precedencias = (precData ?? []).map(
      (p: { tarea_id: string; depende_de: string | null }) => ({
        tarea_id: p.tarea_id,
        depende_de: p.depende_de ?? undefined,
      }),
    );
  }

  const ordenadas = ordenarTareasPorPrecedencias(asignadas, precedencias);
  const candidatas = ordenadas.filter((t) => !tareaEstaCerradaParaSocio(t.estado));

  let bloquesPorTarea = new Map<string, Array<{ estado?: string | null }>>();
  if (asignadas.length > 0) {
    const { data: bloquesRows } = await supabaseAny
      .from('tareas_subtareas')
      .select('tarea_id, estado')
      .in(
        'tarea_id',
        asignadas.map((t) => t.id),
      );
    bloquesPorTarea = buildBloquesPorTareaMap(bloquesRows ?? []);
  }

  const operativas = filtrarTareasOperativasSocio(candidatas, {
    todasLasTareas: asignadas,
    bloquesPorTarea,
    precedencias,
  });

  return {
    tarea: operativas[0] ?? null,
    operativas,
    error: null,
  };
}
