'use client';

import { memo } from 'react';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import {
  Boxes,
  Building2,
  CheckSquare,
  DoorOpen,
  LayoutGrid,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

import { cn } from '@/lib/utils';

import { checklistProgress, labelTipoNodo } from './canvasMultinivelHelpers';
import type { TareaCPMResultado } from '@/lib/utils/cpm';

export type MultinivelNodeData = {
  node: CanvasNode;
  childCount: number;
  selected: boolean;
  /** Handles de precedencia sólo cuando el usuario activó modo conectar */
  handlesEnabled: boolean;
  /** Aristas entrantes/salientes en este lienzo (mis hermanos) */
  precedentInCount: number;
  precedentOutCount: number;
  /** Resultado CPM local (solo tareas del ambiente actual); derivado en memoria. */
  cpmSnap: TareaCPMResultado | null;
};

function iconForType(type: CanvasNode['type']) {
  switch (type) {
    case 'etapa':
      return Layers;
    case 'planta':
      return Building2;
    case 'sector':
      return LayoutGrid;
    case 'ambiente':
      return DoorOpen;
    case 'tarea':
      return CheckSquare;
    default:
      return Boxes;
  }
}

function cardWidths(type: CanvasNode['type']) {
  switch (type) {
    case 'etapa':
      return 'min-w-[276px] max-w-[308px]';
    case 'planta':
      return 'min-w-[248px] max-w-[280px]';
    case 'sector':
      return 'min-w-[222px] max-w-[256px]';
    case 'ambiente':
      return 'min-w-[200px] max-w-[240px]';
    case 'tarea':
      return 'min-w-[220px] max-w-[268px]';
    default:
      return 'min-w-[200px]';
  }
}

function tareaEstadoVisual(estado: CanvasNode['estadoTarea']) {
  const e = estado ?? 'pendiente';
  const map: Record<string, { label: string; bar: string; pill: string }> = {
    pendiente: {
      label: 'Pendiente',
      bar: 'bg-[#c5cad5]',
      pill: 'border-[#a8aec0] text-[#596574] bg-[#f3f5f9]',
    },
    en_progreso: {
      label: 'En progreso',
      bar: 'bg-[#1d6bdc]',
      pill: 'border-[#1d6bdc]/40 text-[#0f4aa3] bg-[#e9f2ff]',
    },
    para_validar: {
      label: 'Próximo / validación',
      bar: 'bg-[#d4a527]',
      pill: 'border-[#d4a527]/45 text-[#6b5610] bg-[#fcf6df]',
    },
    validada: {
      label: 'Completado',
      bar: 'bg-[#1f9d6c]',
      pill: 'border-[#1f9d6c]/40 text-[#0f5c3f] bg-[#e6f9f1]',
    },
    rechazada: {
      label: 'Bloqueado',
      bar: 'bg-[#c23b3b]',
      pill: 'border-[#c23b3b]/35 text-[#7a2323] bg-[#fdecec]',
    },
  };
  return map[e];
}

export const MultinivelFlowNodeInner = memo(function MultinivelFlowNodeInner({
  data,
}: NodeProps<Node<MultinivelNodeData>>) {
  const {
    node,
    childCount,
    selected,
    handlesEnabled,
    precedentInCount,
    precedentOutCount,
    cpmSnap,
  } = data;
  const Ico = iconForType(node.type);
  const wClass = cardWidths(node.type);

  const tareaExtras =
    node.type === 'tarea'
      ? tareaEstadoVisual(node.estadoTarea)
      : { label: '', bar: 'bg-[#0042c8]/85', pill: '' };
  const { done, total } = checklistProgress(node);

  const criticaPorCpm = node.type === 'tarea' && Boolean(cpmSnap?.isCritical);
  const muestraCriticaBadge = node.type === 'tarea' && (criticaPorCpm || node.esCritica);
  const ringCritico = node.type === 'tarea' && (criticaPorCpm || Boolean(node.esCritica));

  return (
    <div className={`relative ${wClass}`}>
      <Handle
        id="tgt"
        type="target"
        position={Position.Left}
        isConnectable={handlesEnabled}
        className={`!h-2.5 !w-2.5 !border-2 !bg-white ${
          handlesEnabled ? '!border-[#0042c8] !opacity-100' : '!border-[#aab2c9] !opacity-[0.62]'
        }`}
      />
      <Handle
        id="src"
        type="source"
        position={Position.Right}
        isConnectable={handlesEnabled}
        className={`!h-2.5 !w-2.5 !border-2 !bg-white ${
          handlesEnabled ? '!border-[#0042c8] !opacity-100' : '!border-[#aab2c9] !opacity-[0.62]'
        }`}
      />

      <div
        className={cn(
          'relative flex flex-col overflow-hidden rounded-2xl border bg-white px-3.5 py-3 shadow-[0_6px_24px_-6px_rgba(15,30,31,0.12)] ring-1 ring-black/[0.04] transition-[box-shadow,border-color,ring]',
          selected
            ? 'border-[#0042c8] ring-[#0042c8]/35 shadow-[0_10px_32px_-8px_rgba(15,72,248,0.22)]'
            : ringCritico
              ? 'border-[#d43b4e]/85 ring-[#c41e3a]/35'
              : 'border-[#d9dce8]',
        )}
      >
        {/* Franja estado / nivel */}
        <div className={`absolute left-0 right-0 top-0 h-[3px] ${node.type === 'tarea' ? tareaExtras.bar : 'bg-gradient-to-r from-[#0042c8] to-[#5b8edc]'}`} />

        {node.type === 'tarea' && muestraCriticaBadge ? (
          <div className="mb-2 flex flex-wrap gap-1.5 pt-1">
            {criticaPorCpm ? (
              <span className="rounded-md border border-[#c41e3a]/50 bg-[#fff0f0] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#9f1f2c]">
                Crítica · CPM
              </span>
            ) : null}
            {Boolean(node.esCritica) && !criticaPorCpm ? (
              <span className="rounded-md border border-[#7a2740]/40 bg-[#faf5f7] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#642032]">
                Crítica · forzada
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mb-1 flex items-start justify-between gap-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#434656]">
            {labelTipoNodo(node.type)}
          </span>
          <Ico className="h-4 w-4 shrink-0 text-[#0042c8]" aria-hidden strokeWidth={1.75} />
        </div>

        <p className="break-words text-[15px] font-extrabold leading-snug tracking-tight text-[#0f1e1f]">
          {node.title}
        </p>

        {node.type === 'tarea' ? (
          <div className="mt-2 space-y-1.5">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tareaExtras.pill}`}>
              {tareaExtras.label}
            </span>
            <p className="text-[11px] font-medium text-[#596574]">
              Checklist{' '}
              <span className="font-bold text-[#0f1e1f]">
                {total === 0 ? 'sin ítems' : `${done}/${total}`}
              </span>
            </p>
            {cpmSnap && !cpmSnap.isCritical ? (
              <p className="text-[10px] font-medium text-[#6b7288]">
                Holgura total <span className="font-bold text-[#374151]">{cpmSnap.float}</span>d · libre{' '}
                <span className="font-bold text-[#374151]">{cpmSnap.float_free}</span>d
              </p>
            ) : null}
            {(precedentInCount > 0 || precedentOutCount > 0) && (
              <p className="flex items-center gap-1 text-[10px] text-[#73809a]">
                <GitBranch className="h-3 w-3 shrink-0" aria-hidden />
                Prec: {precedentInCount} entrada(s) · {precedentOutCount} salida(s)
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <p className="text-[12px] font-semibold text-[#596574]">
              Contiene · <span className="text-[#0f1e1f]">{childCount}</span>{' '}
              {childCount === 1 ? 'hijo' : 'hijos'}
            </p>
            {(precedentInCount > 0 || precedentOutCount > 0) && (
              <p className="flex items-center gap-1 text-[10px] font-medium text-[#73809a]">
                <GitBranch className="h-3 w-3 shrink-0" aria-hidden />
                Precedencias · {precedentInCount} → {precedentOutCount}
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-[9px] leading-tight text-[#9598a9]">
          {node.type === 'tarea'
            ? 'Activá modo conectar y arrastrá entre los puntos. La edición detallada está en el panel izquierdo.'
            : 'Doble click para entrar y ver el siguiente nivel de la obra.'}
        </p>
      </div>
    </div>
  );
});

export const multinivelFlowNodeTypes = { multinivel: MultinivelFlowNodeInner };
