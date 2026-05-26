import type { ApiTareaRow } from '@/lib/mappers/tarea-api-to-ui';

type PresupuestoSemanal = { semana: number; proyectado: number; ejecutado: number };

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseIso(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function estadoLower(e: string | null | undefined): string {
  return (e || '').toLowerCase();
}

export type ClienteHomeTareasKpis = {
  tareasEstaSemana: number;
  avancePct: number;
  desktop: {
    tareasPendientes: number;
    tareasVencidas: number;
    tareasProximas7d: number;
    completadasUltimos7d: number[];
  };
  mobile: {
    tareas: {
      enCurso: number;
      paraValidar: number;
      completadas: number;
      bloqueadas: number;
      total: number;
      vencidas: number;
      proximas7d: number;
      ritmoPromedio: number;
    };
    presupuesto: { presupuestado: number; ejecutado: number };
    presupuestoSemanal: PresupuestoSemanal[];
    actividad: {
      tareasCompletadasPorSemana: Array<{ semana: number; completadas: number; planificadas: number }>;
    };
    weeklyCompleted: number[];
  };
};

const MS_DAY = 86400000;

/**
 * KPIs de home cliente derivados solo de filas de GET /api/tareas (sin fixtures).
 */
export function buildClienteHomeTareasKpis(tareas: ApiTareaRow[]): ClienteHomeTareasKpis {
  const now = new Date();
  const startToday = startOfLocalDay(now);
  const finVentana7d = new Date(startToday);
  finVentana7d.setDate(finVentana7d.getDate() + 7);

  const weekAgoTs = now.getTime() - 7 * MS_DAY;
  const twoWeeksAgo = new Date(startToday);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  let pendientes = 0;
  let enCurso = 0;
  let paraValidar = 0;
  let completadas = 0;
  let bloqueadas = 0;
  let vencidas = 0;
  let proximas7d = 0;
  let tareasEstaSemana = 0;

  const completadasUltimos7d = [0, 0, 0, 0, 0, 0, 0];
  const buckets24 = new Array(24).fill(0);
  const weeklyCompleted = new Array(24).fill(0);
  let completadasUltimas2Semanas = 0;

  for (const t of tareas) {
    const e = estadoLower(t.estado);
    if (e === 'pendiente') pendientes++;
    else if (e === 'en_progreso') enCurso++;
    else if (e === 'para_validar') paraValidar++;
    else if (e === 'validada') completadas++;
    else if (e === 'rechazada') bloqueadas++;

    const finEst = parseIso(t.fecha_fin_estimada);
    const esTerminal = e === 'validada' || e === 'rechazada';
    if (finEst && finEst < startToday && !esTerminal) vencidas++;
    if (finEst && !esTerminal && finEst >= startToday && finEst < finVentana7d) proximas7d++;

    const upd = parseIso(t.updated_at);
    if (upd && upd.getTime() >= weekAgoTs) tareasEstaSemana++;

    if (e === 'validada') {
      const ref = parseIso(t.fecha_fin_real) ?? parseIso(t.updated_at);
      if (ref) {
        const dayRef = startOfLocalDay(ref);
        const diffDays = Math.round((startToday.getTime() - dayRef.getTime()) / MS_DAY);
        if (diffDays >= 0 && diffDays < 7) {
          completadasUltimos7d[6 - diffDays] += 1;
        }
        if (ref >= twoWeeksAgo) completadasUltimas2Semanas++;

        const diffMs = startToday.getTime() - dayRef.getTime();
        const weeksAgo = Math.floor(diffMs / (7 * MS_DAY));
        if (weeksAgo >= 0 && weeksAgo < 24) {
          buckets24[23 - weeksAgo] += 1;
          weeklyCompleted[23 - weeksAgo] += 1;
        }
      }
    }
  }

  const total = tareas.length;
  const avancePct = total > 0 ? Math.min(100, Math.round((completadas / total) * 100)) : 0;
  const ritmoPromedio = completadasUltimas2Semanas / 2;

  const tareasCompletadasPorSemana = buckets24.map((c, i) => ({
    semana: i + 1,
    completadas: c,
    planificadas: c,
  }));

  return {
    tareasEstaSemana,
    avancePct,
    desktop: {
      tareasPendientes: pendientes,
      tareasVencidas: vencidas,
      tareasProximas7d: proximas7d,
      completadasUltimos7d,
    },
    mobile: {
      tareas: {
        enCurso,
        paraValidar,
        completadas,
        bloqueadas,
        total,
        vencidas,
        proximas7d,
        ritmoPromedio: Number.isFinite(ritmoPromedio) ? ritmoPromedio : 0,
      },
      presupuesto: { presupuestado: 0, ejecutado: 0 },
      presupuestoSemanal: [] as PresupuestoSemanal[],
      actividad: { tareasCompletadasPorSemana },
      weeklyCompleted,
    },
  };
}
