'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TransformKind } from '@/lib/types/canvasMultinivel';

export type TransformacionVivoNodeData = {
  label: string;
  transformKind: TransformKind;
  graphStatus: string;
  tValue: number | null;
  inFrontera?: boolean;
  isCritical?: boolean;
  es?: number;
  ef?: number;
  duracionDias?: number | null;
};

const KIND_COLOR: Record<TransformKind, string> = {
  conocimiento: 'border-violet-500 bg-violet-50',
  coordinacion: 'border-amber-500 bg-amber-50',
  ejecucion: 'border-emerald-600 bg-emerald-50',
};

export function TransformacionVivoNode({ data, selected }: NodeProps<TransformacionVivoNodeData>) {
  const color = data.isCritical
    ? 'border-red-600 bg-red-50'
    : KIND_COLOR[data.transformKind] ?? 'border-slate-400 bg-white';
  return (
    <div
      className={`min-w-[120px] rounded-full border-2 px-4 py-2 text-center shadow-sm ${color} ${
        selected ? 'ring-2 ring-sky-400' : data.inFrontera ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-violet-500" />
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{data.transformKind}</p>
      <p className="text-sm font-semibold text-slate-900">{data.label}</p>
      {data.inFrontera && (
        <p className="mt-0.5 text-[10px] font-semibold text-amber-700">Frontera</p>
      )}
      {data.isCritical && (
        <p className="mt-0.5 text-[10px] font-semibold text-red-700">Crítica</p>
      )}
      {data.es != null && data.ef != null && (
        <p className="mt-0.5 text-[10px] text-slate-600">
          ES {data.es} → EF {data.ef}
          {data.duracionDias != null ? ` · ${data.duracionDias}d` : ''}
        </p>
      )}
      {data.tValue != null && (
        <p className="mt-0.5 text-[10px] text-slate-600">T = {data.tValue}</p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-violet-500" />
    </div>
  );
}
