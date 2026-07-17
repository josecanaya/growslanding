import { MarkerType, type Edge, type Node } from '@xyflow/react';

import { CANONICAL_PHASES, PHASE_COLORS, normalizePhase } from '@/lib/obra-check/phases';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND } from './ui';

const COL_W = 260;
const ROW_H = 78;
const PHASE_HEADER = 44;
const COL_GAP = 56;

/**
 * Grafo de tareas en 4 columnas de fase.
 * El fondo de fase NO cubre las tareas (solo cabecera + marco), para que las
 * aristas de precedencia dentro de la columna queden visibles.
 */
export function buildObraCheckPhaseGraph(tasks: ObraCheckTask[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const phaseOf = new Map(tasks.map((t) => [t.id, normalizePhase(t.fase)]));

  CANONICAL_PHASES.forEach((phase, col) => {
    const colors = PHASE_COLORS[phase];
    const phaseTasks = tasks
      .filter((t) => normalizePhase(t.fase) === phase)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    const colHeight = Math.max(phaseTasks.length, 1) * ROW_H + PHASE_HEADER + 28;
    const colX = col * (COL_W + COL_GAP);

    // Cabecera de fase (no tapa aristas entre tareas).
    nodes.push({
      id: `phase-hdr-${phase}`,
      type: 'phaseLane',
      position: { x: colX, y: 0 },
      draggable: false,
      selectable: false,
      zIndex: 1,
      data: { label: phase, count: phaseTasks.length },
      style: {
        width: COL_W,
        height: PHASE_HEADER,
        zIndex: 1,
        background: colors.bar,
        border: `2px solid ${colors.border}`,
        borderBottom: 'none',
        borderRadius: '12px 12px 0 0',
        padding: 0,
      },
    });

    // Marco de columna (solo borde + fondo; debajo de tareas y aristas).
    nodes.push({
      id: `phase-bg-${phase}`,
      type: 'phaseFrame',
      position: { x: colX, y: PHASE_HEADER },
      draggable: false,
      selectable: false,
      zIndex: -1,
      data: { phase },
      style: {
        width: COL_W,
        height: colHeight - PHASE_HEADER,
        zIndex: -1,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: 0,
      },
    });

    phaseTasks.forEach((t, row) => {
      nodes.push({
        id: t.id,
        type: 'taskCard',
        position: { x: colX + 10, y: PHASE_HEADER + 12 + row * ROW_H },
        draggable: false,
        selectable: true,
        zIndex: 5,
        data: {
          label: t.nombre,
          duracion: t.duracionDias,
          phase,
          critical: Boolean(t.esCritica),
          predCount: t.predecesoras.length,
        },
        style: { width: COL_W - 20, zIndex: 5 },
      });
    });
  });

  for (const t of tasks) {
    for (const p of t.predecesoras) {
      if (!taskById.has(p) || !taskById.has(t.id)) continue;
      const samePhase = phaseOf.get(p) === phaseOf.get(t.id);
      const critical = Boolean(t.esCritica && taskById.get(p)?.esCritica);
      const stroke = critical ? BRAND.gold : samePhase ? BRAND.blue : BRAND.blueLight;

      edges.push({
        id: `e-${p}-${t.id}`,
        source: p,
        target: t.id,
        // Misma fase: vertical (top/bottom). Entre fases: smoothstep por el hueco.
        type: samePhase ? 'straight' : 'smoothstep',
        sourceHandle: samePhase ? 'out-bottom' : 'out-right',
        targetHandle: samePhase ? 'in-top' : 'in-left',
        animated: critical,
        zIndex: 10,
        label: samePhase ? undefined : 'FS',
        labelStyle: { fontSize: 9, fill: BRAND.muted, fontWeight: 600 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.85 },
        style: {
          stroke,
          strokeWidth: critical ? 2.5 : samePhase ? 2 : 1.75,
          zIndex: 10,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
      });
    }
  }

  return { nodes, edges };
}
