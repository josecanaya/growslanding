import type { ObraTimelineTask } from '@/types/obras';

/** Fila típica de GET /api/tareas */
export type ApiTareaRow = {
  id: string;
  title: string;
  obra_id: string;
  responsable: string | null;
  estado: string;
  prioridad: string | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  avance: number | null;
  etapa: string | null;
  dias_presupuesto?: number;
  is_critical?: boolean | null;
  costo_presupuestado?: number | null;
  created_at: string | null;
  updated_at?: string | null;
  elemento?: { nombre?: string | null; categoria?: string | null } | null;
  obra?: { id?: string; name?: string; address?: string | null } | null;
};

export function mapEstadoDbToTimeline(
  estado: string,
): 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada' {
  const u = (estado || '').toLowerCase();
  if (u === 'validada') return 'completada';
  if (u === 'rechazada') return 'bloqueada';
  if (u === 'para_validar' || u === 'en_progreso') return 'en_progreso';
  return 'pendiente';
}

export function mapEstadoDbToTareaCardLabel(estado: string): string {
  const u = (estado || '').toLowerCase();
  if (u === 'pendiente') return 'Pendiente';
  if (u === 'en_progreso') return 'En progreso';
  if (u === 'para_validar') return 'Para validar';
  if (u === 'validada') return 'Validada';
  if (u === 'rechazada') return 'Rechazada';
  return estado || '—';
}

export function mapPrioridadDb(p: string | null | undefined): 'alta' | 'media' | 'baja' {
  const u = (p || 'media').toLowerCase();
  if (u === 'alta' || u === 'high') return 'alta';
  if (u === 'baja' || u === 'low') return 'baja';
  return 'media';
}

export function mapEtapaDb(etapa: string | null | undefined): 'estructura' | 'obra_gris' | 'terminaciones' {
  const e = (etapa || '').toLowerCase();
  if (e.includes('gris') || e.includes('obra_gris')) return 'obra_gris';
  if (e.includes('termin')) return 'terminaciones';
  return 'estructura';
}

function isoDate(d: string | null | undefined, fallback: string): string {
  if (!d) return fallback;
  return d.split('T')[0];
}

export function apiTareaToObraTimelineTask(t: ApiTareaRow, obraId: string): ObraTimelineTask {
  const fi = isoDate(
    t.fecha_inicio_estimada,
    t.created_at ? isoDate(t.created_at, new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
  );
  const ff = isoDate(t.fecha_fin_estimada, fi);
  const dias = typeof t.dias_presupuesto === 'number' ? t.dias_presupuesto : 1;
  return {
    id: t.id,
    nombre: t.title,
    obraId: t.obra_id || obraId,
    lider: t.responsable || '—',
    fechaInicio: fi,
    fechaFin: ff,
    plantilla: t.elemento?.nombre || 'Tarea',
    checklist: [],
    evidencias: [],
    estado: mapEstadoDbToTimeline(t.estado),
    etapa: mapEtapaDb(t.etapa),
    precedencia: [],
    duracion: Math.max(1, dias),
    esCritica: Boolean(t.is_critical),
    tiempoTemprano: 0,
    tiempoTardio: 0,
  };
}
