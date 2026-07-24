import { MarkerType, type Edge, type Node } from '@xyflow/react';

import { CANONICAL_PHASES, PHASE_COLORS, normalizePhase, type CanonicalPhase } from '@/lib/obra-check/phases';
import type { ObraCheckTask } from '@/lib/obra-check/types';

const NODE_W = 148;
const NODE_H = 58;
const GAP_X = 56;
const GAP_Y = 18;
const BAND_PAD_X = 20;
const BAND_PAD_Y = 36;
/** Separación horizontal entre fases (lugar para las flechas de encadenado). */
const PHASE_GAP = 96;
const HEADER_H = 46;

/** Rojo del camino crítico (pedido de producto: crítico = rojo, no dorado). */
export const CRITICAL_COLOR = '#DC2626';

export type ObraCheckGraphMeta = {
  nodes: Node[];
  edges: Edge[];
  edgeCount: number;
  criticalTaskCount: number;
  criticalEdgeCount: number;
};

/** Solo conserva predecesoras de la misma fase. */
export function samePhasePredecessors(
  task: ObraCheckTask,
  byId: Map<string, ObraCheckTask>,
): string[] {
  const phase = normalizePhase(task.fase);
  return task.predecesoras.filter((pid) => {
    const p = byId.get(pid);
    return p != null && normalizePhase(p.fase) === phase;
  });
}

function computeLayers(
  phaseTasks: ObraCheckTask[],
  predsOf: Map<string, string[]>,
): Map<string, number> {
  const ids = new Set(phaseTasks.map((t) => t.id));
  const layer = new Map<string, number>();
  const visiting = new Set<string>();

  function dfs(id: string): number {
    if (layer.has(id)) return layer.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const preds = (predsOf.get(id) ?? []).filter((p) => ids.has(p));
    const value = preds.length === 0 ? 0 : Math.max(...preds.map(dfs)) + 1;
    visiting.delete(id);
    layer.set(id, value);
    return value;
  }

  for (const t of phaseTasks) dfs(t.id);
  return layer;
}

/**
 * Timeline de obra: las fases se suceden EN HORIZONTAL (izquierda → derecha), una después
 * de otra. Dentro de cada banda, las capas avanzan en X y los hermanos se apilan en Y.
 * Entre fases se dibujan conectores (última tarea de una fase → primera de la siguiente),
 * el mismo encadenado que usa el CPM: el camino crítico atraviesa toda la obra y va en ROJO.
 */
