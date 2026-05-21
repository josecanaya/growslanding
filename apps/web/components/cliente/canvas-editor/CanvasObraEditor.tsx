'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { Connection } from '@xyflow/react';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import type { CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { countChildren } from '@/lib/canvas/canvasMultinivelStorage';
import {
  cabeceraContextoNivel,
  descendantTaskPublicationRollup,
  labelCrearContextual,
  sortSiblingsByPrecedence,
  vistaPrincipalPorContenedor,
} from './canvasMultinivelHelpers';
import { CanvasLeftInspector } from './CanvasLeftInspector';
import { CanvasProjectBrowser } from './CanvasProjectBrowser';
import { CanvasEditorProChrome, CanvasEditorStatusBar, type EditorTab } from './CanvasEditorProChrome';
import { EtapasTimelineView } from './nivel-views/EtapasTimelineView';
import { HubGridNivelView } from './nivel-views/HubGridNivelView';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';
import { TareasCanvasPanel } from './TareasCanvasPanel';
import { ProjectXmlImportPreviewModal } from './ProjectXmlImportPreviewModal';
import { PublicarTareasCanvasModal } from './PublicarTareasCanvasModal';
import { CanvasPresupuestosTab } from './CanvasPresupuestosTab';
import { CanvasArchivoTab } from './CanvasArchivoTab';
import { CanvasPublicarTab } from './CanvasPublicarTab';
import { CanvasCronogramaTab } from './CanvasCronogramaTab';
import { useCanvasMultinivel } from './useCanvasMultinivel';
import type { ProjectImportPreview } from '@/lib/project/importProjectXml';
import { parseProjectXml } from '@/lib/project/importProjectXml';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { buildCanvasImportBundle } from '@/lib/project/projectImportToCanvas';
import { publicationReviewCategory } from './canvasMultinivelHelpers';

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
  const currentUser = useCurrentUser();
  const [connectTareas, setConnectTareas] = useState(false);
  const [connectEtapas, setConnectEtapas] = useState(false);
  const [pendingEtapasSource, setPendingEtapasSource] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [projectImportOpen, setProjectImportOpen] = useState(false);
  const [projectImportPreview, setProjectImportPreview] = useState<ProjectImportPreview | null>(null);
  const [projectImportError, setProjectImportError] = useState<string | null>(null);
  const [projectImportBusy, setProjectImportBusy] = useState(false);
  const projectXmlInputRef = useRef<HTMLInputElement | null>(null);
  const [publicarModalOpen, setPublicarModalOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('canvas');
  const [canvasZoomPct, setCanvasZoomPct] = useState<number | null>(null);
  const lastCloudSaveOkAtRef = useRef<number | null>(null);

  const {
    obraNombre,
    setObraNombre,
    projectKind,
    canvasHydrated,
    saveCanvasSnapshotToCloud,
    cloudSaveState,
    cloudSaveMessage,
    nodes,
    edges,
    pathIds,
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
    openPathToNode,
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
    applyImportedCanvas,
    budgetGroups,
    createBudgetGroup,
    patchBudgetGroup,
    applyBudgetGroupToNode,
    tareaPublicacionByNodeId,
    refreshTareaPublicacion,
  } = useCanvasMultinivel(obraId);

  const prevCloudSaveRef = useRef<typeof cloudSaveState>(cloudSaveState);
  useEffect(() => {
    if (prevCloudSaveRef.current === 'saving' && cloudSaveState === 'ok') {
      lastCloudSaveOkAtRef.current = Date.now();
    }
    prevCloudSaveRef.current = cloudSaveState;
  }, [cloudSaveState]);

  const [guardadoRelativoTick, setGuardadoRelativoTick] = useState(0);
  useEffect(() => {
    if (cloudSaveState !== 'ok' || lastCloudSaveOkAtRef.current == null) return;
    const id = window.setInterval(() => setGuardadoRelativoTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [cloudSaveState]);

  const guardadoRelativo = useMemo(() => {
    if (cloudSaveState !== 'ok' || lastCloudSaveOkAtRef.current == null) return null;
    const sec = Math.max(0, Math.floor((Date.now() - lastCloudSaveOkAtRef.current) / 1000));
    if (sec < 60) return `Guardado hace ${sec} s`;
    const min = Math.floor(sec / 60);
    return `Guardado hace ${min} min`;
  }, [cloudSaveState, guardadoRelativoTick]);

  const getDescendantRollup = useCallback(
    (nodeId: string) =>
      descendantTaskPublicationRollup(nodes, nodeId, tareaPublicacionByNodeId),
    [nodes, tareaPublicacionByNodeId],
  );

  const onConfirmProjectImport = useCallback(async () => {
    if (!projectImportPreview) return;
    if (nodes.length > 0) {
      const ok = window.confirm(
        '¿Reemplazar por completo el canvas actual de esta obra? Se perderá la estructura, tareas y precedencias guardadas localmente en este navegador.',
      );
      if (!ok) return;
    }
    setProjectImportBusy(true);
    try {
      const bundle = buildCanvasImportBundle(projectImportPreview, projectKind);
      const snapshot = composeCanvasPersisted({
        obraNombre: bundle.obraNombre,
        nodes: bundle.nodes,
        pathIds: [],
        edges: bundle.edges,
        budgetGroups: [],
        projectKind,
      });
      applyImportedCanvas(bundle);
      setProjectImportOpen(false);
      const saved = await saveCanvasSnapshotToCloud(snapshot);
      if (!saved.ok) {
        window.alert(
          saved.message ??
            'El canvas se importó en pantalla pero no se pudo guardar en la nube. Usá «Guardar en la nube».',
        );
      }
    } catch (e) {
      console.error(e);
      window.alert(
        e instanceof Error
          ? `No se pudo importar: ${e.message}`
          : 'No se pudo importar el proyecto al canvas.',
      );
    } finally {
      setProjectImportBusy(false);
    }
  }, [
    projectImportPreview,
    nodes.length,
    applyImportedCanvas,
    projectKind,
    saveCanvasSnapshotToCloud,
  ]);

  const vista = vistaPrincipalPorContenedor(containerNode, projectKind);
  const cabecera = useMemo(
    () => cabeceraContextoNivel(obraNombre, containerNode, projectKind),
    [obraNombre, containerNode, projectKind],
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
  const labelBotonCrear = labelCrearContextual(childTypeToCreate, projectKind);
  const selectedEdge =
    selectedEdgeId === null ? null : siblingEdges.find((e) => e.id === selectedEdgeId) ?? null;

  const taskCpmBundle = useMemo(() => {
    if (vista !== 'tareas') return null;
    return computeCanvasTaskCpm(visibleNodes, siblingEdges);
  }, [vista, visibleNodes, siblingEdges]);

  const muestraLegendCritico =
    vista === 'tareas' &&
    edgeCriticoVisible(siblingEdges, visibleNodes, taskCpmBundle?.resultado.critical_count ?? null);

  const tieneNodosTarea = useMemo(() => nodes.some((n) => n.type === 'tarea'), [nodes]);

  const taskCount = useMemo(() => nodes.filter((n) => n.type === 'tarea').length, [nodes]);
  const publishedTaskCount = useMemo(
    () =>
      nodes.filter((n) => n.type === 'tarea' && tareaPublicacionByNodeId[n.id]?.publishedAt).length,
    [nodes, tareaPublicacionByNodeId],
  );
  const publicationStats = useMemo(() => {
    const tasks = nodes.filter((n) => n.type === 'tarea');
    let published = 0;
    let incomplete = 0;
    let blocked = 0;
    let draft = 0;
    for (const t of tasks) {
      const cat = publicationReviewCategory(t, tareaPublicacionByNodeId);
      if (cat === 'published') published += 1;
      else if (cat === 'incomplete') incomplete += 1;
      else if (cat === 'blocked') blocked += 1;
      else draft += 1;
    }
    return {
      total: tasks.length,
      published,
      unpublished: Math.max(0, tasks.length - published),
      incomplete,
      blocked,
      draft,
    };
  }, [nodes, tareaPublicacionByNodeId]);

  const showProjectBrowser = editorTab === 'canvas' || editorTab === 'presupuestos';
  const showBreadcrumb = editorTab === 'canvas';
  const showInspector = editorTab === 'canvas' || editorTab === 'cronograma';

  const userLabel = useMemo(() => {
    const r = (currentUser?.role as string) || '';
    const name = currentUser?.email?.split('@')[0] || 'Usuario';
    return r ? `${name} | ${r}` : name;
  }, [currentUser?.email, currentUser?.role]);

  const childCount = useCallback((id: string) => countChildren(nodes, id), [nodes]);

  const openProjectXmlPicker = useCallback(() => {
    setProjectImportError(null);
    setProjectImportPreview(null);
    projectXmlInputRef.current?.click();
  }, []);

  const onProjectXmlSelected = useCallback(async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setProjectImportError(null);
    try {
      const text = await file.text();
      const preview = parseProjectXml(text);
      setProjectImportPreview(preview);
      setProjectImportOpen(true);
    } catch (e) {
      setProjectImportPreview(null);
      setProjectImportError(e instanceof Error ? e.message : 'No se pudo interpretar el XML.');
      setProjectImportOpen(true);
    }
  }, []);

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

  const handleCanvasZoomPercent = useCallback((pct: number) => {
    setCanvasZoomPct(pct);
  }, []);

  const modoStatusBar =
    editorTab === 'archivo'
      ? 'Archivo'
      : editorTab === 'publicar'
        ? 'Publicar'
        : editorTab === 'cronograma'
          ? 'Cronograma'
          : editorTab === 'presupuestos'
            ? 'Presupuestos'
            : 'Organizar';

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
          projectKind={projectKind}
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
          getDescendantRollup={getDescendantRollup}
        />
      )}

      {vista === 'plantas' && containerNode && (
        <HubGridNivelView
          projectKind={projectKind}
          variant="planta"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          getDescendantRollup={getDescendantRollup}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
        />
      )}

      {vista === 'sectores' && containerNode && (
        <HubGridNivelView
          projectKind={projectKind}
          variant="sector"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          getDescendantRollup={getDescendantRollup}
          onSelect={(id) => {
            setSelectedEdgeId(null);
            setSelectedId(id);
          }}
          onEnter={enterNode}
        />
      )}

      {vista === 'ambientes' && containerNode && (
        <HubGridNivelView
          projectKind={projectKind}
          variant="ambiente"
          hubNode={containerNode}
          items={visibleNodes}
          selectedId={selectedId}
          childCount={childCount}
          getDescendantRollup={getDescendantRollup}
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
              projectKind={projectKind}
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
              tareaPublicacionByNodeId={tareaPublicacionByNodeId}
              budgetGroups={budgetGroups}
              publicationReviewMode={false}
              onOpenPublishModal={() => setPublicarModalOpen(true)}
              onZoomPercentChange={handleCanvasZoomPercent}
            />
          </div>
        </ReactFlowProvider>
      )}
    </>
  );

  const renderBreadcrumb = (compact = false) => (
    <div
      className={cn(
        'rounded-2xl border border-[#e5e7eb] bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] font-semibold text-[#64748b]">
        {breadcrumbItems.map((item, idx) => (
          <span key={item.id ?? 'root'} className="flex min-w-0 items-center gap-1">
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#cbd5e1]" aria-hidden />}
            <button
              type="button"
              onClick={() => goToBreadcrumbIndex(idx)}
              className={cn(
                'max-w-[260px] truncate rounded-lg px-1.5 py-0.5 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]',
                idx === breadcrumbItems.length - 1 ? 'font-bold text-[#0f172a]' : 'text-[#64748b]',
              )}
              title={item.title}
            >
              {item.title}
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
        <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 font-semibold text-[#1d4ed8]">
          Nivel actual: {cabecera.nivelActualTitulo}
        </span>
        <span className="rounded-full bg-[#f8fafc] px-2 py-0.5 font-semibold text-[#475569]">
          Vista: {cabecera.vistaActual}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-col bg-[#f6f8fa] text-[#0f172a]">
      <input
        ref={projectXmlInputRef}
        type="file"
        accept=".xml,application/xml,text/xml"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          void onProjectXmlSelected(e.target.files);
          e.target.value = '';
        }}
      />
      <CanvasEditorProChrome
        obraNombre={obraNombre}
        onObraNombreChange={setObraNombre}
        cloudSaveState={cloudSaveState}
        cloudSaveMessage={cloudSaveMessage}
        editorTab={editorTab}
        onEditorTab={setEditorTab}
        vistaLabel={cabecera.vistaActual}
        nivelActualLabel={cabecera.nivelActualTitulo}
        canvasHydrated={canvasHydrated}
        tieneNodosTarea={tieneNodosTarea}
        puedeCrear={puedeCrear}
        labelBotonCrear={labelBotonCrear}
        childTypeToCreate={childTypeToCreate}
        connectEtapas={connectEtapas}
        vistaEtapas={vista === 'etapas'}
        proyectoBusy={projectImportBusy}
        userLabel={userLabel}
        taskCount={taskCount}
        publishedTaskCount={publishedTaskCount}
        criticalCount={taskCpmBundle?.resultado.critical_count ?? null}
        vistaTareas={vista === 'tareas'}
        onBack={() => router.push('/cliente/obras')}
        onSaveCloud={() => {
          void saveCanvasSnapshotToCloud();
        }}
        onPublicar={() => setPublicarModalOpen(true)}
        onImportXml={openProjectXmlPicker}
        onCreateChild={() => createChildNode()}
        onGoUp={() => goUpLevel()}
        upDisabled={!containerNode}
        onToggleConnectEtapas={() => {
          setConnectEtapas((v) => !v);
          setPendingEtapasSource(null);
        }}
        onToggleConnectTareas={() => setConnectTareas((x) => !x)}
        connectTareasActive={connectTareas}
        onDuplicate={() => {
          if (selectedId) duplicateNode(selectedId);
        }}
        onDelete={() => {
          if (selectedId) deleteNode(selectedId);
        }}
        duplicateDisabled={!selectedId}
        deleteDisabled={!selectedId}
        onGoOrganizar={() => setEditorTab('canvas')}
      />

      {cloudSaveMessage ? (
        <div className="border-b border-[#cbd5e1] bg-[#f8fafc] px-3 py-1">
          <p
            className={cn(
              'whitespace-pre-line text-xs font-medium',
              cloudSaveState === 'err' ? 'text-red-600' : 'text-emerald-700',
            )}
            role="status"
          >
            {cloudSaveMessage}
          </p>
        </div>
      ) : null}

      {showBreadcrumb ? (
        <div className="border-b border-[#e5e7eb] bg-[#f6f8fa] px-3 py-2 xl:hidden">
          {renderBreadcrumb(true)}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 min-h-0 gap-3 px-3 pb-3">
        {showProjectBrowser ? (
          <CanvasProjectBrowser
            obraNombre={obraNombre}
            nodes={nodes}
            projectKind={projectKind}
            pathIds={pathIds}
            containerId={containerId}
            selectedId={selectedId}
            tareaPublicacionByNodeId={tareaPublicacionByNodeId}
            onGoRoot={() => goToBreadcrumbIndex(0)}
            onNavigateToNode={openPathToNode}
          />
        ) : null}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col py-3">
          {showBreadcrumb ? <div className="mb-3 hidden xl:block">{renderBreadcrumb()}</div> : null}

          <div className="mb-2 flex flex-wrap gap-2 xl:hidden">
            {(
              [
                { id: 'archivo' as const, label: 'Archivo' },
                { id: 'canvas' as const, label: 'Organizar' },
                { id: 'presupuestos' as const, label: 'Presupuestos' },
                { id: 'publicar' as const, label: 'Publicar' },
                { id: 'cronograma' as const, label: 'Cronograma' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setEditorTab(tab.id)}
                className={cn(
                  'rounded border px-2 py-1 text-[11px] font-bold',
                  editorTab === tab.id
                    ? 'border-[#2563eb] bg-white text-[#1e40af]'
                    : 'border-[#cbd5e1] bg-white/70',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {editorTab === 'canvas' && muestraLegendCritico && (
            <div className="mb-2 flex flex-wrap items-center gap-2 rounded border border-[#e2a3a9] bg-[#fff8f8] px-2 py-1.5 text-[11px] text-[#7a2730]">
              <span className="font-extrabold uppercase tracking-wider text-[#b42b3a]">Camino crítico</span>
              <span>
                CPM sobre duración y precedencias. Resalte rojo con holgura 0 o override manual.
              </span>
              {connectTareas ? (
                <span className="font-semibold text-[#1d4ed8]">Modo conectar activo.</span>
              ) : null}
            </div>
          )}

          <div className="flex min-h-[min(64vh,720px)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            {editorTab === 'archivo' ? (
              <CanvasArchivoTab
                obraNombre={obraNombre}
                cloudSaveState={cloudSaveState}
                cloudSaveMessage={cloudSaveMessage}
                canvasHydrated={canvasHydrated}
                onImportXml={openProjectXmlPicker}
                onSaveCloud={() => {
                  void saveCanvasSnapshotToCloud();
                }}
                importBusy={projectImportBusy}
              />
            ) : editorTab === 'publicar' ? (
              <CanvasPublicarTab
                obraNombre={obraNombre}
                stats={publicationStats}
                canvasHydrated={canvasHydrated}
                tieneNodosTarea={tieneNodosTarea}
                onOpenPublishModal={() => setPublicarModalOpen(true)}
                onGoOrganizar={() => setEditorTab('canvas')}
              />
            ) : editorTab === 'cronograma' ? (
              <CanvasCronogramaTab
                obraNombre={obraNombre}
                nodes={nodes}
                edges={edges}
                tareaPublicacionByNodeId={tareaPublicacionByNodeId}
                selectedId={selectedId}
                onSelectTask={(id) => {
                  setSelectedId(id);
                  setInspectorOpen(true);
                }}
              />
            ) : editorTab === 'presupuestos' ? (
              <CanvasPresupuestosTab
                obraId={obraId}
                obraNombre={obraNombre}
                budgetGroups={budgetGroups}
                nodes={nodes}
                tareaPublicacionByNodeId={tareaPublicacionByNodeId}
                patchBudgetGroup={patchBudgetGroup}
                createBudgetGroup={createBudgetGroup}
                saveCanvasSnapshotToCloud={saveCanvasSnapshotToCloud}
                onOpenCanvasTab={() => setEditorTab('canvas')}
              />
            ) : (
              vistaCentral
            )}
          </div>
        </main>

        <ProjectXmlImportPreviewModal
          open={projectImportOpen}
          preview={projectImportPreview}
          parseError={projectImportError}
          canvasHasNodes={nodes.length > 0}
          projectKind={projectKind}
          onClose={() => setProjectImportOpen(false)}
          onConfirmImport={onConfirmProjectImport}
          importing={projectImportBusy}
        />

        <PublicarTareasCanvasModal
          open={publicarModalOpen}
          obraId={obraId}
          onClose={() => setPublicarModalOpen(false)}
          onAfterPublish={() => void refreshTareaPublicacion()}
        />

        {showInspector ? (
          <CanvasLeftInspector
            obraId={obraId}
            projectKind={projectKind}
            taskCpmBundle={taskCpmBundle}
            selectedEdge={selectedEdge}
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            siblingEdges={siblingEdges}
            containerId={containerId}
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
            tryPrecedenceConnection={tryPrecedenceConnection}
            budgetGroups={budgetGroups}
            createBudgetGroup={createBudgetGroup}
            applyBudgetGroupToNode={applyBudgetGroupToNode}
            tareaPublicacionByNodeId={tareaPublicacionByNodeId}
            onOpenPublishModal={() => setPublicarModalOpen(true)}
            isOpen={inspectorOpen}
            onToggleOpen={() => setInspectorOpen((v) => !v)}
          />
        ) : null}
      </div>
      <CanvasEditorStatusBar
        nivelLabel={cabecera.nivelActualTitulo}
        modo={modoStatusBar}
        modoDetalle={cabecera.vistaActual}
        taskCount={taskCount}
        publishedCount={publishedTaskCount}
        unpublishedCount={Math.max(0, taskCount - publishedTaskCount)}
        criticalCount={taskCpmBundle?.resultado.critical_count ?? null}
        zoomLabel={canvasZoomPct != null ? `Zoom ${canvasZoomPct}%` : undefined}
        guardadoRelativo={guardadoRelativo}
      />
    </div>
  );
}
