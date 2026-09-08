'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import { useRouter } from 'next/navigation';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import type { CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  cabeceraContextoNivel,
  descendantTaskPublicationRollup,
  labelCrearContextual,
} from './canvasMultinivelHelpers';
import { CanvasLeftInspector } from './CanvasLeftInspector';
import { CanvasProjectBrowser } from './CanvasProjectBrowser';
import { type EditorTab } from './CanvasEditorProChrome';
import { ObraTopBar } from './workspace/ObraTopBar';
import { ScopeBreadcrumb } from './workspace/ScopeBreadcrumb';
import { ToolRail } from './workspace/ToolRail';
import { InstrumentPanel, PanelNota } from './workspace/InstrumentPanel';
import { AtajosPanel } from './workspace/AtajosPanel';
import { computeCanvasTaskCpm } from './canvasMultinivelCpm';
import { ScopeCanvasPanel } from './ScopeCanvasPanel';
import { ProjectXmlImportPreviewModal } from './ProjectXmlImportPreviewModal';
import { PublicarTareasCanvasModal } from './PublicarTareasCanvasModal';
import { CanvasPresupuestosTab } from './CanvasPresupuestosTab';
import { CanvasArchivoTab } from './CanvasArchivoTab';
import { CanvasPublicarTab } from './CanvasPublicarTab';
import { CanvasCronogramaTab } from './CanvasCronogramaTab';
import { CanvasCronogramaInspector } from './CanvasCronogramaInspector';
import { buildCronogramaItems } from './buildCronogramaItems';
import { useCanvasMultinivel } from './useCanvasMultinivel';
import type { ProjectImportPreview } from '@/lib/project/importProjectXml';
import { parseProjectXml } from '@/lib/project/importProjectXml';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { buildCanvasImportBundle } from '@/lib/project/projectImportToCanvas';
import { publicationReviewCategory } from './canvasMultinivelHelpers';
import { CanvasTemplateLibraryPanel } from './CanvasTemplateLibraryPanel';
import { CanvasPlanWizardModal } from './CanvasPlanWizardModal';
import { GrowsCommandBar } from './workspace/GrowsCommandBar';
import { ObraCompletaFlowModal } from './ObraCompletaFlowModal';

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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [projectImportOpen, setProjectImportOpen] = useState(false);
  const [projectImportPreview, setProjectImportPreview] = useState<ProjectImportPreview | null>(null);
  const [projectImportError, setProjectImportError] = useState<string | null>(null);
  const [projectImportBusy, setProjectImportBusy] = useState(false);
  const projectXmlInputRef = useRef<HTMLInputElement | null>(null);
  const [publicarModalOpen, setPublicarModalOpen] = useState(false);
  const [obraCompletaOpen, setObraCompletaOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('canvas');
  const [canvasZoomPct, setCanvasZoomPct] = useState<number | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const [atajosOpen, setAtajosOpen] = useState(false);
  const [filtrosBloqueadas, setFiltrosBloqueadas] = useState(false);
  const [filtrosCriticas, setFiltrosCriticas] = useState(false);
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
    containerNode,
    containerId,
    visibleNodes,
    visibleEdges,
    relationCountsByNodeId,
    childTypeToCreate,
    selectedIds,
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
    applyTemplateBySlug,
    obraProductKind,
    budgetGroups,
    createBudgetGroup,
    patchBudgetGroup,
    applyBudgetGroupToNode,
    tareaPublicacionByNodeId,
    refreshTareaPublicacion,
    reloadCanvasFromCloud,
  } = useCanvasMultinivel(obraId);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [planWizardOpen, setPlanWizardOpen] = useState(false);
  const [applyingTemplateSlug, setApplyingTemplateSlug] = useState<string | null>(null);

  const handleApplyTemplate = useCallback(
    async (slug: string) => {
      if (nodes.length > 0) {
        const ok = window.confirm(
          '¿Reemplazar el canvas actual por este template? Es el mismo proceso que importar un XML.',
        );
        if (!ok) return;
      }
      setApplyingTemplateSlug(slug);
      try {
        const result = await applyTemplateBySlug(slug);
        if (result.ok) {
          setLibraryOpen(false);
          setPlanWizardOpen(false);
          if (result.snapshot) {
            const saved = await saveCanvasSnapshotToCloud(result.snapshot);
            if (!saved.ok) {
              window.alert(
                saved.message ??
                  'El plan se cargó en pantalla pero no se pudo guardar en la nube. Usá Guardar.',
              );
            }
          } else {
            await saveCanvasSnapshotToCloud();
          }
        } else if (result.message) {
          window.alert(result.message);
        }
      } finally {
        setApplyingTemplateSlug(null);
      }
    },
    [applyTemplateBySlug, saveCanvasSnapshotToCloud, nodes.length],
  );

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
      const bundle = buildCanvasImportBundle(projectImportPreview);
      const snapshot = composeCanvasPersisted({
        obraNombre: bundle.obraNombre,
        nodes: bundle.nodes,
        pathIds: [],
        edges: bundle.edges,
        budgetGroups: [],
        projectKind: bundle.projectKind,
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
    saveCanvasSnapshotToCloud,
  ]);

  const cabecera = useMemo(
    () => cabeceraContextoNivel(obraNombre, containerNode, projectKind, nodes),
    [obraNombre, containerNode, projectKind, nodes],
  );

  /**
   * Un solo Canvas para todos los niveles: lo que se dibuja es siempre el scope
   * actual (hijos directos del cuadro abierto) y sus relaciones directas.
   */
  const scopeTitle = containerNode?.title ?? null;
  const enRaiz = containerId === null;

  useEffect(() => {
    setSelectedEdgeId(null);
    setConnectTareas(false);
  }, [containerId]);

  useEffect(() => {
    setSelectedEdgeId((eid) => {
      if (eid == null) return null;
      return visibleEdges.some((e) => e.id === eid) ? eid : null;
    });
  }, [visibleEdges]);

  useEffect(() => {
    setSelectedEdgeId(null);
    setConnectTareas(false);
    setSelectedId(null);
  }, [obraId, setSelectedId]);

  const puedeCrear = childTypeToCreate !== null;
  const labelBotonCrear = labelCrearContextual(childTypeToCreate, projectKind);
  const selectedEdge =
    selectedEdgeId === null ? null : visibleEdges.find((e) => e.id === selectedEdgeId) ?? null;

  /**
   * CPM del scope visible. Sólo alimenta tareas: los contenedores no tienen duración
   * propia y meterlos daría holgura 0 a todo, pintando de crítico cualquier arista.
   */
  const taskCpmBundle = useMemo(
    () => computeCanvasTaskCpm(visibleNodes.filter((n) => n.type === 'tarea'), visibleEdges),
    [visibleNodes, visibleEdges],
  );

  const muestraLegendCritico = edgeCriticoVisible(
    visibleEdges,
    visibleNodes,
    taskCpmBundle?.resultado.critical_count ?? null,
  );

  const filteredVisibleNodes = useMemo(() => {
    let result = visibleNodes;
    if (filtrosBloqueadas) result = result.filter((n) => (n as { bloqueo?: boolean }).bloqueo);
    if (filtrosCriticas) result = result.filter((n) => n.esCritica || (taskCpmBundle?.byId.get(n.id)?.isCritical ?? false));
    return result;
  }, [visibleNodes, filtrosBloqueadas, filtrosCriticas, taskCpmBundle]);

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
  const showCanvasInspector = editorTab === 'canvas';
  const showCronogramaInspector = editorTab === 'cronograma';

  const cronogramaProjectStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [obraId]);

  const cronogramaItems = useMemo(
    () => buildCronogramaItems(nodes, edges, tareaPublicacionByNodeId),
    [nodes, edges, tareaPublicacionByNodeId],
  );

  const selectedCronogramaItem = useMemo(
    () => (selectedId ? cronogramaItems.find((i) => i.id === selectedId) ?? null : null),
    [cronogramaItems, selectedId],
  );

  const userLabel = useMemo(() => {
    const r = (currentUser?.role as string) || '';
    const name = currentUser?.email?.split('@')[0] || 'Usuario';
    return r ? `${name} | ${r}` : name;
  }, [currentUser?.email, currentUser?.role]);

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

  /**
   * VISTA CENTRAL — un único scope a la vez.
   *
   * No hay árbol vertical expandido, ni hub circular, ni grilla por tipo de nivel:
   * el mismo Canvas XYFlow sirve para obra, piso, especialidad, viga o tarea, y
   * dibuja SOLO los hijos directos del cuadro abierto. Doble click entra.
   */
  const vistaCentral = (
    <>
      {enRaiz && visibleNodes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#bcc3d9] bg-white/85 px-6 py-10 text-center text-[#596574]">
          <p className="text-base font-bold text-[#0f1e1f]">Todavía no hay plan en el canvas</p>
          <p className="mx-auto mt-2 max-w-md text-sm">
            Filtrá la librería XML con unas preguntas o elegí un plan directo. Al seleccionarlo se importa al canvas
            automáticamente.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setPlanWizardOpen(true)}
              className="rounded-xl bg-[#002b49] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#02446f]"
            >
              Armar plan (filtrar librería XML)
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="rounded-xl border border-[#94a3b8] bg-white px-5 py-3 text-sm font-semibold text-[#001629] hover:bg-[#f8fafc]"
            >
              Ver librería de templates
            </button>
          </div>
          <p className="mx-auto mt-4 max-w-md text-xs text-[#94a3b8]">
            También podés crear una etapa manual con <strong>{labelBotonCrear}</strong>.
          </p>
        </div>
      )}

      {!(enRaiz && visibleNodes.length === 0) && (
        <ReactFlowProvider>
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <ScopeCanvasPanel
              projectKind={projectKind}
              taskCpmBundle={taskCpmBundle}
              visibleNodes={filteredVisibleNodes}
              nodes={nodes}
              visibleEdges={visibleEdges}
              relationCountsByNodeId={relationCountsByNodeId}
              scopeTitle={scopeTitle}
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

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-col bg-[#FBFBF9] text-[#0f172a]">
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
      {/* Del ribbon anterior: Templates→paso 4 rail, Crear→paso 4 botón contextual,
          Guardar→chip de esta barra, Duplicar/Eliminar→menú contextual del paso 4,
          Vincular tareas→toolbar del lienzo (ya existe), Obra completa→paso 4 rail,
          Importar XML→paso 4 rail/Archivo, Subir nivel→breadcrumb del paso 2,
          Publicar tareas→paso 4 rail. Placeholders deshabilitados: ver lista blanca del paso 4. */}
      <ObraTopBar
        obraNombre={obraNombre}
        onObraNombreChange={setObraNombre}
        projectKind={projectKind ?? null}
        cloudSaveState={cloudSaveState}
        cloudSaveMessage={cloudSaveMessage}
        canvasHydrated={canvasHydrated}
        guardadoRelativo={guardadoRelativo}
        userLabel={userLabel}
        onSaveCloud={() => {
          void saveCanvasSnapshotToCloud();
        }}
        onHelp={() => setAtajosOpen((v) => !v)}
      />
      <CanvasTemplateLibraryPanel
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        obraProductKind={obraProductKind}
        onApply={(slug) => void handleApplyTemplate(slug)}
        applyingSlug={applyingTemplateSlug}
      />
      <CanvasPlanWizardModal
        open={planWizardOpen}
        onClose={() => setPlanWizardOpen(false)}
        defaultObraProductKind={obraProductKind}
        applyingSlug={applyingTemplateSlug}
        onApplySlug={(slug) => void handleApplyTemplate(slug)}
      />

      <div className="relative flex w-full min-h-0 flex-1">
        <ToolRail
          activePanel={panel}
          onToggle={(id) => {
            if (id === 'pert') {
              setObraCompletaOpen(true);
              return;
            }
            setPanel((prev) => (prev === id ? null : id));
          }}
        />

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

        {/* PANELES DEL RAIL */}
        {panel === 'estructura' ? (
          <InstrumentPanel id="estructura" title="Estructura" onClose={() => setPanel(null)}>
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
              embedded
            />
          </InstrumentPanel>
        ) : panel === 'buscar' ? (
          <InstrumentPanel id="buscar" title="Buscar" onClose={() => setPanel(null)}>
            <PanelNota text="Nodos, tareas y documentos de la obra. Búsqueda global con filtro por tipo." />
          </InstrumentPanel>
        ) : panel === 'archivo' ? (
          <InstrumentPanel id="archivo" title="Archivo" onClose={() => setPanel(null)}>
            <PanelNota text="Importar / exportar XML de proyecto. También Guardar una versión manual." />
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={openProjectXmlPicker}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E4E3DE', background: '#FFFFFF', fontSize: 11, cursor: 'pointer', color: '#3D3E43' }}
              >
                Importar XML…
              </button>
            </div>
          </InstrumentPanel>
        ) : panel === 'filtros' ? (
          <InstrumentPanel id="filtros" title="Filtros" onClose={() => setPanel(null)}>
            {([
              { id: 'bloqueadas', label: 'Solo bloqueadas', state: filtrosBloqueadas, set: setFiltrosBloqueadas },
              { id: 'criticas', label: 'Solo críticas', state: filtrosCriticas, set: setFiltrosCriticas },
              { id: 'sin_presupuesto', label: 'Sin presupuesto', disabled: true },
              { id: 'sin_publicar', label: 'Sin publicar', disabled: true },
            ] as const).map((f) => (
              <label
                key={f.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #E9E8E3', cursor: 'disabled' in f && f.disabled ? 'default' : 'pointer', opacity: 'disabled' in f && f.disabled ? 0.5 : 1 }}
                title={'disabled' in f && f.disabled ? 'Próximamente' : undefined}
              >
                <input
                  type="checkbox"
                  checked={'state' in f ? f.state : false}
                  onChange={'set' in f ? () => f.set((v) => !v) : undefined}
                  disabled={'disabled' in f && f.disabled}
                  style={{ accentColor: '#0C1D36' }}
                />
                <span style={{ fontSize: 11, color: '#3D3E43' }}>{f.label}</span>
              </label>
            ))}
          </InstrumentPanel>
        ) : panel === 'contexto' ? (
          <InstrumentPanel id="contexto" title="Contexto y archivos" onClose={() => setPanel(null)}>
            <PanelNota text="Todavía no hay archivos en esta obra." />
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                disabled
                title="Próximo paso: modelo de objetos de contexto"
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #E4E3DE', background: '#FFFFFF', fontSize: 11, cursor: 'not-allowed', color: '#A9A8A2' }}
              >
                + Agregar
              </button>
            </div>
          </InstrumentPanel>
        ) : panel === 'ifc' ? (
          <InstrumentPanel id="ifc" title="Modelo IFC" onClose={() => setPanel(null)}>
            <PanelNota text="Visor y selección de elementos IFC. La capa IFC del lienzo vincula cada elemento con su cuadro." />
          </InstrumentPanel>
        ) : panel === 'tareas' ? (
          <InstrumentPanel id="tareas" title="Tareas operativas" onClose={() => setPanel(null)}>
            <PanelNota text="Tareas publicadas a la app Socio, con su estado de ejecución y validación." />
          </InstrumentPanel>
        ) : panel === 'socios' ? (
          <InstrumentPanel id="socios" title="Socios" onClose={() => setPanel(null)}>
            <PanelNota text="Agenda de socios y su carga por scope. Desde acá se invita a un paquete de presupuesto." />
          </InstrumentPanel>
        ) : panel === 'critico' ? (
          <InstrumentPanel id="critico" title="Camino crítico" onClose={() => setPanel(null)}>
            {taskCpmBundle ? (
              <div>
                <p style={{ fontSize: 10, color: '#8B8C90', marginBottom: 8 }}>
                  {taskCpmBundle.resultado.critical_count} tarea{taskCpmBundle.resultado.critical_count !== 1 ? 's' : ''} en camino crítico (holgura 0)
                </p>
                {taskCpmBundle.resultado.tareas.filter((t) => t.isCritical).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openPathToNode(t.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', marginBottom: 2, borderRadius: 5, border: 'none', background: '#FBF1F0', fontSize: 10, color: '#A32A2A', cursor: 'pointer' }}
                  >
                    {t.id}
                  </button>
                ))}
              </div>
            ) : (
              <PanelNota text="CPM sobre duración y precedencias del scope. Se enciende como capa del lienzo, con holgura por tarea." />
            )}
          </InstrumentPanel>
        ) : panel === 'historial' ? (
          <InstrumentPanel id="historial" title="Historial" onClose={() => setPanel(null)}>
            <PanelNota text="Versiones guardadas de la obra y cambios aplicados por Grows, con quién y cuándo." />
          </InstrumentPanel>
        ) : panel === 'cronograma' ? (
          <InstrumentPanel id="cronograma" title="Cronograma" onClose={() => setPanel(null)} wide>
            <CanvasCronogramaTab
              obraNombre={obraNombre}
              nodes={nodes}
              edges={edges}
              tareaPublicacionByNodeId={tareaPublicacionByNodeId}
              selectedId={selectedId}
              projectStart={cronogramaProjectStart}
              onSelectTask={(id) => {
                setSelectedId(id);
                openPathToNode(id);
                setInspectorOpen(true);
              }}
            />
          </InstrumentPanel>
        ) : panel === 'presupuestos' ? (
          <InstrumentPanel id="presupuestos" title="Presupuestos" onClose={() => setPanel(null)} wide>
            <CanvasPresupuestosTab
              obraId={obraId}
              obraNombre={obraNombre}
              budgetGroups={budgetGroups}
              nodes={nodes}
              tareaPublicacionByNodeId={tareaPublicacionByNodeId}
              patchBudgetGroup={patchBudgetGroup}
              createBudgetGroup={createBudgetGroup}
              saveCanvasSnapshotToCloud={saveCanvasSnapshotToCloud}
              onOpenCanvasTab={() => setPanel(null)}
            />
          </InstrumentPanel>
        ) : null}

        {atajosOpen && <AtajosPanel onClose={() => setAtajosOpen(false)} />}

        {editorTab === 'canvas' && panel !== 'cronograma' && panel !== 'presupuestos' ? (
          <GrowsCommandBar
            obraId={obraId}
            breadcrumbItems={breadcrumbItems}
            selectedIds={selectedIds}
            onClearSelection={() => setSelectedId(null)}
            onCanvasMaybeChanged={() => void reloadCanvasFromCloud()}
          />
        ) : null}

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col pl-12">
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

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {editorTab === 'canvas' ? (
              <>
                {vistaCentral}
                {showBreadcrumb && (
                  <ScopeBreadcrumb
                    items={breadcrumbItems}
                    onGo={goToBreadcrumbIndex}
                    onUp={goUpLevel}
                    upDisabled={!containerNode}
                    nodeCount={visibleNodes.length}
                    taskCount={taskCount}
                    publishedCount={publishedTaskCount}
                    criticalCount={taskCpmBundle?.resultado.critical_count ?? null}
                    nivelLabel={cabecera.nivelActualTitulo}
                    vistaLabel={cabecera.vistaActual}
                  />
                )}
                {cloudSaveMessage ? (
                  <div
                    className="absolute right-5 top-14 z-40 max-w-[360px] rounded-[6px] border border-[#E4E3DE] bg-white p-3 shadow-[0_8px_24px_rgba(21,22,26,0.10),0_1px_2px_rgba(21,22,26,0.05)] text-[11px]"
                    role="status"
                  >
                    <p
                      className={cn(
                        'whitespace-pre-line font-medium',
                        cloudSaveState === 'err' ? 'text-red-600' : 'text-emerald-700',
                      )}
                    >
                      {cloudSaveMessage}
                    </p>
                  </div>
                ) : null}
                {puedeCrear && (
                  <button
                    type="button"
                    onClick={() => createChildNode()}
                    style={{
                      position: 'absolute',
                      bottom: 20,
                      right: 20,
                      zIndex: 30,
                      height: 32,
                      padding: '0 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#0C1D36',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(21,22,26,0.20)',
                    }}
                    title={`Crear ${labelBotonCrear}`}
                  >
                    + {labelBotonCrear}
                  </button>
                )}
              </>
            ) : (
              <div className="overflow-auto p-4">
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
                    projectStart={cronogramaProjectStart}
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
                ) : null}
              </div>
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

        <ObraCompletaFlowModal
          open={obraCompletaOpen}
          onClose={() => setObraCompletaOpen(false)}
          obraNombre={obraNombre}
          nodes={nodes}
          edges={edges}
          onNavigateToTask={(taskId) => {
            setEditorTab('canvas');
            openPathToNode(taskId);
            setSelectedId(taskId);
            setInspectorOpen(true);
          }}
        />

        {showCanvasInspector ? (
          <CanvasLeftInspector
            obraId={obraId}
            projectKind={projectKind}
            taskCpmBundle={taskCpmBundle}
            selectedEdge={selectedEdge}
            selectedNode={selectedNode}
            nodes={nodes}
            edges={edges}
            siblingEdges={visibleEdges}
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

        {showCronogramaInspector ? (
          <CanvasCronogramaInspector
            obraId={obraId}
            selectedNode={selectedNode?.type === 'tarea' ? selectedNode : null}
            selectedItem={selectedCronogramaItem}
            projectStart={cronogramaProjectStart}
            tareaPublicacionByNodeId={tareaPublicacionByNodeId}
            isOpen={inspectorOpen}
            onToggleOpen={() => setInspectorOpen((v) => !v)}
          />
        ) : null}
      </div>
    </div>
  );
}
