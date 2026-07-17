'use client';

import { useMemo } from 'react';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { ObraCheckTask } from '@/lib/obra-check/types';
import { buildObraCheckPhaseGraph } from './buildObraCheckGraph';
import { obraCheckFlowNodeTypes } from './obraCheckFlowNodes';
import { BRAND } from './ui';

/** Vista del plan ordenado: 4 columnas de fase (read-only), estilo canvas Grows. */
export function ObraCheckCanvasView({ tasks }: { tasks: ObraCheckTask[] }) {
  const { nodes, edges } = useMemo(() => buildObraCheckPhaseGraph(tasks), [tasks]);
  const edgeCount = edges.length;

  return (
    <div>
      <div
        style={{
          height: 520,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={obraCheckFlowNodeTypes}
          defaultEdgeOptions={{ zIndex: 10 }}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          minZoom={0.12}
          maxZoom={1.4}
        >
          <Background color={BRAND.border} gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="mt-2 text-center text-[11px]" style={{ color: BRAND.muted }}>
        {edgeCount > 0 ? (
          <>
            <span className="font-semibold" style={{ color: BRAND.blue }}>
              {edgeCount} dependencia(s)
            </span>{' '}
            · flechas verticales = dentro de la misma fase · horizontales = entre fases · dorado =
            camino crítico
          </>
        ) : (
          <>Sin dependencias dibujadas. Definilas en “tareas” o en “fases” antes de ordenar.</>
        )}
      </p>
    </div>
  );
}
