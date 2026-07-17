'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { BRAND } from './ui';

export const obraCheckFlowNodeTypes = {
  phaseLane: memo(PhaseLaneNode),
  phaseFrame: memo(PhaseFrameNode),
  taskCard: memo(TaskCardNode),
  blockTag: memo(BlockTagNode),
  subgrupoLane: memo(SubgrupoLaneNode),
  paquete: memo(PaqueteNode),
};

function PhaseLaneNode({ data }: NodeProps) {
  const d = data as { label: string; count: number };
  return (
    <div
      className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-extrabold text-white"
      style={{ pointerEvents: 'none' }}
    >
      {d.label}
      <span className="ml-1 text-[10px] font-normal opacity-90">({d.count})</span>
    </div>
  );
}

function PhaseFrameNode() {
  return <div className="h-full w-full" style={{ pointerEvents: 'none' }} />;
}

function TaskCardNode({ data, selected }: NodeProps) {
  const d = data as {
    label: string;
    duracion: number | null;
    critical?: boolean;
    predCount?: number;
  };
  const handleStyle = {
    width: 8,
    height: 8,
    background: d.critical ? BRAND.gold : BRAND.blueLight,
    border: '1.5px solid #fff',
  };
  return (
    <div
      className="rounded-lg px-2 py-1.5 shadow-sm"
      style={{
        background: '#fff',
        border: `1.5px solid ${d.critical ? BRAND.gold : BRAND.border}`,
        boxShadow: selected ? `0 0 0 2px ${BRAND.gold}55` : d.critical ? `0 0 0 1px ${BRAND.gold}33` : 'none',
      }}
    >
      <Handle id="in-top" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="in-left" type="target" position={Position.Left} style={handleStyle} />
      <p className="text-[11px] font-semibold leading-tight" style={{ color: BRAND.text }}>
        {d.label}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-1">
        {d.duracion != null ? (
          <p className="text-[10px]" style={{ color: BRAND.muted }}>
            {d.duracion}d
          </p>
        ) : (
          <span />
        )}
        {(d.predCount ?? 0) > 0 ? (
          <p className="text-[9px] font-semibold" style={{ color: BRAND.blue }}>
            ← {d.predCount}
          </p>
        ) : null}
      </div>
      <Handle id="out-bottom" type="source" position={Position.Bottom} style={handleStyle} />
      <Handle id="out-right" type="source" position={Position.Right} style={handleStyle} />
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
