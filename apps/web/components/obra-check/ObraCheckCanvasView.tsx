'use client';

import { useMemo } from 'react';
import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { ObraCheckTask } from '@/lib/obra-check/types';
import { buildObraCheckPhaseGraph, CRITICAL_COLOR } from './buildObraCheckGraph';
import { obraCheckFlowNodeTypes } from './obraCheckFlowNodes';
import { BRAND } from './ui';

/** Timeline horizontal: fases encadenadas de izquierda a derecha, camino crítico global en rojo. */
export function ObraCheckCanvasView({ tasks }: { tasks: ObraCheckTask[] }) {
  const graph = useMemo(() => buildObraCheckPhaseGraph(tasks), [tasks]);

  return (
    <div>
      {graph.criticalTaskCount > 0 ? (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: 'linear-gradient(90deg, #FEF2F2 0%, #FEE2E2 100%)',
            border: `1.5px solid ${CRITICAL_COLOR}`,
          }}
        >
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white"
            style={{ background: CRITICAL_COLOR }}
          >
            Camino crítico
          </span>
          <p className="text-sm font-semibold" style={{ color: BRAND.blue }}>
            {graph.criticalTaskCount} tarea{graph.criticalTaskCount === 1 ? '' : 's'} sin holgura
          </p>
          <p className="text-xs" style={{ color: BRAND.muted }}>
            Atraviesa toda la obra: si se atrasan, se atrasa la entrega. Resaltadas en rojo.
          </p>
        </div>
      ) : null}

      <div
        style={{
          height: 560,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${BRAND.border}`,
          position: 'relative',
        }}
      >
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={obraCheckFlowNodeTypes}
          defaultEdgeOptions={{ zIndex: 10 }}
          fitView
          fitViewOptions={{ padding: 0.14 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Background color="#e2e8f0" gap={22} size={1} />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            ariaLabel="Mapa del plan"
            nodeStrokeWidth={2}
            maskColor="rgba(12, 29, 54, 0.12)"
            nodeColor={(n) => {
              if (n.type === 'phaseFrame' || n.type === 'phaseLabel') return '#e2e8f0';
              const critical = Boolean((n.data as { critical?: boolean } | undefined)?.critical);
              return critical ? CRITICAL_COLOR : '#94a3b8';
            }}
            style={{
              width: 168,
              height: 96,
              borderRadius: 10,
              border: `1px solid ${BRAND.border}`,
              background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
              marginBottom: 10,
              marginRight: 10,
            }}
          />
        </ReactFlow>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]" style={{ color: BRAND.muted }}>
        <span>
          <span className="font-semibold" style={{ color: BRAND.blue }}>
            {graph.edgeCount}
          </span>{' '}
          vínculo{graph.edgeCount === 1 ? '' : 's'}
        </span>
        <span aria-hidden>·</span>
        <span>Fases encadenadas → izquierda a derecha</span>
        <span aria-hidden>·</span>
        <span>
          <span className="font-bold" style={{ color: CRITICAL_COLOR }}>
            Rojo
          </span>{' '}
          = camino crítico de toda la obra
        </span>
        <span aria-hidden>·</span>
        <span>Punteado = enlace entre fases</span>
      </div>
    </div>
  );
}
