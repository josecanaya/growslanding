import { MarkerType, type Edge, type Node } from '@xyflow/react';

import { CANONICAL_PHASES, PHASE_COLORS, normalizePhase } from '@/lib/obra-check/phases';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND } from './ui';

const COL_W = 240;
const ROW_H = 72;
const PHASE_HEADER = 44;

/** Grafo de tareas agrupado en 4 columnas de fase (estilo canvas Grows). */
export function buildObraCheckPhaseGraph(tasks: ObraCheckTask[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  CANONICAL_PHASES.forEach((phase, col) => {
    const colors = PHASE_COLORS[phase];
    const phaseTasks = tasks
      .filter((t) => normalizePhase(t.fase) === phase)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    const colHeight = Math.max(phaseTasks.length, 1) * ROW_H + PHASE_HEADER + 24;

    nodes.push({
      id: `phase-bg-${phase}`,
      type: 'phaseLane',
      position: { x: col * (COL_W + 32), y: 0 },
      draggable: false,
      selectable: false,
      data: { label: phase, count: phaseTasks.length },
      style: {
        width: COL_W,
        height: colHeight,
        zIndex: 0,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 12,
        padding: 0,
      },
    });

    phaseTasks.forEach((t, row) => {
      const critical = t.esCritica;
      nodes.push({
        id: t.id,
        type: 'taskCard',
        position: { x: col * (COL_W + 32) + 10, y: PHASE_HEADER + 20 + row * ROW_H },
        draggable: false,
        selectable: true,
        data: {
          label: t.nombre,
          duracion: t.duracionDias,
          phase,
          critical,
        },
        style: { width: COL_W - 20, zIndex: 2 },
      });
    });
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const t of tasks) {
    for (const p of t.predecesoras) {
      if (!taskById.has(p) || !taskById.has(t.id)) continue;
      const critical = t.esCritica && taskById.get(p)?.esCritica;
      edges.push({
        id: `e-${p}-${t.id}`,
        source: p,
        target: t.id,
        type: 'smoothstep',
        animated: Boolean(critical),
        style: { stroke: critical ? BRAND.gold : BRAND.blueLight, strokeWidth: critical ? 2.5 : 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: critical ? BRAND.gold : BRAND.blueLight },
      });
    }
  }

  return { nodes, edges };
}
