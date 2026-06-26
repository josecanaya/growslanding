'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { cn } from '@/lib/utils';
import type { ObraCompletaTaskMetrics } from './buildObraCompletaGraph';

export type PertTaskNodeData = {
  metrics: ObraCompletaTaskMetrics;
};

function Corner({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('tabular-nums text-[9px] font-bold leading-none', className)}>{value}</span>
  );
}

function PertTaskNodeInner({ data, selected }: NodeProps) {
  const m = (data as PertTaskNodeData).metrics;
  const critical = m.isCritical;

  return (
    <div
      className={cn(
        'relative box-border w-[92px] rounded-lg border-2 bg-white px-1 py-1 shadow-sm',
        critical ? 'border-[#16a34a] ring-1 ring-[#16a34a]/30' : 'border-[#1e293b]',
        selected && 'ring-2 ring-[#2563eb]',
      )}
      title={`${m.title}\n${m.breadcrumb}`}
    >
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-[#64748b]" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-[#64748b]" />

      <div className="flex items-start justify-between gap-0.5 px-0.5">
        <Corner value={m.es} className="text-[#b91c1c]" />
        <Corner value={m.ef} className="text-[#b91c1c]" />
      </div>

      <div className="flex flex-col items-center justify-center py-0.5">
        <span className="text-sm font-black leading-none text-[#0f172a]">{m.code}</span>
        <span className="mt-0.5 text-[11px] font-extrabold tabular-nums text-[#0f172a]">{m.duration}</span>
        <span className="mt-1 line-clamp-2 max-w-full px-0.5 text-center text-[7px] font-medium leading-tight text-[#64748b]">
          {m.title}
        </span>
      </div>

      <div className="flex items-end justify-between gap-0.5 px-0.5">
        <Corner value={m.ls} className="text-[#0f172a]" />
        <Corner value={m.lf} className="text-[#0f172a]" />
      </div>
    </div>
  );
}

export const PertTaskNode = memo(PertTaskNodeInner);

export const pertFlowNodeTypes = { pertTask: PertTaskNode };
