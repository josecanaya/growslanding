type TareaMini = {
  id: string;
  title: string | null;
  etapa: string | null;
  obra_id: string;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  dias_presupuesto: number | null;
};

type ObraMeta = { id: string; name: string | null; address: string | null };

export type SolicitudOportunidadDto = {
  obra_id: string;
  obra_name: string;
  direccion_completa: string;
  zona: string;
  fecha_inicio_estimada: string | null;
  duracion_estimada_dias: number | null;
  tipo_trabajo: string;
  etapa: string | null;
  estado_solicitud: 'RECIBIENDO_PRESUPUESTOS' | 'PRESUPUESTO_ENVIADO';
  tiene_presupuesto_socio: boolean;
  urgencia: 'ALTA' | 'MEDIA' | 'BAJA';
  cantidad_tareas: number;
  inicio_estimado_dias: number;
};

function daysUntil(iso: string | null): number {
  if (!iso) return 999;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 999;
  const diff = t - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function duracionEntreTareas(t: TareaMini): number | null {
  if (t.fecha_inicio_estimada && t.fecha_fin_estimada) {
    const a = new Date(t.fecha_inicio_estimada).getTime();
    const b = new Date(t.fecha_fin_estimada).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
      return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
    }
  }
  if (t.dias_presupuesto != null && t.dias_presupuesto > 0) {
    return t.dias_presupuesto;
  }
  return null;
}

type RowWithTarea = { id: string; estado: string | null; tarea: TareaMini };

/**
 * Agrupa presupuestos por obra para Oportunidades / Seguimiento.
 * @param estadosPermitidos ej. ['PENDIENTE'] u ['ENVIADO']
 */
export function buildSolicitudesPorObra(
  rows: Array<{ id: string; estado: string | null; tarea_id: string | null }>,
  tareaMap: Map<string, TareaMini>,
  obraMeta: Map<string, ObraMeta>,
  estadosPermitidos: Set<string>,
): SolicitudOportunidadDto[] {
  const enriched: RowWithTarea[] = [];
  for (const r of rows) {
    const s = (r.estado || 'PENDIENTE').toUpperCase();
    if (!estadosPermitidos.has(s)) continue;
    const tid = r.tarea_id;
    if (!tid) continue;
    const t = tareaMap.get(tid);
    if (!t?.obra_id) continue;
    enriched.push({ id: r.id, estado: r.estado, tarea: t });
  }

  const byObra = new Map<string, RowWithTarea[]>();
  for (const e of enriched) {
    const oid = e.tarea.obra_id;
    const list = byObra.get(oid) ?? [];
    list.push(e);
    byObra.set(oid, list);
  }

  const soloEnviados = estadosPermitidos.size === 1 && estadosPermitidos.has('ENVIADO');

  return [...byObra.entries()].map(([obraId, list]) => {
    const meta = obraMeta.get(obraId);
    const obra_name = meta?.name?.trim() || 'Obra';
    const direccion = (meta?.address ?? '').trim() || 'Dirección no indicada';
    const zona =
      direccion.includes(',')
        ? direccion.split(',').pop()?.trim() || direccion.slice(0, 48)
        : direccion.slice(0, 48);

    const fechas = list
      .map((x) => x.tarea.fecha_inicio_estimada)
      .filter((x): x is string => Boolean(x))
      .sort();
    const fecha_inicio_estimada = fechas[0] ?? null;

    let maxDur: number | null = null;
    for (const x of list) {
      const d = duracionEntreTareas(x.tarea);
      if (d != null) {
        maxDur = maxDur == null ? d : Math.max(maxDur, d);
      }
    }

    const estadosNorm = list.map((x) => (x.estado || 'PENDIENTE').toUpperCase());
    const hayPendiente = estadosNorm.some((s) => s === 'PENDIENTE');
    const estado_solicitud = soloEnviados
      ? ('PRESUPUESTO_ENVIADO' as const)
      : hayPendiente
        ? ('RECIBIENDO_PRESUPUESTOS' as const)
        : ('PRESUPUESTO_ENVIADO' as const);
    const tiene_presupuesto_socio = soloEnviados ? true : !hayPendiente;

    const n = list.length;
    const titles = list.map((x) => x.tarea.title).filter(Boolean) as string[];
    const tipo_trabajo =
      n === 1 && titles[0]
        ? titles[0]
        : `${n} tarea${n !== 1 ? 's' : ''} · ${obra_name}`;

    const etapas = [...new Set(list.map((x) => x.tarea.etapa).filter(Boolean))] as string[];
    const etapa =
      etapas.length === 1 ? etapas[0] : etapas.length > 1 ? etapas.slice(0, 2).join(' · ') : null;

    const diasPres = list
      .map((x) => x.tarea.dias_presupuesto)
      .filter((d): d is number => d != null && d > 0);
    let urgencia: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
    if (diasPres.some((d) => d <= 2)) urgencia = 'ALTA';
    else if (diasPres.some((d) => d <= 7)) urgencia = 'MEDIA';
    else urgencia = 'BAJA';

    return {
      obra_id: obraId,
      obra_name,
      direccion_completa: direccion,
      zona,
      fecha_inicio_estimada,
      duracion_estimada_dias: maxDur,
      tipo_trabajo,
      etapa,
      estado_solicitud,
      tiene_presupuesto_socio,
      urgencia,
      cantidad_tareas: n,
      inicio_estimado_dias: daysUntil(fecha_inicio_estimada),
    };
  });
}
