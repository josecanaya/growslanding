'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

export type EstadoVivoNodeData = {
  label: string;
  graphStatus: string;
  inFrontera?: boolean;
};

export function EstadoVivoNode({ data, selected }: NodeProps<EstadoVivoNodeData>) {
  const fantasma = data.graphStatus === 'fantasma';
  const frontera = Boolean(data.inFrontera);
  return (
    <div
      className={`min-w-[140px] rounded-lg border-2 px-4 py-3 text-center shadow-sm ${
        fantasma
          ? frontera
            ? 'border-dashed border-amber-500 bg-amber-50 text-amber-900'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
          : 'border-sky-600 bg-white text-slate-900'
      } ${selected ? 'ring-2 ring-sky-400' : frontera && fantasma ? 'ring-2 ring-amber-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-sky-500" />
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {fantasma ? 'Estado posible' : 'Estado'}
      </p>
      <p className="text-sm font-semibold">{data.label}</p>
      <Handle type="source" position={Position.Right} className="!bg-sky-500" />
    </div>
  );
}
