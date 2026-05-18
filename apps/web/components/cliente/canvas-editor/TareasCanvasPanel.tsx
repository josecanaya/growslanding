'use client';

import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  useNodesState,
  useReactFlow,
  Panel,
  MarkerType,
  BackgroundVariant,
  useStore,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Crosshair,
  Focus,
  Minus,
  MousePointer2,
  Network,
  Share2,
  Unplug,
  ZoomIn,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  CanvasBudgetGroup,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { countChildren } from '@/lib/canvas/canvasMultinivelStorage';
import { canEnterNode, publicationReviewCategory } from './canvasMultinivelHelpers';
import {
  aristaCriticaVisual,
  type CanvasTaskCpmBundle,
} from './canvasMultinivelCpm';
import { multinivelFlowNodeTypes, type MultinivelNodeData } from './MultinivelFlowNode';

function precedenciasIo(nodeId: string, siblingEdges: CanvasPrecedenceEdge[]) {
  let inC = 0;
  let outC = 0;
  for (const e of siblingEdges) {
    if (e.targetId === nodeId) inC += 1;
    if (e.sourceId === nodeId) outC += 1;
  }
  return { inC, outC };
}

function buildNodeData(
  n: CanvasNode,
  nodes: CanvasNode[],
  siblingEdges: CanvasPrecedenceEdge[],
  selected: boolean,
  handlesEnabled: boolean,
  taskCpmBundle: CanvasTaskCpmBundle | null,
  projectKind: CanvasProjectKind,
  tareaPublicacionByNodeId:
    | Record<string, { tareaId: string; publishedAt?: string | null; estado?: string }>
    | undefined,
  budgetGroups: CanvasBudgetGroup[],
  publicationReviewMode: boolean,
): MultinivelNodeData {
  const childCount = countChildren(nodes, n.id);
  const { inC, outC } = precedenciasIo(n.id, siblingEdges);
  const cpmSnap =
    n.type === 'tarea' ? taskCpmBundle?.byId.get(n.id) ?? null : null;
  const pub = n.type === 'tarea' ? tareaPublicacionByNodeId?.[n.id] : undefined;
  const taskPublication =
    n.type === 'tarea' ? (pub?.publishedAt ? 'publicada' : 'sin_publicar') : null;
  const budgetGroupLabel =
    n.type === 'tarea' && n.budgetGroupId
      ? budgetGroups.find((g) => g.id === n.budgetGroupId)?.name ?? null
      : null;
  return {
    node: n,
    childCount,
    selected,
    handlesEnabled,
    precedentInCount: inC,
    precedentOutCount: outC,
    cpmSnap,
    projectKind,
    taskPublication,
    budgetGroupLabel,
    publicationReview: publicationReviewMode,
    publicationReviewCategory: publicationReviewMode
      ? publicationReviewCategory(n, tareaPublicacionByNodeId ?? {})
      : null,
  };
}

function CanvasFloatingToolbar({
  connectMode,
  onToggleConnect,
}: {
  connectMode: boolean;
  onToggleConnect: () => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel
      position="bottom-right"
      className="!z-[20] !m-5 flex gap-1.5 rounded-2xl border border-[#c8ccd9] bg-white/95 p-1.5 shadow-[0_8px_32px_-8px_rgba(15,30,31,0.18)] backdrop-blur-sm"
    >
      <ToolbarIconButton title="Acercar" onClick={() => zoomIn({ duration: 200 })}>
        <ZoomIn className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton title="Alejar" onClick={() => zoomOut({ duration: 200 })}>
        <Minus className="h-4 w-4" />
      </ToolbarIconButton>
      <ToolbarIconButton
        title="Ajustar vista"
        onClick={() => fitView({ padding: 0.28, duration: 240 })}
      >
        <Focus className="h-4 w-4" />
      </ToolbarIconButton>
      <div className="mx-1 w-px self-stretch bg-[#dde1eb]" aria-hidden />
      <ToolbarIconButton title="Seleccionar y mover nodos">
        <MousePointer2 className="h-4 w-4 text-[#0042c8]" />
      </ToolbarIconButton>
      <ToolbarIconButton
        title={connectMode ? 'Salir del modo conectar' : 'Conectar precedencias'}
        onClick={onToggleConnect}
        pressed={connectMode}
      >
        {connectMode ? (
          <Unplug className="h-4 w-4 text-[#0042c8]" />
        ) : (
          <Crosshair className="h-4 w-4" />
        )}
      </ToolbarIconButton>
    </Panel>
  );
}

