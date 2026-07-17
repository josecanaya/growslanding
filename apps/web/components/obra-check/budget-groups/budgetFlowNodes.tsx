'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BRAND } from '../ui';

export type PhaseNodeData = {
  label: string;
  subgroupCount: number;
  packageCount: number;
};

export type SubgroupNodeData = {
  label: string;
  packageCount: number;
  taskCount: number;
  onRename?: (name: string) => void;
};

export type PackageNodeData = {
  label: string;
  fase: string | null;
  taskCount: number;
  taskPreview: string[];
};

export const budgetFlowNodeTypes = {
  fase: memo(FaseNode),
  subgrupo: memo(SubgroupNode),
  paquete: memo(PackageNode),
};

function FaseNode({ data }: NodeProps) {
  const d = data as PhaseNodeData;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-md"
      style={{
        background: BRAND.blue,
        color: '#fff',
        minWidth: 200,
        border: `2px solid ${BRAND.gold}`,
      }}
    >
      <p className="text-sm font-extrabold">{d.label}</p>
      <p className="mt-0.5 text-[10px] opacity-80">
        {d.subgroupCount} subgrupo(s) · {d.packageCount} paquete(s)
      </p>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function SubgroupNode({ data, selected }: NodeProps) {
  const d = data as SubgroupNodeData;
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-sm"
      style={{
        background: '#FFFDF5',
        border: `2px solid ${selected ? BRAND.gold : BRAND.border}`,
        minWidth: 180,
      }}
    >
      <p className="text-xs font-bold" style={{ color: BRAND.blue }}>
        {d.label}
      </p>
      <p className="text-[10px]" style={{ color: BRAND.muted }}>
        {d.packageCount} paq. · {d.taskCount} tareas
      </p>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function PackageNode({ data, selected }: NodeProps) {
  const d = data as PackageNodeData;
  return (
    <div
      className="rounded-lg px-2.5 py-2 shadow-sm"
      style={{
        background: '#fff',
        border: `1.5px solid ${selected ? BRAND.gold : BRAND.border}`,
        minWidth: 160,
        maxWidth: 200,
        cursor: 'grab',
      }}
    >
      <p className="text-xs font-semibold leading-tight" style={{ color: BRAND.text }}>
        {d.label}
      </p>
      <p className="mt-0.5 text-[10px]" style={{ color: BRAND.muted }}>
        {d.taskCount} tarea(s)
      </p>
      {d.taskPreview.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-[10px]" style={{ color: BRAND.muted }}>
          {d.taskPreview.slice(0, 3).map((t) => (
            <li key={t} className="truncate">
              · {t}
            </li>
          ))}
          {d.taskPreview.length > 3 && <li>+{d.taskPreview.length - 3} más</li>}
        </ul>
      )}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  );
}
