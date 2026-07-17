'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { PHASE_COLORS, type CanonicalPhase } from '@/lib/obra-check/phases';
import { BRAND } from './ui';

export const obraCheckFlowNodeTypes = {
  phaseLane: memo(PhaseLaneNode),
  taskCard: memo(TaskCardNode),
  blockTag: memo(BlockTagNode),
  subgrupoLane: memo(SubgrupoLaneNode),
  paquete: memo(PaqueteNode),
};

function PhaseLaneNode({ data }: NodeProps) {
  const d = data as { label: string; count: number };
  const colors = PHASE_COLORS[d.label as CanonicalPhase] ?? PHASE_COLORS.Preparacion;
  return (
    <div className="h-full w-full overflow-hidden rounded-xl" style={{ pointerEvents: 'none' }}>
      <div
        className="px-2 py-1.5 text-center text-xs font-extrabold text-white"
        style={{ background: colors.bar }}
      >
        {d.label}
        <span className="ml-1 text-[10px] font-normal opacity-90">({d.count})</span>
      </div>
    </div>
  );
}

function TaskCardNode({ data, selected }: NodeProps) {
  const d = data as { label: string; duracion: number | null; critical?: boolean };
  return (
    <div
      className="rounded-lg px-2 py-1.5 shadow-sm"
      style={{
        background: '#fff',
        border: `1.5px solid ${d.critical ? BRAND.gold : BRAND.border}`,
        boxShadow: selected ? `0 0 0 2px ${BRAND.gold}55` : d.critical ? `0 0 0 1px ${BRAND.gold}33` : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <p className="text-[11px] font-semibold leading-tight" style={{ color: BRAND.text }}>
        {d.label}
      </p>
      {d.duracion != null && (
        <p className="text-[10px]" style={{ color: BRAND.muted }}>
          {d.duracion}d
        </p>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function BlockTagNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <p className="truncate text-[9px] font-bold uppercase tracking-wide" style={{ color: BRAND.muted }}>
      {d.label}
    </p>
  );
}

function SubgrupoLaneNode({ data, selected }: NodeProps) {
  const d = data as { label: string; packageCount: number };
  return (
    <div
      className="h-full w-full rounded-lg border-2 border-dashed px-2 py-1"
      style={{
        borderColor: selected ? BRAND.gold : BRAND.border,
        background: '#FFFDF5',
      }}
    >
      <p className="text-[10px] font-bold" style={{ color: BRAND.blue }}>
        {d.label}
      </p>
      <p className="text-[9px]" style={{ color: BRAND.muted }}>
        {d.packageCount} paq.
      </p>
    </div>
  );
}

function PaqueteNode({ data, selected }: NodeProps) {
  const d = data as {
    label: string;
    taskCount: number;
    taskPreview: string[];
  };
  return (
    <div
      className="cursor-grab rounded-lg px-2 py-1.5 shadow-sm active:cursor-grabbing"
      style={{
        background: '#fff',
        border: `1.5px solid ${selected ? BRAND.gold : BRAND.border}`,
      }}
    >
      <p className="text-[11px] font-semibold" style={{ color: BRAND.text }}>
        {d.label}
      </p>
      <p className="text-[9px]" style={{ color: BRAND.muted }}>
        {d.taskCount} tarea(s)
      </p>
      {d.taskPreview.slice(0, 2).map((t) => (
        <p key={t} className="truncate text-[9px]" style={{ color: BRAND.muted }}>
          · {t}
        </p>
      ))}
    </div>
  );
}
