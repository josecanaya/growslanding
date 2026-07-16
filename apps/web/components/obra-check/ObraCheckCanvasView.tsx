'use client';

/**
 * Vista de solo lectura del plan ordenado, con el mismo motor de grafo del canvas real de Grows
 * (@xyflow/react). Los bloques son columnas; las tareas, nodos; las precedencias, aristas. El
 * camino crítico se resalta. NO usa CanvasObraEditor (que requiere obraId real de Supabase).
 */

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { ObraCheckBlock, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND } from './ui';

const COL_WIDTH = 260;
const ROW_HEIGHT = 84;

export function ObraCheckCanvasView({
  tasks,
  blocks,
}: {
  tasks: ObraCheckTask[];
  blocks: ObraCheckBlock[];
}) {
  const { nodes, edges } = useMemo(() => {
    const orderedBlocks = [...blocks].sort((a, b) => a.orden - b.orden);
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const nodes: Node[] = [];

    orderedBlocks.forEach((block, bi) => {
      // Encabezado del bloque
      nodes.push({
        id: `block-${block.id}`,
        position: { x: bi * COL_WIDTH, y: 0 },
        data: { label: `${block.fase ? `${block.fase} · ` : ''}${block.nombre}` },
        draggable: false,
        selectable: false,
        style: {
          width: COL_WIDTH - 32,
          background: BRAND.blue,
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 12,
          padding: 8,
        },
      });

      block.taskIds.forEach((tid, ti) => {
        const t = taskById.get(tid);
        if (!t) return;
        const critical = t.esCritica;
        nodes.push({
          id: tid,
          position: { x: bi * COL_WIDTH, y: (ti + 1) * ROW_HEIGHT },
          data: {
            label: `${t.nombre}${t.duracionDias ? ` · ${t.duracionDias}d` : ''}`,
          },
          draggable: false,
          selectable: false,
          style: {
            width: COL_WIDTH - 32,
            background: '#fff',
            color: BRAND.text,
            border: `1.5px solid ${critical ? BRAND.gold : BRAND.border}`,
            boxShadow: critical ? `0 0 0 2px ${BRAND.gold}33` : 'none',
            borderRadius: 10,
            fontSize: 12,
            padding: 8,
          },
        });
      });
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges: Edge[] = [];
    for (const t of tasks) {
      for (const p of t.predecesoras) {
        if (!nodeIds.has(p) || !nodeIds.has(t.id)) continue;
        const critical = t.esCritica && taskById.get(p)?.esCritica;
        edges.push({
          id: `e-${p}-${t.id}`,
          source: p,
          target: t.id,
          animated: Boolean(critical),
          style: { stroke: critical ? BRAND.gold : BRAND.blueLight, strokeWidth: critical ? 2 : 1.2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: critical ? BRAND.gold : BRAND.blueLight },
        });
      }
    }

    return { nodes, edges };
  }, [tasks, blocks]);

  return (
    <div style={{ height: 460, width: '100%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${BRAND.border}` }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
      >
        <Background color={BRAND.border} gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
