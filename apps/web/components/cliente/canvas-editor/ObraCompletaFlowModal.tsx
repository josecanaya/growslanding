'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Focus, GitBranch } from 'lucide-react';

import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { buildObraCompletaGraph, type ObraCompletaTaskMetrics } from './buildObraCompletaGraph';
import { pertFlowNodeTypes } from './PertTaskNode';

type Props = {
  open: boolean;
  onClose: () => void;
  obraNombre: string;
  nodes: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  onNavigateToTask?: (taskNodeId: string) => void;
};

function FitOnOpen({ active }: { active: boolean }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      void fitView({ padding: 0.12, duration: 280, maxZoom: 1.15 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [active, fitView]);
  return null;
}

function AjustarButton() {
  const { fitView } = useReactFlow();
  return (
    <button
      type="button"
      onClick={() => void fitView({ padding: 0.12, duration: 200 })}
      className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-bold text-[#334155] shadow-sm"
    >
      <Focus className="h-3.5 w-3.5" />
      Ajustar
    </button>
  );
}

function ObraCompletaFlowInner({
  obraNombre,
  nodes,
  edges,
  onClose,
  onNavigateToTask,
}: Omit<Props, 'open'>) {
  const [soloCriticas, setSoloCriticas] = useState(false);
  const [selected, setSelected] = useState<ObraCompletaTaskMetrics | null>(null);

  const graph = useMemo(() => buildObraCompletaGraph(nodes, edges), [nodes, edges]);

  const filtered = useMemo(() => {
    if (!soloCriticas) return graph;
    const criticalIds = new Set(
      [...graph.metricsById.values()].filter((m) => m.isCritical).map((m) => m.taskId),
    );
    return {
      ...graph,
      nodes: graph.nodes.filter((n) => criticalIds.has(n.id)),
      edges: graph.edges.filter((e) => criticalIds.has(e.source) && criticalIds.has(e.target)),
    };
  }, [graph, soloCriticas]);

  const criticalCount = useMemo(
    () => [...graph.metricsById.values()].filter((m) => m.isCritical).length,
    [graph.metricsById],
  );

  const faseLegend = useMemo(() => {
    const byFase = new Map<string, ObraCompletaTaskMetrics['faseColor']>();
    for (const m of graph.metricsById.values()) {
      if (!byFase.has(m.faseLabel)) byFase.set(m.faseLabel, m.faseColor);
    }
    return [...byFase.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [graph.metricsById]);

  const onNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      setSelected(graph.metricsById.get(node.id) ?? null);
    },
    [graph.metricsById],
  );

  if (graph.taskCount === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-bold text-[#0f172a]">Sin tareas en la obra</p>
        <p className="max-w-md text-sm text-[#64748b]">
          Creá tareas en los ambientes del canvas para armar el diagrama global.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <ReactFlow
        nodes={filtered.nodes}
        edges={filtered.edges}
        nodeTypes={pertFlowNodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        minZoom={0.04}
        maxZoom={2}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelected(null)}
        className="h-full w-full flex-1 !bg-[#f8fafc]"
      >
        <FitOnOpen active={filtered.nodes.length > 0} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap zoomable pannable className="!rounded-lg !border !border-[#e2e8f0] !bg-white/90" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />

        <Panel position="top-left" className="!m-3 max-w-[min(92vw,420px)]">
          <div className="rounded-xl border border-[#e2e8f0] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#64748b]">Obra completa</p>
            <h2 className="text-base font-extrabold text-[#0f172a]">{obraNombre}</h2>
            <p className="mt-1 text-[11px] text-[#64748b]">
              Solo lectura · {graph.taskCount} tareas · {graph.edgeCount} vínculos canvas
              {graph.macroBridgeCount > 0
                ? ` · ${graph.macroBridgeCount} enlaces fase/piso`
                : ''}
              {graph.implicitAmbienteChainCount > 0
                ? ` · ${graph.implicitAmbienteChainCount} cadena ambiente`
                : ''}{' '}
              · {graph.projectDuration}d · críticas {criticalCount}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-[#94a3b8]">
              Izquierda → derecha = orden de precedencia. Cada caja tiene color de{' '}
              <span className="font-semibold text-[#334155]">fase</span> (franja superior). Líneas{' '}
              <span className="font-semibold text-amber-700">naranjas (FS)</span> = cierre de fase/piso →
              inicio del siguiente. <span className="text-[#64748b]">Grises (→)</span> = orden en ambiente sin
              vínculos. Verdes = vínculos del canvas.
            </p>
            <div className="mt-2 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-2.5 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-[#64748b]">
                Cómo leer cada caja
              </p>
              <ul className="mt-1 space-y-0.5 text-[10px] leading-snug text-[#475569]">
                <li>
                  <span className="font-semibold text-[#b91c1c]">ES / EF</span> (rojo): inicio y fin{' '}
                  <em>tempranos</em> en días desde el arranque del plan.
                </li>
                <li>
                  <span className="font-semibold text-[#0f172a]">LS / LF</span> (negro): inicio y fin{' '}
                  <em>tardíos</em> sin retrasar la obra.
                </li>
                <li>
                  Número grande = <span className="font-semibold">duración</span> de la tarea en días.
                </li>
                <li>
                  <span className="font-semibold text-[#16a34a]">H0</span> en flechas = holgura 0 (encadenadas
                  sin margen).
                </li>
              </ul>
            </div>
            {faseLegend.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {faseLegend.map(([name, style]) => (
                  <span
                    key={name}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                    style={{ borderColor: style.border, backgroundColor: style.bg, color: style.text }}
                    title={name}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: style.bar }}
                    />
                    <span className="truncate">{name}</span>
                  </span>
                ))}
              </div>
            ) : null}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={soloCriticas}
                onChange={(e) => setSoloCriticas(e.target.checked)}
                className="h-3.5 w-3.5 rounded"
              />
              Mostrar solo ruta crítica
            </label>
          </div>
        </Panel>

        <Panel position="top-right" className="!m-3 flex gap-2">
          <AjustarButton />
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-bold text-[#334155] shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
            Cerrar
          </button>
        </Panel>

        {selected ? (
          <Panel position="bottom-right" className="!m-3 !max-w-[min(92vw,320px)]">
            <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm shadow-lg">
              <p className="text-[10px] font-bold uppercase text-[#64748b]">Tarea</p>
              <p className="mt-1 font-extrabold text-[#0f172a]">{selected.title}</p>
              <p className="text-xs text-[#64748b]">{selected.breadcrumb}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <dt className="text-[#94a3b8]">Duración</dt>
                <dd className="font-semibold tabular-nums">{selected.duration}d</dd>
                <dt className="text-[#94a3b8]">ES / EF</dt>
                <dd className="font-semibold tabular-nums">
                  {selected.es} / {selected.ef}
                </dd>
                <dt className="text-[#94a3b8]">LS / LF</dt>
                <dd className="font-semibold tabular-nums">
                  {selected.ls} / {selected.lf}
                </dd>
                <dt className="text-[#94a3b8]">Holgura</dt>
                <dd className="font-semibold tabular-nums">{selected.float}d</dd>
              </dl>
              {selected.isCritical ? (
                <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#15803d]">
                  <GitBranch className="h-3.5 w-3.5" />
                  Camino crítico
                </p>
              ) : null}
              {onNavigateToTask ? (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-bold text-white"
                  onClick={() => {
                    onNavigateToTask(selected.taskId);
                    onClose();
                  }}
                >
                  Ir a esta tarea en el canvas
                </button>
              ) : null}
            </div>
          </Panel>
        ) : null}
      </ReactFlow>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[min(92vw,520px)] -translate-x-1/2 rounded-full border border-[#e2e8f0] bg-white/90 px-4 py-1 text-center text-[10px] font-medium text-[#64748b] shadow-sm">
        Color de borde = fase · <span className="font-bold text-[#16a34a]">Anillo verde</span> = camino crítico
      </div>
    </div>
  );
}

export function ObraCompletaFlowModal({
  open,
  onClose,
  obraNombre,
  nodes,
  edges,
  onNavigateToTask,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#0f172a]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal
      aria-label="Diagrama obra completa"
    >
      <div className="mx-auto flex h-[calc(100dvh-12px)] w-[min(100vw,1920px)] flex-col overflow-hidden rounded-t-2xl border border-[#e2e8f0] bg-white shadow-2xl">
        <ReactFlowProvider>
          <ObraCompletaFlowInner
            obraNombre={obraNombre}
            nodes={nodes}
            edges={edges}
            onClose={onClose}
            onNavigateToTask={onNavigateToTask}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