function ToolbarIconButton({
  children,
  onClick,
  title,
  pressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  title: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-[#f0f7ff]',
        pressed
          ? 'border-[#0042c8] bg-[#e8f2ff]'
          : 'border-transparent text-[#41465c] hover:border-[#c8ccd9]',
      )}
    >
      {children}
    </button>
  );
}

function ZoomReporter({ onZoom }: { onZoom: (pct: number) => void }) {
  const zoom = useStore((s) => s.transform[2]);
  useEffect(() => {
    onZoom(Math.round(zoom * 100));
  }, [zoom, onZoom]);
  return null;
}

type Props = {
  projectKind: CanvasProjectKind;
  /** CPM sobre tareas del ambiente actual (misma función que OrganizaSection). null si ciclo/vacío. */
  taskCpmBundle: CanvasTaskCpmBundle | null;
  visibleNodes: CanvasNode[];
  nodes: CanvasNode[];
  siblingEdges: CanvasPrecedenceEdge[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
  containerId: string | null;
  enterNode: (id: string) => void;
  updatePosition: (id: string, pos: { x: number; y: number }) => void;
  connectMode: boolean;
  onToggleConnect: () => void;
  tryPrecedenceConnection: (c: Connection) => boolean;
  removeEdgeIds: (ids: string[]) => void;
  tareaPublicacionByNodeId?: Record<
    string,
    { tareaId: string; publishedAt?: string | null; estado?: string }
  >;
  budgetGroups: CanvasBudgetGroup[];
  /** Cinta Publicación: colores de revisión + selección por arrastre. */
  publicationReviewMode?: boolean;
  onOpenPublishModal?: () => void;
  onZoomPercentChange?: (pct: number) => void;
};

export function TareasCanvasPanel({
  projectKind,
  taskCpmBundle,
  visibleNodes,
  nodes,
  siblingEdges,
  selectedId,
  setSelectedId,
  selectedEdgeId,
  setSelectedEdgeId,
  containerId,
  enterNode,
  updatePosition,
  connectMode,
  onToggleConnect,
  tryPrecedenceConnection,
  removeEdgeIds,
  tareaPublicacionByNodeId,
  budgetGroups,
  publicationReviewMode = false,
  onOpenPublishModal,
  onZoomPercentChange,
}: Props) {
  const { fitView } = useReactFlow();
  const reportZoom = onZoomPercentChange ?? (() => {});

  const rfEdges: Edge[] = useMemo(
    () =>
      siblingEdges.map((e) => {
        const critical = aristaCriticaVisual(e, taskCpmBundle);
        return {
          id: e.id,
          source: e.sourceId,
          target: e.targetId,
          type: 'smoothstep',
          selected: selectedEdgeId === e.id,
          animated: critical,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: critical ? '#bc2436' : '#5d6c88',
            width: 17,
            height: 17,
          },
          style: {
            stroke: critical ? '#bc2436' : '#6f7e98',
            strokeWidth: critical ? 2.75 : 1.9,
            strokeDasharray: critical ? undefined : '7 8',
            strokeLinecap: 'round' as const,
          },
        };
      }),
    [siblingEdges, selectedEdgeId, taskCpmBundle],
  );

  const initialRf = useMemo(
    () =>
      visibleNodes.map(
        (n) =>
          ({
            id: n.id,
            type: 'multinivel',
            position: n.position,
            connectable: connectMode,
            data: buildNodeData(
              n,
              nodes,
              siblingEdges,
              selectedId === n.id,
              connectMode,
              taskCpmBundle,
              projectKind,
              tareaPublicacionByNodeId,
              budgetGroups,
              publicationReviewMode,
            ),
          }) as Node<MultinivelNodeData>,
      ),
    [
      visibleNodes,
      nodes,
      siblingEdges,
      selectedId,
      connectMode,
      taskCpmBundle,
      projectKind,
      tareaPublicacionByNodeId,
      budgetGroups,
      publicationReviewMode,
    ],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(initialRf);

  useEffect(() => {
    setRfNodes(
      visibleNodes.map(
        (n) =>
          ({
            id: n.id,
            type: 'multinivel',
            position: n.position,
            connectable: connectMode,
            data: buildNodeData(
              n,
              nodes,
              siblingEdges,
              selectedId === n.id,
              connectMode,
              taskCpmBundle,
              projectKind,
              tareaPublicacionByNodeId,
              budgetGroups,
              publicationReviewMode,
            ),
          }) as Node<MultinivelNodeData>,
      ),
    );
  }, [
    containerId,
    visibleNodes,
    nodes,
    siblingEdges,
    selectedId,
    setRfNodes,
    connectMode,
    taskCpmBundle,
    projectKind,
    tareaPublicacionByNodeId,
    budgetGroups,
    publicationReviewMode,
  ]);

  useEffect(() => {
    if (visibleNodes.length === 0) return;
    const t = requestAnimationFrame(() => fitView({ padding: 0.28, duration: 220 }));
    return () => cancelAnimationFrame(t);
  }, [containerId, fitView, visibleNodes.length]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removedIds = changes.filter((ch) => ch.type === 'remove').map((ch) => ch.id);
      if (removedIds.length > 0) removeEdgeIds(removedIds);
    },
    [removeEdgeIds],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      tryPrecedenceConnection(c);
    },
    [tryPrecedenceConnection],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node<MultinivelNodeData>) => {
      updatePosition(node.id, node.position);
    },
    [updatePosition],
  );

  return (
    <div
      className="relative isolate h-[min(68vh,760px)] min-h-[420px] w-full overflow-hidden rounded-2xl border border-[#cdd1de] bg-[#eef0f7] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
    >
      {visibleNodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-dashed border-[#a8abb8] bg-white/96 px-6 py-8 text-center shadow-lg">
            <Network className="mx-auto mb-4 h-10 w-10 text-[#596574]" />
            <p className="text-base font-bold text-[#0f1e1f]">Sin tareas en este ambiente</p>
            <p className="mt-2 text-sm text-[#596574]">
              Creá tareas con el botón superior. Acá se conectan precedencias, checklist y camino crítico.
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => {
          setSelectedEdgeId(null);
          setSelectedId(node.id);
        }}
        onNodeDoubleClick={(_, node) => {
          if (canEnterNode(node.data.node)) enterNode(node.id);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedId(null);
          setSelectedEdgeId(edge.id);
        }}
        onPaneClick={() => {
          setSelectedId(null);
          setSelectedEdgeId(null);
        }}
        onConnect={connectMode ? onConnect : undefined}
        nodeTypes={multinivelFlowNodeTypes}
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.18}
        maxZoom={1.85}
        panOnDrag
        selectionOnDrag={publicationReviewMode}
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
        elevateEdgesOnSelect
        className="h-full w-full !bg-[linear-gradient(transparent,rgba(255,255,255,0.25))]"
        connectionLineStyle={{ stroke: '#0042c8', strokeWidth: 2 }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <ZoomReporter onZoom={reportZoom} />
        {publicationReviewMode ? (
          <Panel
            position="top-center"
            className="!z-[25] !m-3 flex max-w-[min(96vw,520px)] flex-col items-stretch gap-2 rounded-xl border border-[#c8ccd9] bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur-sm"
          >
            <p className="text-[10px] font-medium leading-snug text-[#475569]">
              Revisión: <span className="text-emerald-700">publicada</span> ·{' '}
              <span className="text-slate-500">sin publicar</span> ·{' '}
              <span className="text-amber-700">incompleta / operativa sin fecha</span> ·{' '}
              <span className="text-red-700">bloqueada</span>. Podés enmarcar varias tareas arrastrando en vacío
              (Shift+clic también).
            </p>
            <button
              type="button"
              onClick={() => onOpenPublishModal?.()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#115e59]"
            >
              <Share2 className="h-3.5 w-3.5" />
              Publicar tareas…
            </button>
            <p className="text-[9px] text-slate-500">
              Mismo flujo que la cinta: abre el modal de publicación actual (todas las pendientes del proceso
              existente).
            </p>
          </Panel>
        ) : null}
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="top-left"
          className="!m-3 !overflow-hidden !rounded-xl !border !border-[#c8ccd9] !bg-white/95 !shadow-md"
        />
        <Background
          id="tareas-grid"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.15}
          color="#c4c9d8"
          className="!bg-[#e8eaf3]"
        />
        <CanvasFloatingToolbar connectMode={connectMode} onToggleConnect={onToggleConnect} />
      </ReactFlow>
    </div>
  );
}
