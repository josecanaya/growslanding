'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TareaEditorMock } from '@/lib/mocks/canvasObraEditorMock';

export function TareaFlowNode({ data, selected }: NodeProps) {
  const v = data as TareaEditorMock;
  const doneCk = v.checklist.filter((c) => c.done).length;
  const totalCk = v.checklist.length;
  return (
    <>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-[#737688]" />
      <div
        className={`rounded-xl border-2 bg-white p-3 shadow-md transition-shadow min-w-[200px] max-w-[240px] ${
          selected ? 'border-[#0042c8] ring-2 ring-[#0042c8]/20 shadow-lg' : 'border-[#c3c5d9]'
        }`}
      >
        <p className="text-sm font-extrabold leading-tight text-[#0f1e1f]">{v.nombre}</p>
        <p className="text-[10px] font-semibold text-[#434656] mt-1.5">⏱ {v.dias} días</p>
        {totalCk > 0 && (
          <p className="text-[10px] font-medium text-[#006d37] mt-1.5">
            Checklist {doneCk}/{totalCk}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-[#737688]" />
    </>
  );
}
