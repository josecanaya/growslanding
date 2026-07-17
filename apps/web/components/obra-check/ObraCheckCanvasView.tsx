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

  return (
    <div
      style={{
        height: 480,
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
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        minZoom={0.15}
        maxZoom={1.2}
      >
        <Background color={BRAND.border} gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
