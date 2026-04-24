'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { BloqueEditorMock, TareaEditorMock, FlowEdgeMock } from '@/lib/mocks/canvasObraEditorMock';
import { TareaFlowNode } from './TareaFlowNode';
import { newId } from '@/lib/mocks/canvasObraEditorMock';

const nodeTypes = { tarea: TareaFlowNode };

function tareasToNodes(tareas: TareaEditorMock[]) {
  return tareas.map(
    (t) =>
      ({
        id: t.id,
        type: 'tarea',
        position: t.pos,
        data: t,
      }) as Node<TareaEditorMock>
  );
}

function edgesToRf(edges: FlowEdgeMock[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style: { stroke: '#737688', strokeWidth: 2 },
  }));
}

function buildBloqueFromGraph(bloque: BloqueEditorMock, nds: Node[], eds: Edge[]): BloqueEditorMock {
  return {
    ...bloque,
    tareas: nds.map((n) => ({
      ...(n.data as TareaEditorMock),
      pos: n.position,
    })),
    edges: eds.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  };
}

type Props = {
  bloque: BloqueEditorMock;
  onBloqueChange: (next: BloqueEditorMock) => void;
  flowKey: string;
  onSelectTarea?: (id: string | null) => void;
};

export function TareaFlowEditor({ bloque, onBloqueChange, flowKey, onSelectTarea }: Props) {
  const [nodes, setNodes] = useNodesState<Node<TareaEditorMock>>(tareasToNodes(bloque.tareas));
  const [edges, setEdges] = useEdgesState(edgesToRf(bloque.edges));
  const nodesRef = useRef<Node<TareaEditorMock>[]>([]);
  const edgesRef = useRef<Edge[]>(edges);

  useEffect(() => {
    setNodes(tareasToNodes(bloque.tareas));
    setEdges(edgesToRf(bloque.edges));
  }, [bloque, flowKey, setNodes, setEdges]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<TareaEditorMock>>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const shouldPersist = changes.some((c) => c.type === 'remove');
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        if (shouldPersist) {
          queueMicrotask(() => {
            onBloqueChange(buildBloqueFromGraph(bloque, nodesRef.current, next));
          });
        }
        return next;
      });
    },
    [setEdges, bloque, onBloqueChange]
  );

  const onNodeDragStop = useCallback(() => {
    onBloqueChange(buildBloqueFromGraph(bloque, nodesRef.current, edgesRef.current));
  }, [bloque, onBloqueChange]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...params,
            id: newId('edge'),
            style: { stroke: '#737688', strokeWidth: 2 },
            type: 'smoothstep',
          },
          eds
        );
        queueMicrotask(() => {
          onBloqueChange(buildBloqueFromGraph(bloque, nodesRef.current, next));
        });
        return next;
      });
    },
    [setEdges, bloque, onBloqueChange]
  );

  return (
    <div className="h-[min(70vh,640px)] w-full rounded-2xl border border-[#c3c5d9] overflow-hidden bg-[#f3f4f5]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={(_, n) => onSelectTarea?.(n.id)}
        onPaneClick={() => onSelectTarea?.(null)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.35}
        maxZoom={1.4}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
        className="!bg-[#f3f4f5]"
      >
        <Background gap={24} size={1} color="#c5c6cc" />
        <Controls
          className="!bg-white !border-[#c3c5d9] !shadow-md [&_button]:!border-[#c3c5d9]"
          showInteractive={false}
        />
        <MiniMap pannable zoomable className="!bg-white/95 !border-[#c3c5d9]" />
      </ReactFlow>
    </div>
  );
}
