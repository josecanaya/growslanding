'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { cn } from '@/lib/utils';
import type { ObraCompletaTaskMetrics } from './buildObraCompletaGraph';

export type PertTaskNodeData = {
  metrics: ObraCompletaTaskMetrics;
};

function Corner({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span className="text-[6px] font-bold uppercase tracking-tight text-[#94a3b8]">{label}</span>
      <span className={cn('tabular-nums text-[9px] font-bold', valueClassName)}>{value}</span>
    </span>
  );
}

function PertTaskNodeInner({ data, selected }: NodeProps) {
  const m = (data as PertTaskNodeData).metrics;
  const critical = m.isCritical;
  const c = m.faseColor;

  return (
    <div
      className={cn(
        'relative box-border w-[92px] overflow-hidden rounded-lg border-2 px-0 py-0 shadow-sm',
        critical && 'ring-2 ring-[#16a34a]/50',
        selected && 'ring-2 ring-[#2563eb] ring-offset-1',
      )}
      style={{
        borderColor: c.border,
        backgroundColor: c.bg,
      }}
      title={`${m.title}\n${m.breadcrumb}`}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-[#64748b]" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-[#64748b]" />

      <div
        className="truncate px-1 py-0.5 text-center text-[6px] font-bold leading-tight text-white"
        style={{ backgroundColor: c.bar }}
        title={m.faseLabel}
      >
        {m.faseLabel}
      </div>

      <div className="flex items-start justify-between gap-0.5 px-0.5 pt-0.5">
        <Corner label="ES" value={m.es} valueClassName="text-[#b91c1c]" />
        <Corner label="EF" value={m.ef} valueClassName="text-[#b91c1c]" />
      </div>

      <div className="flex flex-col items-center justify-center px-0.5 py-0.5">
        <span className="text-[15px] font-black leading-none tabular-nums" style={{ color: c.text }}>
          {m.duration}
        </span>
        <span className="text-[7px] font-bold uppercase tracking-wide text-[#64748b]">días</span>
        <span className="mt-1 line-clamp-2 max-w-full px-0.5 text-center text-[7px] font-medium leading-tight text-[#64748b]">
          {m.title}
        </span>
      </div>

      <div className="flex items-end justify-between gap-0.5 px-0.5 pb-0.5">
        <Corner label="LS" value={m.ls} valueClassName="text-[#0f172a]" />
        <Corner label="LF" value={m.lf} valueClassName="text-[#0f172a]" />
      </div>
    </div>
  );
}

export const PertTaskNode = memo(PertTaskNodeInner);

export const pertFlowNodeTypes = { pertTask: PertTaskNode };
