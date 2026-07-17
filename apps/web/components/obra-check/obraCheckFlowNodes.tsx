'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { BRAND } from './ui';

export const obraCheckFlowNodeTypes = {
  phaseLane: memo(PhaseLaneNode),
  phaseLabel: memo(PhaseLabelNode),
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

/** Etiqueta lateral sutil de fase (timeline). */
function PhaseLabelNode({ data }: NodeProps) {
  const d = data as { label: string; count: number; accent: string };
  return (
    <div className="flex h-full w-full flex-col justify-center pr-2" style={{ pointerEvents: 'none' }}>
      <p
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: d.accent }}
      >
        {d.label}
      </p>
      <p className="text-[9px]" style={{ color: BRAND.muted }}>
        {d.count} tarea{d.count === 1 ? '' : 's'}
      </p>
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
  const critical = Boolean(d.critical);
  const handleStyle = {
    width: 7,
    height: 7,
    background: critical ? BRAND.gold : '#94a3b8',
    border: '1.5px solid #fff',
    opacity: critical ? 1 : 0.7,
  };
  return (
    <div
      className="rounded-lg px-2.5 py-1.5"
      style={{
        background: critical ? '#FFFBEB' : '#fff',
        border: critical ? `2.5px solid ${BRAND.gold}` : `1px solid ${BRAND.border}`,
        boxShadow: critical
          ? `0 0 0 3px ${BRAND.gold}40, 0 2px 8px rgba(232,197,71,0.35)`
          : selected
            ? `0 0 0 2px ${BRAND.blueLight}44`
            : '0 1px 2px rgba(15,23,42,0.04)',
        opacity: critical ? 1 : 0.92,
      }}
    >
      <Handle id="in-left" type="target" position={Position.Left} style={handleStyle} />
      {critical ? (
        <p
          className="mb-0.5 text-[8px] font-black uppercase tracking-wide"
          style={{ color: '#A16207' }}
        >
          Camino crítico
        </p>
      ) : null}
      <p
        className="line-clamp-2 text-[11px] font-semibold leading-tight"
        style={{ color: BRAND.text }}
      >
        {d.label}
      </p>
      <div className="mt-0.5 flex items-center justify-between gap-1">
        {d.duracion != null ? (
          <p className="text-[10px] tabular-nums" style={{ color: BRAND.muted }}>
            {d.duracion}d
          </p>
        ) : (
          <span />
        )}
      </div>
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
