/**
 * Orden de tareas de Obra Check.
 *
 * Modelo temporal: las FASES SON SECUENCIALES — la primera tarea de una fase arranca cuando
 * termina la última de la fase anterior. Para el CPM se inyectan dependencias virtuales entre
 * fases (sumideros de la fase N → fuentes de la fase N+1), así el camino crítico atraviesa
 * TODA la obra y la duración total es la suma real de las fases. Esas dependencias virtuales
 * NO se persisten en `predecesoras` (que sigue siendo solo intra-fase).
 *
 * - Con dependencias declaradas y/o varias fases → CPM real global.
 * - Una sola fase y sin dependencias → orden por fecha/secuencia constructiva + warning.
 * - Ciclo → fallback a orden por rubro + warning.
 */

import { calcularCPM, type TareaCPM } from '@/lib/utils/cpm';
import type { ObraCheckTask, ObraCheckWarning, OrdenarResult } from './types';
import { CANONICAL_PHASES, normalizePhase, phaseIndex } from './phases';
import { rubroOrden } from './rubros';
import { sugerirBloques } from './sugerirBloques';

const DURACION_DEFAULT = 1;

/** Las dependencias solo valen dentro de la misma fase. */
function stripCrossPhasePredecessors(tasks: ObraCheckTask[]): ObraCheckTask[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return tasks.map((t) => {
    const phase = normalizePhase(t.fase);
    return {
      ...t,
      predecesoras: t.predecesoras.filter((pid) => {
        const p = byId.get(pid);
        return p != null && normalizePhase(p.fase) === phase;
      }),
    };
  });
}

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

/**
 * Dependencias virtuales entre fases consecutivas: cada tarea SIN predecesoras de la fase N+1
 * (fuente) depende de todas las tareas SIN sucesoras de la fase N (sumideros). Solo para el CPM.
 */
export function interPhaseVirtualPreds(scoped: ObraCheckTask[]): Map<string, string[]> {
  const succCount = new Map<string, number>();
  for (const t of scoped) succCount.set(t.id, 0);
  for (const t of scoped) {
    for (const p of t.predecesoras) succCount.set(p, (succCount.get(p) ?? 0) + 1);
  }

  const present = CANONICAL_PHASES.filter((ph) =>
    scoped.some((t) => normalizePhase(t.fase) === ph),
  );

  const virtual = new Map<string, string[]>();
  for (let i = 1; i < present.length; i++) {
    const prevSinks = scoped
      .filter((t) => normalizePhase(t.fase) === present[i - 1] && (succCount.get(t.id) ?? 0) === 0)
      .map((t) => t.id);
    const sources = scoped.filter(
      (t) => normalizePhase(t.fase) === present[i] && t.predecesoras.length === 0,
    );
    for (const src of sources) virtual.set(src.id, prevSinks);
  }
  return virtual;
}

export function ordenarTareas(tasks: ObraCheckTask[]): OrdenarResult {
  const warnings: ObraCheckWarning[] = [];
  const scoped = stripCrossPhasePredecessors(tasks);

  if (scoped.length === 0) {
    return { tasks: [], blocks: [], cpm: { duracionTotalDias: 0, tareasCriticas: 0 }, warnings };
  }

  const hayDependencias = scoped.some((t) => t.predecesoras.length > 0);
  const presentPhases = new Set(scoped.map((t) => normalizePhase(t.fase)));
  const multiFase = presentPhases.size > 1;

  // Una sola fase y cero dependencias: no hay grafo posible → orden por secuencia constructiva.
  if (!hayDependencias && !multiFase) {
    warnings.push({
      kind: 'sin_dependencias',
      message: 'El plan no declara dependencias entre tareas de la misma fase. Se ordenó por fecha y secuencia constructiva.',
    });
    const ordered = ordenarPorRubroYFecha(scoped);
    const blocks = sugerirBloques(ordered);
    const ordered2 = aplicarBloques(ordered, blocks);
    return {
      tasks: ordered2,
      blocks,
      cpm: { duracionTotalDias: 0, tareasCriticas: 0 },
      warnings,
    };
  }

  if (!hayDependencias) {
    warnings.push({
      kind: 'sin_dependencias',
      message:
        'Sin dependencias declaradas dentro de las fases: el plan se encadenó por fases (cada fase arranca cuando termina la anterior).',
    });
  }

  const virtualPreds = interPhaseVirtualPreds(scoped);
  const cpmInput: TareaCPM[] = scoped.map((t) => ({
    id: t.id,
    name: t.nombre,
    duration: t.duracionDias ?? DURACION_DEFAULT,
    predecessors: [...t.predecesoras, ...(virtualPreds.get(t.id) ?? [])],
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
    const ordered = ordenarPorRubroYFecha(scoped);
    const blocks = sugerirBloques(ordered);
    return {
      tasks: aplicarBloques(ordered, blocks),
      blocks,
      cpm: { duracionTotalDias: 0, tareasCriticas: 0 },
      warnings,
    };
  }

  const byId = new Map(cpmResult.tareas.map((r) => [r.id, r]));
  const ordered = [...scoped]
    .map((t, i) => ({ t, r: byId.get(t.id), i }))
    .sort((a, b) => {
      const esA = a.r?.es ?? 0;
      const esB = b.r?.es ?? 0;
      if (esA !== esB) return esA - esB;
      const phA = phaseIndex(a.t.fase);
      const phB = phaseIndex(b.t.fase);
      if (phA !== phB) return phA - phB;
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
