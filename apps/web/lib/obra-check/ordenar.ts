/**
 * Orden de tareas de Obra Check.
 *
 * - Si hay dependencias declaradas → CPM real (reutiliza lib/utils/cpm) → orden por Early Start
 *   y marcado de camino crítico.
 * - Si NO hay dependencias → orden por fecha de inicio, y si tampoco hay fechas, por la secuencia
 *   constructiva canónica de rubros. Se emite un warning (es dato: el plan no tiene precedencias).
 * - Si hay un ciclo → fallback a orden por rubro + warning.
 */

import { calcularCPM, type TareaCPM } from '@/lib/utils/cpm';
import type { ObraCheckTask, ObraCheckWarning, OrdenarResult } from './types';
import { rubroOrden } from './rubros';
import { sugerirBloques } from './sugerirBloques';

const DURACION_DEFAULT = 1;

function ordenarPorRubroYFecha(tasks: ObraCheckTask[]): ObraCheckTask[] {
  const withIndex = tasks.map((t, i) => ({ t, i }));
  withIndex.sort((a, b) => {
    // 1) fecha de inicio si ambas la tienen
    if (a.t.inicio && b.t.inicio && a.t.inicio !== b.t.inicio) {
      return a.t.inicio < b.t.inicio ? -1 : 1;
    }
    // 2) secuencia constructiva canónica
    const ra = rubroOrden(a.t.rubro);
    const rb = rubroOrden(b.t.rubro);
    if (ra !== rb) return ra - rb;
    // 3) orden original estable
    return a.i - b.i;
  });
  return withIndex.map(({ t }, idx) => ({ ...t, orden: idx, esCritica: false }));
}

export function ordenarTareas(tasks: ObraCheckTask[]): OrdenarResult {
  const warnings: ObraCheckWarning[] = [];

  if (tasks.length === 0) {
    return { tasks: [], blocks: [], cpm: { duracionTotalDias: 0, tareasCriticas: 0 }, warnings };
  }

  const hayDependencias = tasks.some((t) => t.predecesoras.length > 0);

  if (!hayDependencias) {
    warnings.push({
      kind: 'sin_dependencias',
      message: 'El plan no declara dependencias entre tareas. Se ordenó por fecha y secuencia constructiva.',
    });
    const ordered = ordenarPorRubroYFecha(tasks);
    const blocks = sugerirBloques(ordered);
    const ordered2 = aplicarBloques(ordered, blocks);
    return {
      tasks: ordered2,
      blocks,
      cpm: { duracionTotalDias: 0, tareasCriticas: 0 },
      warnings,
    };
  }

  const cpmInput: TareaCPM[] = tasks.map((t) => ({
    id: t.id,
    name: t.nombre,
    duration: t.duracionDias ?? DURACION_DEFAULT,
    predecessors: t.predecesoras,
  }));

  let cpmResult;
  try {
    cpmResult = calcularCPM(cpmInput);
  } catch (err) {
    // Ciclo detectado por el forward pass → fallback seguro.
    warnings.push({
      kind: 'ciclo_detectado',
      message: `Se detectó un ciclo en las dependencias (${(err as Error).message}). Se ordenó por secuencia constructiva.`,
    });
    const ordered = ordenarPorRubroYFecha(tasks);
    const blocks = sugerirBloques(ordered);
    return {
      tasks: aplicarBloques(ordered, blocks),
      blocks,
      cpm: { duracionTotalDias: 0, tareasCriticas: 0 },
      warnings,
    };
  }

  const byId = new Map(cpmResult.tareas.map((r) => [r.id, r]));
  const ordered = [...tasks]
    .map((t, i) => ({ t, r: byId.get(t.id), i }))
    .sort((a, b) => {
      const esA = a.r?.es ?? 0;
      const esB = b.r?.es ?? 0;
      if (esA !== esB) return esA - esB;
      return a.i - b.i;
    })
    .map(({ t, r }, idx) => ({
      ...t,
      orden: idx,
      esCritica: r?.isCritical ?? false,
    }));

  const blocks = sugerirBloques(ordered);

  return {
    tasks: aplicarBloques(ordered, blocks),
    blocks,
    cpm: {
      duracionTotalDias: cpmResult.project_duration,
      tareasCriticas: cpmResult.critical_count,
    },
    warnings,
  };
}

/** Escribe el blockId en cada tarea según los bloques sugeridos. */
function aplicarBloques(
  tasks: ObraCheckTask[],
  blocks: ReturnType<typeof sugerirBloques>,
): ObraCheckTask[] {
  const taskToBlock = new Map<string, string>();
  for (const b of blocks) {
    for (const tid of b.taskIds) taskToBlock.set(tid, b.id);
  }
  return tasks.map((t) => ({ ...t, blockId: taskToBlock.get(t.id) ?? null }));
}