export function buildObraCheckPhaseGraph(tasks: ObraCheckTask[]): ObraCheckGraphMeta {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const byId = new Map(tasks.map((t) => [t.id, t]));

  let bandX = 0;
  let criticalTaskCount = 0;
  let criticalEdgeCount = 0;

  /** Por fase: sumideros (sin sucesoras intra-fase) y fuentes (sin predecesoras intra-fase). */
  const sinksByPhase = new Map<CanonicalPhase, ObraCheckTask[]>();
  const sourcesByPhase = new Map<CanonicalPhase, ObraCheckTask[]>();
  const presentPhases: CanonicalPhase[] = [];

  CANONICAL_PHASES.forEach((phase) => {
    const colors = PHASE_COLORS[phase];
    const phaseTasks = tasks
      .filter((t) => normalizePhase(t.fase) === phase)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    if (phaseTasks.length === 0) return;
    presentPhases.push(phase);

    const predsOf = new Map<string, string[]>();
    for (const t of phaseTasks) {
      predsOf.set(t.id, samePhasePredecessors(t, byId));
    }
    const succCount = new Map<string, number>();
    for (const t of phaseTasks) succCount.set(t.id, 0);
    for (const t of phaseTasks) {
      for (const p of predsOf.get(t.id) ?? []) succCount.set(p, (succCount.get(p) ?? 0) + 1);
    }
    sinksByPhase.set(phase, phaseTasks.filter((t) => (succCount.get(t.id) ?? 0) === 0));
    sourcesByPhase.set(phase, phaseTasks.filter((t) => (predsOf.get(t.id) ?? []).length === 0));

    const layers = computeLayers(phaseTasks, predsOf);
    const maxLayer = Math.max(0, ...[...layers.values()]);

    // Por capa: agrupar para apilar en vertical (hermanos juntos).
    const byLayer = new Map<number, ObraCheckTask[]>();
    for (const t of phaseTasks) {
      const L = layers.get(t.id) ?? 0;
      if (!byLayer.has(L)) byLayer.set(L, []);
      byLayer.get(L)!.push(t);
    }

    const laneOf = new Map<string, number>();
    let maxLanes = 1;
    for (let L = 0; L <= maxLayer; L++) {
      const group = byLayer.get(L) ?? [];
      group.sort((a, b) => {
        const pa = (predsOf.get(a.id) ?? [])[0] ?? '';
        const pb = (predsOf.get(b.id) ?? [])[0] ?? '';
        if (pa !== pb) return pa.localeCompare(pb);
        return (a.orden ?? 0) - (b.orden ?? 0);
      });
      group.forEach((t, i) => laneOf.set(t.id, i));
      maxLanes = Math.max(maxLanes, group.length);
    }

    const contentW = (maxLayer + 1) * (NODE_W + GAP_X) - GAP_X + BAND_PAD_X * 2;
    const contentH = maxLanes * (NODE_H + GAP_Y) - GAP_Y + BAND_PAD_Y + 8;
    const bandW = Math.max(contentW, 240);
    const bandH = Math.max(contentH, NODE_H + BAND_PAD_Y);

    // Encabezado de fase (arriba de la banda).
    nodes.push({
      id: `phase-label-${phase}`,
      type: 'phaseLabel',
      position: { x: bandX + 4, y: 0 },
      draggable: false,
      selectable: false,
      zIndex: 1,
      data: { label: phase, count: phaseTasks.length, accent: colors.bar },
      style: { width: bandW - 8, height: HEADER_H - 10, zIndex: 1 },
    });

    // Banda suave (fondo), detrás de todo.
    nodes.push({
      id: `phase-band-${phase}`,
      type: 'phaseFrame',
      position: { x: bandX, y: HEADER_H },
      draggable: false,
      selectable: false,
      zIndex: -1,
      data: { phase },
      style: {
        width: bandW,
        height: bandH,
        zIndex: -1,
        background: colors.bg,
        border: `1px solid ${colors.border}33`,
        borderRadius: 16,
        borderTop: `3px solid ${colors.bar}99`,
      },
    });

    for (const t of phaseTasks) {
      const L = layers.get(t.id) ?? 0;
      const lane = laneOf.get(t.id) ?? 0;
      const critical = Boolean(t.esCritica);
      if (critical) criticalTaskCount += 1;

      const x = bandX + BAND_PAD_X + L * (NODE_W + GAP_X);
      const y = HEADER_H + BAND_PAD_Y / 2 + lane * (NODE_H + GAP_Y);

      nodes.push({
        id: t.id,
        type: 'taskCard',
        position: { x, y },
        draggable: false,
        selectable: true,
        zIndex: critical ? 8 : 5,
        data: {
          label: t.nombre,
          duracion: t.duracionDias,
          phase,
          critical,
          predCount: (predsOf.get(t.id) ?? []).length,
        },
        style: { width: NODE_W, zIndex: critical ? 8 : 5 },
      });
    }

    // Aristas intra-fase.
    for (const t of phaseTasks) {
      for (const p of predsOf.get(t.id) ?? []) {
        if (!byId.has(p)) continue;
        const critical = Boolean(t.esCritica && byId.get(p)?.esCritica);
        if (critical) criticalEdgeCount += 1;
        const stroke = critical ? CRITICAL_COLOR : '#94a3b8';

        edges.push({
          id: `e-${p}-${t.id}`,
          source: p,
          target: t.id,
          type: 'smoothstep',
          sourceHandle: 'out-right',
          targetHandle: 'in-left',
          animated: critical,
          zIndex: critical ? 20 : 10,
          style: {
            stroke,
            strokeWidth: critical ? 3.25 : 1.25,
            opacity: critical ? 1 : 0.55,
            zIndex: critical ? 20 : 10,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: critical ? 18 : 14,
            height: critical ? 18 : 14,
          },
        });
      }
    }

    bandX += bandW + PHASE_GAP;
  });

  // Conectores entre fases: sumideros de la fase N → fuentes de la fase N+1 (mismo encadenado
  // que el CPM). El tramo crítico va en rojo animado; el resto punteado gris.
  for (let i = 1; i < presentPhases.length; i++) {
    const prev = presentPhases[i - 1]!;
    const curr = presentPhases[i]!;
    for (const sink of sinksByPhase.get(prev) ?? []) {
      for (const source of sourcesByPhase.get(curr) ?? []) {
        const critical = Boolean(sink.esCritica && source.esCritica);
        if (critical) criticalEdgeCount += 1;
        const stroke = critical ? CRITICAL_COLOR : '#94a3b8';

        edges.push({
          id: `pc-${sink.id}-${source.id}`,
          source: sink.id,
          target: source.id,
          type: 'smoothstep',
          sourceHandle: 'out-right',
          targetHandle: 'in-left',
          animated: critical,
          zIndex: critical ? 20 : 9,
          style: {
            stroke,
            strokeWidth: critical ? 3.25 : 1.5,
            strokeDasharray: critical ? undefined : '7 5',
            opacity: critical ? 1 : 0.5,
            zIndex: critical ? 20 : 9,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: critical ? 18 : 14,
            height: critical ? 18 : 14,
          },
        });
      }
    }
  }

  return {
    nodes,
    edges,
    edgeCount: edges.length,
    criticalTaskCount,
    criticalEdgeCount,
  };
}

export function phaseAccent(phase: CanonicalPhase): string {
  return PHASE_COLORS[phase].bar;
}
