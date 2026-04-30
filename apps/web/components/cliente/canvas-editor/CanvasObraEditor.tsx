'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { Connection } from '@xyflow/react';

import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';
import type { CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { countChildren } from '@/lib/canvas/canvasMultinivelStorage';
import {
  cabeceraContextoNivel,
  labelCrearContextual,
  sortSiblingsByPrecedence,
  vistaPrincipalPorContenedor,
} from './canvasMultinivelHelpers';
import { CanvasLeftInspector } from './CanvasLeftInspector';
import { EtapasTimelineView } from './nivel-views/EtapasTimelineView';
import { HubGridNivelView } from './nivel-views/HubGridNivelView';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';
import { TareasCanvasPanel } from './TareasCanvasPanel';
import { useCanvasMultinivel } from './useCanvasMultinivel';

type Props = { obraId: string };

function edgeCriticoVisible(
  sis: CanvasPrecedenceEdge[],
  vis: { type: string; esCritica?: boolean }[],
  cpmCritCount: number | null,
): boolean {
  if (cpmCritCount != null && cpmCritCount > 0) return true;
  return (
    sis.some((e) => e.critical) || vis.some((vn) => vn.type === 'tarea' && vn.esCritica)
  );
}

export function CanvasObraEditor({ obraId }: Props) {
  const router = useRouter();
  const [connectTareas, setConnectTareas] = useState(false);
  const [connectEtapas, setConnectEtapas] = useState(false);
  const [pendingEtapasSource, setPendingEtapasSource] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const {
    obraNombre,
    setObraNombre,
    nodes,
    siblingEdges,
    containerNode,
    containerId,
    visibleNodes,
    childTypeToCreate,
    selectedId,
    setSelectedId,
    selectedNode,
    breadcrumbItems,
    goToBreadcrumbIndex,
    goUpLevel,
    enterNode,
    createChildNode,
    patchNode,
    updatePosition,
    deleteNode,
    duplicateNode,
    createChildOf,
    tryPrecedenceConnection,
    removeEdgeIds,
    patchEdge,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistLabel,
    removeChecklistItem,
  } = useCanvasMultinivel(obraId);

  const vista = vistaPrincipalPorContenedor(containerNode);
  const cabecera = useMemo(
    () => cabeceraContextoNivel(obraNombre, containerNode),
    [obraNombre, containerNode],
  );

  const sortedEtapas = useMemo(
    () => sortSiblingsByPrecedence(visibleNodes, siblingEdges),
    [visibleNodes, siblingEdges],
  );

  useEffect(() => {
    setSelectedEdgeId(null);
    setConnectTareas(false);
    setConnectEtapas(false);
    setPendingEtapasSource(null);
  }, [containerId]);

  useEffect(() => {
    setSelectedEdgeId((eid) => {
      if (eid == null) return null;
      return siblingEdges.some((e) => e.id === eid) ? eid : null;
    });
  }, [siblingEdges]);

  useEffect(() => {
    setSelectedEdgeId(null);
    setConnectTareas(false);
    setConnectEtapas(false);
    setPendingEtapasSource(null);
    setSelectedId(null);
  }, [obraId, setSelectedId]);

  const puedeCrear = childTypeToCreate !== null;
  const labelBotonCrear = labelCrearContextual(childTypeToCreate);
  const selectedEdge =
    selectedEdgeId === null ? null : siblingEdges.find((e) => e.id === selectedEdgeId) ?? null;

  const taskCpmBundle = useMemo(() => {
    if (vista !== 'tareas') return null;
    return computeCanvasTaskCpm(visibleNodes, siblingEdges);
  }, [vista, visibleNodes, siblingEdges]);

  const muestraLegendCritico =
    vista === 'tareas' &&
    edgeCriticoVisible(siblingEdges, visibleNodes, taskCpmBundle?.resultado.critical_count ?? null);

  const childCount = useCallback((id: string) => countChildren(nodes, id), [nodes]);

  useEffect(() => {
    if (selectedNode || selectedEdge) setInspectorOpen(true);
  }, [selectedNode, selectedEdge]);

  const onTimelineSecond = useCallback(
    (sourceId: string, targetId: string) => {
      const ok = tryPrecedenceConnection({
        source: sourceId,
        target: targetId,
        sourceHandle: 'src',
        targetHandle: 'tgt',
      } as Connection);
      setPendingEtapasSource(null);
      return ok;
    },
    [tryPrecedenceConnection],
  );

  const leftContext = (
    <aside className="hidden w-[286px] shrink-0 flex-col gap-4 p-5 xl:flex">
      <div className="rounded-[28px] bg-[#001629] p-5 text-white shadow-[0_12px_32px_rgba(23,28,31,0.10)]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#85f8c4]">
          Obra · canvas
        </p>
        <input
          className="mt-3 w-full border-b border-white/10 bg-transparent text-2xl font-black tracking-[-0.04em] text-white outline-none focus:border-[#85f8c4]"
          value={obraNombre}
          aria-label="Nombre de la obra"
          onChange={(e) => setObraNombre(e.target.value)}
        />
        <p className="mt-4 text-sm leading-6 text-white/66">{cabecera.contextoUbicacion}</p>
      </div>

      <div className="rounded-[26px] bg-white/80 p-4 shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8a94a5]">
          Ubicación
        </p>
        <div className="mt-3 space-y-2">
          {breadcrumbItems.map((item, idx) => (
            <button
              key={item.id ?? 'root'}
              type="button"
              onClick={() => goToBreadcrumbIndex(idx)}
              className={cn(
                'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold transition',
                idx === breadcrumbItems.length - 1
                  ? 'bg-[#d7e4f5] text-[#001629]'
                  : 'text-[#596574] hover:bg-[#f0f4f8]',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#406182]">
                {idx + 1}
              </span>
              <span className="min-w-0 truncate">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      <ContextCard label="Nivel actual" value={cabecera.nivelActualTitulo} />
      <ContextCard label="Vista" value={cabecera.vistaActual} />
      <div className="rounded-[26px] bg-[#f0f4f8]/95 p-4 text-sm leading-6 text-[#545f6e] shadow-[0_12px_32px_rgba(23,28,31,0.04)]">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8a94a5]">
          Acción sugerida
        </p>
        {cabecera.accionSugerida}
      </div>
    </aside>
  );

  const vistaCentral = (
    <>
      {vista === 'etapas' && visibleNodes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#bcc3d9] bg-white/85 px-6 py-14 text-center text-[#596574]">
          <p className="text-base font-bold text-[#0f1e1f]">Sin etapas todavía</p>
          <p className="mx-auto mt-2 max-w-md text-sm">
            Creá la primera con <strong>{labelBotonCrear}</strong>. Luego aparecerán en orden horizontal según precedencias definidas entre fases.
          </p>
        </div>
      )}

      {vista === 'etapas' && visibleNodes.length > 0 && (
        <EtapasTimelineView
          ordered={sortedEtapas}
          selectedId={selectedId}
          connectMode={connectEtapas}
          pendingSourceId={pendingEtapasSource}
          childCount={(id) => countChildren(nodes, id)}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
          onConnectFirst={(id) => {
            setSelectedEdgeId(null);
            setPendingEtapasSource(id);
            setSelectedId(id);
          }}
          onConnectSecond={onTimelineSecond}
        />
      )}

      {vista === 'plantas' && containerNode && (
        <HubGridNivelView
          variant="planta"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
        />
      )}

      {vista === 'sectores' && containerNode && (
        <HubGridNivelView
          variant="sector"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
        />
      )}

      {vista === 'ambientes' && containerNode && (
        <HubGridNivelView
          variant="ambiente"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
        />
      )}

      {vista === 'tareas' && (
        <ReactFlowProvider>
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <TareasCanvasPanel
              taskCpmBundle={taskCpmBundle}
              visibleNodes={visibleNodes}
              nodes={nodes}
              siblingEdges={siblingEdges}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              selectedEdgeId={selectedEdgeId}
              setSelectedEdgeId={setSelectedEdgeId}
              containerId={containerId}
              enterNode={enterNode}
              updatePosition={updatePosition}
              connectMode={connectTareas}
              onToggleConnect={() => setConnectTareas((x) => !x)}
              tryPrecedenceConnection={tryPrecedenceConnection}
              removeEdgeIds={removeEdgeIds}
            />
          </div>
        </ReactFlowProvider>
      )}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] min-w-[1024px] flex-col bg-[#f6fafe] text-[#0f1e1f]">
      <header className="sticky top-0 z-40 bg-white/72 shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="shrink-0"
              onClick={() => router.push(`/cliente/tareas/${obraId}` as Route)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 xl:hidden">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6b728e]">Obra · canvas</p>
              <input
                className="w-full max-w-md truncate border-b border-transparent bg-transparent text-base font-extrabold text-[#01124f] outline-none focus:border-[#0042c8]"
                value={obraNombre}
                aria-label="Nombre de la obra"
                onChange={(e) => setObraNombre(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {vista === 'etapas' && (
              <Button
                type="button"
                variant={connectEtapas ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setConnectEtapas((v) => !v);
                  setPendingEtapasSource(null);
                }}
              >
                {connectEtapas ? 'Listo · orden de fases' : 'Conectar orden de fases'}
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={() => goUpLevel()} disabled={!containerNode}>
              ← Subir nivel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!puedeCrear}
              onClick={() => createChildNode()}
            >
              {labelBotonCrear}
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-[1680px] px-4 pb-4 md:px-5 xl:hidden">
          <div className="rounded-full bg-[#f0f4f8]/90 px-4 py-2.5 shadow-[0_12px_32px_rgba(23,28,31,0.04)] backdrop-blur-md">
            <div className="flex flex-wrap gap-x-1 gap-y-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#7a8492]">
              {breadcrumbItems.map((item, idx) => (
                <span key={item.id ?? 'root'} className="flex min-w-0 items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden />}
                  <button
                    type="button"
                    onClick={() => goToBreadcrumbIndex(idx)}
                    className={cn(
                      'max-w-[260px] truncate rounded-full px-2 py-0.5 transition hover:bg-white',
                      idx === breadcrumbItems.length - 1
                        ? 'font-black text-[#001629]'
                        : 'text-[#7a8492]',
                    )}
                  >
                    {item.title}
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-[#4b556b]">
              <span className="rounded-full bg-white/78 px-3 py-1 shadow-sm">
                <strong className="text-[#001629]">Nivel actual:</strong> {cabecera.nivelActualTitulo}
              </span>
              <span className="rounded-full bg-white/78 px-3 py-1 shadow-sm">
                <strong className="text-[#001629]">Vista:</strong> {cabecera.vistaActual}
              </span>
              <span className="rounded-full bg-white/78 px-3 py-1 shadow-sm">
                <strong className="text-[#001629]">Acción:</strong> {cabecera.accionSugerida}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1680px] flex-1 min-h-0">
        {leftContext}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col p-5">
          {muestraLegendCritico && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#f0cdd2] bg-[#fffbfb] px-3 py-2 text-xs text-[#7a2730]">
              <span className="font-extrabold uppercase tracking-wider text-[#b42b3a]">Camino crítico</span>
              <span>
                Calculado con CPM (duración y precedencias). Resalte rojo cuando holgura es 0 o marcaste override
                manual en tarea/arista.
              </span>
              {connectTareas ? (
                <span className="font-semibold text-[#0042c8]">
                  Modo conectar: arrastrá entre handles de tareas.
                </span>
              ) : null}
            </div>
          )}

          <div className="flex min-h-[min(68vh,760px)] min-w-0 flex-1 flex-col">{vistaCentral}</div>
        </main>

        <CanvasLeftInspector
          obraId={obraId}
          taskCpmBundle={taskCpmBundle}
          selectedEdge={selectedEdge}
          selectedNode={selectedNode}
          nodes={nodes}
          siblingEdges={siblingEdges}
          patchEdge={patchEdge}
          removeEdgeIds={removeEdgeIds}
          setSelectedEdgeId={setSelectedEdgeId}
          patchNode={patchNode}
          enterNode={enterNode}
          createChildOf={createChildOf}
          deleteNode={deleteNode}
          duplicateNode={duplicateNode}
          addChecklistItem={addChecklistItem}
          toggleChecklistItem={toggleChecklistItem}
          updateChecklistLabel={updateChecklistLabel}
          removeChecklistItem={removeChecklistItem}
          isOpen={inspectorOpen}
          onToggleOpen={() => setInspectorOpen((v) => !v)}
        />
      </div>
    </div>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] bg-white/80 p-4 shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8a94a5]">
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-5 text-[#001629]">{value}</p>
    </div>
  );
}
