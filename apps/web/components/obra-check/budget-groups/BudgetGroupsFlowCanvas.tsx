'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, inputStyle } from '../ui';
import { budgetFlowNodeTypes } from './budgetFlowNodes';
import { nextSubgroupId, phaseGroups } from './buildDefaultHierarchy';

const PHASE_GAP = 40;
const PHASE_INNER_W = 220;
const SUB_HEADER = 52;
const PKG_HEIGHT = 82;
const PKG_GAP = 8;
const SUB_PAD = 12;

type FlowProps = {
  groups: ObraCheckBudgetGroup[];
  blocks: ObraCheckBlock[];
  tasks: ObraCheckTask[];
  onChange: (groups: ObraCheckBudgetGroup[]) => void;
};

function isPhaseGroupId(id: string, groups: ObraCheckBudgetGroup[]) {
  return phaseGroups(groups).some((p) => p.id === id);
}

function layoutNodes(
  groups: ObraCheckBudgetGroup[],
  blocks: ObraCheckBlock[],
  tasks: ObraCheckTask[],
): { nodes: Node[]; edges: Edge[] } {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const phases = phaseGroups(groups).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const subgroups = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let phaseX = 0;

  for (const phase of phases) {
    const subs = subgroups
      .filter((s) => s.parentId === phase.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    let innerY = 48;
    let maxInnerH = 48;
    const phaseNodesStart = nodes.length;

    for (const sub of subs) {
      const pkgs = sub.blockIds.map((id) => blockById.get(id)).filter(Boolean) as ObraCheckBlock[];
      const subInnerH = SUB_HEADER + Math.max(pkgs.length, 1) * (PKG_HEIGHT + PKG_GAP) + SUB_PAD;
      maxInnerH = Math.max(maxInnerH, innerY + subInnerH + SUB_PAD);

      const taskCount = pkgs.reduce((n, p) => n + p.taskIds.length, 0);

      nodes.push({
        id: sub.id,
        type: 'group',
        parentId: phase.id,
        extent: 'parent',
        position: { x: SUB_PAD, y: innerY },
        data: { label: sub.nombre, packageCount: pkgs.length, taskCount },
        draggable: false,
        selectable: true,
        style: {
          width: PHASE_INNER_W - SUB_PAD * 2,
          height: subInnerH,
          background: '#FFFDF5',
          border: `1.5px solid ${BRAND.border}`,
          borderRadius: 10,
          zIndex: 2,
        },
      });

      nodes.push({
        id: `label-${sub.id}`,
        type: 'subgrupo',
        parentId: sub.id,
        extent: 'parent',
        position: { x: 8, y: 6 },
        data: { label: sub.nombre, packageCount: pkgs.length, taskCount },
        draggable: false,
        selectable: true,
        style: { zIndex: 3 },
      });

      pkgs.forEach((pkg, pi) => {
        const preview = pkg.taskIds
          .map((tid) => taskById.get(tid)?.nombre)
          .filter(Boolean) as string[];
        const pkgNodeId = `pkg-${pkg.id}`;
        nodes.push({
          id: pkgNodeId,
          type: 'paquete',
          parentId: sub.id,
          extent: 'parent',
          position: { x: 8, y: SUB_HEADER + pi * (PKG_HEIGHT + PKG_GAP) },
          data: {
            label: pkg.nombre,
            fase: pkg.fase,
            taskCount: pkg.taskIds.length,
            taskPreview: preview,
            blockId: pkg.id,
            subgroupId: sub.id,
            phaseId: phase.id,
          },
          draggable: true,
          selectable: true,
          style: { width: PHASE_INNER_W - SUB_PAD * 2 - 16, zIndex: 4 },
        });
        edges.push({
          id: `e-${sub.id}-${pkgNodeId}`,
          source: sub.id,
          target: pkgNodeId,
          style: { stroke: BRAND.border, strokeWidth: 1 },
        });
      });

      innerY += subInnerH + SUB_GAP;
    }

    const pkgInPhase = subs.reduce((n, s) => n + s.blockIds.length, 0);

    nodes.splice(phaseNodesStart, 0, {
      id: phase.id,
      type: 'group',
      position: { x: phaseX, y: 0 },
      data: { label: phase.nombre, subgroupCount: subs.length, packageCount: pkgInPhase },
      draggable: true,
      selectable: true,
      style: {
        width: PHASE_INNER_W,
        height: maxInnerH,
        background: 'rgba(245,246,247,0.85)',
        border: `2px solid ${BRAND.blue}`,
        borderRadius: 14,
        zIndex: 0,
      },
    });

    nodes.push({
      id: `label-${phase.id}`,
      type: 'fase',
      parentId: phase.id,
      extent: 'parent',
      position: { x: SUB_PAD, y: 8 },
      data: { label: phase.nombre, subgroupCount: subs.length, packageCount: pkgInPhase },
      draggable: false,
      selectable: false,
      style: { zIndex: 1, pointerEvents: 'none' },
    });

    phaseX += PHASE_INNER_W + PHASE_GAP;
  }

  return { nodes, edges };
}

function syncFromGroups(groups: ObraCheckBudgetGroup[]): ObraCheckBudgetGroup[] {
  return groups.map((g) => {
    if (g.kind === 'fase' || (!g.parentId && g.kind !== 'subgrupo')) {
      return { ...g, blockIds: [] };
    }
    return g;
  });
}

function FlowInner({ groups, blocks, tasks, onChange }: FlowProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodes(groups, blocks, tasks),
    [groups, blocks, tasks],
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [renameSub, setRenameSub] = useState('');
  const groupsRef = useRef(groups);
  const { getIntersectingNodes, fitView } = useReactFlow();

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    const laid = layoutNodes(groups, blocks, tasks);
    setNodes(laid.nodes);
    setEdges(laid.edges);
    const t = window.setTimeout(() => void fitView({ padding: 0.12, duration: 220 }), 80);
    return () => window.clearTimeout(t);
  }, [groups, blocks, tasks, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const syncPhaseOrder = useCallback(
    (nds: Node[]) => {
      const phaseNodes = nds
        .filter((n) => n.type === 'group' && isPhaseGroupId(n.id, groupsRef.current))
        .sort((a, b) => a.position.x - b.position.x);
      const orderMap = new Map(phaseNodes.map((n, i) => [n.id, i]));
      onChange(
        groupsRef.current.map((g) =>
          g.kind === 'fase' || (!g.parentId && g.kind !== 'subgrupo')
            ? { ...g, orden: orderMap.get(g.id) ?? g.orden ?? 0 }
            : g,
        ),
      );
    },
    [onChange],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (node.type === 'group' && isPhaseGroupId(node.id, groupsRef.current)) {
        syncPhaseOrder(nodes);
        return;
      }
      if (node.type !== 'paquete') return;

      const blockId = (node.data as { blockId: string }).blockId;
      const currentSubId = (node.data as { subgroupId: string }).subgroupId;
      const phaseId = (node.data as { phaseId: string }).phaseId;

      const hits = getIntersectingNodes(node).filter(
        (n) => n.type === 'group' && n.parentId === phaseId && n.id !== phaseId,
      );
      const targetSub = hits[0];
      if (!targetSub || targetSub.id === currentSubId) return;

      const next = groupsRef.current.map((g) => {
        if (g.id === currentSubId) {
          return { ...g, blockIds: g.blockIds.filter((id) => id !== blockId) };
        }
        if (g.id === targetSub.id) {
          return { ...g, blockIds: [...new Set([...g.blockIds, blockId])] };
        }
        return g;
      });
      onChange(syncFromGroups(next));
    },
    [getIntersectingNodes, nodes, onChange, syncPhaseOrder],
  );

  const onSelectionChange = useCallback(
    ({ nodes: sel }: { nodes: Node[] }) => {
      const phase = sel.find((n) => n.type === 'group' && isPhaseGroupId(n.id, groupsRef.current));
      const sub = sel.find((n) => n.type === 'subgrupo' || (n.type === 'group' && n.parentId && !n.id.startsWith('fase-')));
      const subGroup = sub?.type === 'subgrupo' ? groupsRef.current.find((g) => `label-${g.id}` === sub.id) : groupsRef.current.find((g) => g.id === sub?.id);
      setSelectedPhaseId(phase?.id ?? null);
      setSelectedSubId(subGroup?.id ?? (sub?.type === 'group' ? sub.id : null));
      if (subGroup) setRenameSub(subGroup.nombre);
    },
    [],
  );

  function addSubgroup() {
    const phaseId = selectedPhaseId ?? phaseGroups(groups)[0]?.id;
    if (!phaseId) return;
    const id = nextSubgroupId(phaseId);
    const subsInPhase = groups.filter((g) => g.parentId === phaseId);
    onChange([
      ...groups,
      {
        id,
        nombre: `Subgrupo ${subsInPhase.length + 1}`,
        blockIds: [],
        parentId: phaseId,
        kind: 'subgrupo',
        orden: subsInPhase.length,
      },
    ]);
  }

  function renameSubgroup() {
    if (!selectedSubId || !renameSub.trim()) return;
    onChange(groups.map((g) => (g.id === selectedSubId ? { ...g, nombre: renameSub.trim() } : g)));
  }

  const unassigned = blocks.filter((b) => {
    const subs = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);
    return !subs.some((s) => s.blockIds.includes(b.id));
  });

  return (
    <div>
      <div
        style={{
          height: 540,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={budgetFlowNodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          nodesConnectable={false}
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.5}
          fitView
        >
          <Background color={BRAND.border} gap={18} />
          <Controls showInteractive={false} />
          <Panel position="top-right" className="!m-2 flex flex-col gap-2">
            <OCButton variant="secondary" onClick={addSubgroup} className="text-xs">
              <Plus size={14} /> Subgrupo en fase
            </OCButton>
            {selectedSubId && (
              <div className="rounded-lg bg-white p-2 shadow-md" style={{ border: `1px solid ${BRAND.border}` }}>
                <p className="mb-1 text-[10px] font-semibold" style={{ color: BRAND.muted }}>
                  Renombrar subgrupo
                </p>
                <input
                  style={{ ...inputStyle, fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                  value={renameSub}
                  onChange={(e) => setRenameSub(e.target.value)}
                  onBlur={renameSubgroup}
                  onKeyDown={(e) => e.key === 'Enter' && renameSubgroup()}
                />
              </div>
            )}
          </Panel>
          <Panel
            position="top-left"
            className="!m-2 max-w-[240px] rounded-lg bg-white/95 p-2.5 text-[10px] leading-relaxed shadow-sm"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}
          >
            <b style={{ color: BRAND.blue }}>Las fases son la base.</b> Creá subgrupos comerciales y arrastrá
            paquetes entre ellos. Reordená fases arrastrando las columnas.
          </Panel>
        </ReactFlow>
      </div>
      {unassigned.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: BRAND.error }}>
          {unassigned.length} paquete(s) sin subgrupo — arrastralos a un subgrupo de su fase.
        </p>
      )}
    </div>
  );
}

export function BudgetGroupsFlowCanvas(props: FlowProps) {
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
