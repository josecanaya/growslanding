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
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import { CANONICAL_PHASES, PHASE_COLORS, normalizePhase } from '@/lib/obra-check/phases';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, inputStyle } from '../ui';
import { obraCheckFlowNodeTypes } from '../obraCheckFlowNodes';
import { nextSubgroupId, phaseColumnX, phaseFromColumnX, phaseGroups } from './buildDefaultHierarchy';

const COL_W = 260;
const COL_GAP = 36;
const PHASE_HDR = 48;
const SUB_HDR = 36;
const PKG_H = 68;
const PKG_GAP = 8;
const SUB_PAD = 10;

type FlowProps = {
  groups: ObraCheckBudgetGroup[];
  blocks: ObraCheckBlock[];
  tasks: ObraCheckTask[];
  onChange: (groups: ObraCheckBudgetGroup[]) => void;
};

type SubRect = { id: string; phaseId: string; x: number; y: number; w: number; h: number };

function layoutBudgetNodes(
  groups: ObraCheckBudgetGroup[],
  blocks: ObraCheckBlock[],
  tasks: ObraCheckTask[],
): { nodes: Node[]; subRects: SubRect[] } {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const phases = phaseGroups(groups).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const subgroups = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);
  const nodes: Node[] = [];
  const subRects: SubRect[] = [];

  CANONICAL_PHASES.forEach((canonical) => {
    const phase = phases.find((p) => normalizePhase(p.nombre) === canonical);
    if (!phase) return;

    const colX = phaseColumnX(canonical, COL_W, COL_GAP);
    const subs = subgroups
      .filter((s) => s.parentId === phase.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    let y = PHASE_HDR;
    let maxH = PHASE_HDR + 40;

    subs.forEach((sub) => {
      const pkgs = sub.blockIds.map((id) => blockById.get(id)).filter(Boolean) as ObraCheckBlock[];
      const subH = SUB_HDR + Math.max(pkgs.length, 1) * (PKG_H + PKG_GAP) + SUB_PAD * 2;
      maxH = Math.max(maxH, y + subH + 16);

      subRects.push({
        id: sub.id,
        phaseId: phase.id,
        x: colX + SUB_PAD,
        y,
        w: COL_W - SUB_PAD * 2,
        h: subH,
      });

      nodes.push({
        id: `sub-lane-${sub.id}`,
        type: 'subgrupoLane',
        position: { x: colX + SUB_PAD, y },
        data: { label: sub.nombre, packageCount: pkgs.length, subgroupId: sub.id },
        draggable: false,
        selectable: true,
        style: { width: COL_W - SUB_PAD * 2, height: subH, zIndex: 2 },
      });

      pkgs.forEach((pkg, pi) => {
        const preview = pkg.taskIds
          .map((tid) => taskById.get(tid)?.nombre)
          .filter(Boolean) as string[];
        nodes.push({
          id: `pkg-${pkg.id}`,
          type: 'paquete',
          position: { x: colX + SUB_PAD + 8, y: y + SUB_HDR + pi * (PKG_H + PKG_GAP) },
          data: {
            label: pkg.nombre,
            taskCount: pkg.taskIds.length,
            taskPreview: preview,
            blockId: pkg.id,
            subgroupId: sub.id,
            phaseId: phase.id,
            phaseName: canonical,
          },
          draggable: true,
          selectable: true,
          style: { width: COL_W - SUB_PAD * 2 - 16, zIndex: 5 },
        });
      });

      y += subH + 12;
    });

    const colors = PHASE_COLORS[canonical];
    const pkgCount = subs.reduce((n, s) => n + s.blockIds.length, 0);

    nodes.unshift({
      id: `phase-lane-${phase.id}`,
      type: 'phaseLane',
      position: { x: colX, y: 0 },
      data: { label: canonical, count: pkgCount },
      draggable: false,
      selectable: true,
      style: {
        width: COL_W,
        height: maxH,
        zIndex: 1,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 14,
      },
    });
  });

  return { nodes, subRects };
}

function findSubAtPosition(rects: SubRect[], x: number, y: number): SubRect | null {
  for (const r of rects) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
  }
  return null;
}

function FlowInner({ groups, blocks, tasks, onChange }: FlowProps) {
  const { nodes: initialNodes, subRects: initialRects } = useMemo(
    () => layoutBudgetNodes(groups, blocks, tasks),
    [groups, blocks, tasks],
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const subRectsRef = useRef<SubRect[]>(initialRects);
  const groupsRef = useRef(groups);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [renameSub, setRenameSub] = useState('');
  const { fitView } = useReactFlow();

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    const laid = layoutBudgetNodes(groups, blocks, tasks);
    setNodes(laid.nodes);
    subRectsRef.current = laid.subRects;
    const t = window.setTimeout(() => void fitView({ padding: 0.1, duration: 200 }), 60);
    return () => window.clearTimeout(t);
  }, [groups, blocks, tasks, fitView]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== 'paquete') return;

      const blockId = (node.data as { blockId: string }).blockId;
      const currentSubId = (node.data as { subgroupId: string }).subgroupId;
      const phaseName = (node.data as { phaseName: string }).phaseName;
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      const targetPhase = phaseFromColumnX(node.position.x, COL_W, COL_GAP);
      if (normalizePhase(block.fase) !== targetPhase) {
        return;
      }

      const centerY = node.position.y + PKG_H / 2;
      const hit = findSubAtPosition(subRectsRef.current, node.position.x + 20, centerY);
      if (!hit || hit.id === currentSubId) return;

      const next = groupsRef.current.map((g) => {
        if (g.id === currentSubId) {
          return { ...g, blockIds: g.blockIds.filter((id) => id !== blockId) };
        }
        if (g.id === hit.id) {
          return { ...g, blockIds: [...new Set([...g.blockIds, blockId])] };
        }
        return g;
      });
      onChange(next);
    },
    [blocks, onChange],
  );

  const onSelectionChange = useCallback(({ nodes: sel }: { nodes: Node[] }) => {
    const subLane = sel.find((n) => n.type === 'subgrupoLane');
    const phaseLane = sel.find((n) => n.type === 'phaseLane');
    if (subLane) {
      const sid = (subLane.data as { subgroupId: string }).subgroupId;
      setSelectedSubId(sid);
      setRenameSub((subLane.data as { label: string }).label);
      const sub = groupsRef.current.find((g) => g.id === sid);
      setSelectedPhaseId(sub?.parentId ?? null);
    } else if (phaseLane) {
      const pid = phaseLane.id.replace('phase-lane-', '');
      setSelectedPhaseId(pid);
      setSelectedSubId(null);
    }
  }, []);

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
          height: 560,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={obraCheckFlowNodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          nodesConnectable={false}
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={1.4}
          fitView
        >
          <Background color={BRAND.border} gap={18} />
          <Controls showInteractive={false} />
          <Panel position="top-right" className="!m-2 flex flex-col gap-2">
            <OCButton variant="secondary" onClick={addSubgroup} className="text-xs">
              <Plus size={14} /> Subgrupo
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
            className="!m-2 max-w-[260px] rounded-lg bg-white/95 p-2.5 text-[10px] leading-relaxed shadow-sm"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}
          >
            <b style={{ color: BRAND.blue }}>4 fases fijas.</b> Arrastrá los paquetes entre subgrupos
            de la misma columna. Creá subgrupos con el botón +.
          </Panel>
        </ReactFlow>
      </div>
      {unassigned.length > 0 && (
        <p className="mt-2 text-xs" style={{ color: BRAND.error }}>
          {unassigned.length} paquete(s) sin subgrupo.
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
