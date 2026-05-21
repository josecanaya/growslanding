'use client';

import { memo } from 'react';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  Boxes,
  Building2,
  CheckSquare,
  DoorOpen,
  LayoutGrid,
  Layers,
  GitBranch,
  MoreHorizontal,
} from 'lucide-react';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

import { cn } from '@/lib/utils';

import { checklistProgress, labelTipoNodo } from './canvasMultinivelHelpers';
import type { PublicationReviewCategory } from './canvasMultinivelHelpers';
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
  projectKind: CanvasProjectKind;
  /** Publicación a tareas operativas (no confundir con estado FSM). */
  taskPublication: 'publicada' | 'sin_publicar' | null;
  /** Nombre del grupo de presupuesto asignado (solo lectura en card). */
  budgetGroupLabel: string | null;
  /** Modo cinta Publicación: resalta estado de revisión. */
  publicationReview: boolean;
  publicationReviewCategory: PublicationReviewCategory | null;
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
      return 'min-w-[220px] max-w-[260px]';
    case 'planta':
      return 'min-w-[200px] max-w-[232px]';
    case 'sector':
      return 'min-w-[180px] max-w-[210px]';
    case 'ambiente':
      return 'min-w-[168px] max-w-[200px]';
    case 'tarea':
      return 'min-w-[176px] max-w-[220px]';
    default:
      return 'min-w-[168px]';
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
    projectKind,
    taskPublication,
    budgetGroupLabel,
    publicationReview,
    publicationReviewCategory,
  } = data;
  const Ico = iconForType(node.type);
  const wClass = cardWidths(node.type);

  const tareaShortId =
    node.importOutlineNumber?.trim() ||
    (node.id.length >= 8 ? `T-${node.id.slice(0, 8).toUpperCase()}` : `T-${node.id}`);
  const duracion = node.duracionDias ?? 0;
  const avancePct = Math.min(100, Math.max(0, Math.round(node.avancePct ?? 0)));

  const tareaExtras =
    node.type === 'tarea'
      ? tareaEstadoVisual(node.estadoTarea)
      : { label: '', bar: 'bg-[#0042c8]/85', pill: '' };
  const { done, total } = checklistProgress(node);

  const criticaPorCpm = node.type === 'tarea' && Boolean(cpmSnap?.isCritical);
  const muestraCriticaBadge = node.type === 'tarea' && (criticaPorCpm || node.esCritica);
  const ringCritico = node.type === 'tarea' && (criticaPorCpm || Boolean(node.esCritica));

  const reviewRing =
    publicationReview && node.type === 'tarea' && publicationReviewCategory
      ? {
          published: 'ring-2 ring-emerald-500/90 ring-offset-1',
          draft: 'ring-2 ring-slate-400/80 ring-offset-1',
          incomplete: 'ring-2 ring-amber-500/85 ring-offset-1',
          blocked: 'ring-2 ring-red-600/90 ring-offset-1',
        }[publicationReviewCategory]
      : '';

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
          'relative flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white px-2.5 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-[box-shadow,border-color]',
          reviewRing,
          !reviewRing &&
            (selected
              ? 'border-[#2563eb] bg-[#eff6ff] shadow-[0_0_0_1px_rgba(37,99,235,0.25)]'
              : ringCritico
                ? 'border-[#c41e3a]'
                : 'border-[#c5cdd8]'),
        )}
      >
        <div className={`absolute left-0 right-0 top-0 h-0.5 ${node.type === 'tarea' ? tareaExtras.bar : 'bg-gradient-to-r from-[#2563eb] to-[#60a5fa]'}`} />

        {node.type === 'tarea' && muestraCriticaBadge ? (
          <div className="mb-1 flex flex-wrap gap-1 pt-0.5">
            {criticaPorCpm ? (
              <span className="rounded border border-[#c41e3a]/50 bg-[#fff0f0] px-1 py-px text-[8px] font-extrabold uppercase text-[#9f1f2c]">
                CPM
              </span>
            ) : null}
            {Boolean(node.esCritica) && !criticaPorCpm ? (
              <span className="rounded border border-[#7a2740]/40 bg-[#faf5f7] px-1 py-px text-[8px] font-extrabold uppercase text-[#642032]">
                Crítica
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wide text-[#64748b]">
            {labelTipoNodo(node.type, projectKind)}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <Ico className="h-3.5 w-3.5 text-[#2563eb]" aria-hidden strokeWidth={2} />
            <span className="rounded p-0.5 text-[#94a3b8]" title="Acciones en inspector">
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
        </div>

        {node.type === 'tarea' ? (
          <p className="mt-0.5 font-mono text-[9px] font-semibold text-[#475569]">
            {tareaShortId} · {duracion} {duracion === 1 ? 'día' : 'días'}
          </p>
        ) : null}

        <p className="mt-0.5 break-words text-[12px] font-bold leading-tight text-[#0f172a]">{node.title}</p>

        {node.type === 'tarea' ? (
          <div className="mt-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1">
              <span
                className={`inline-flex rounded border px-1 py-px text-[9px] font-semibold ${tareaExtras.pill}`}
              >
                {tareaExtras.label}
              </span>
              {taskPublication === 'publicada' ? (
                <span className="inline-flex rounded border border-emerald-400/80 bg-emerald-50 px-1 py-px text-[8px] font-bold uppercase text-emerald-900">
                  Publicada
                </span>
              ) : taskPublication === 'sin_publicar' ? (
                <span className="inline-flex rounded border border-slate-400/70 bg-slate-100 px-1 py-px text-[8px] font-bold uppercase text-slate-700">
                  Sin publicar
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[9px] text-[#64748b]">
              <span title="Checklist">
                <CheckSquare className="mr-0.5 inline h-2.5 w-2.5 align-middle" />
                {total === 0 ? '—' : `${done}/${total}`}
              </span>
              {(precedentInCount > 0 || precedentOutCount > 0) && (
                <span className="flex items-center gap-0.5" title="Precedencias entrada / salida">
                  <GitBranch className="h-2.5 w-2.5" />
                  in {precedentInCount} · out {precedentOutCount}
                </span>
              )}
              {budgetGroupLabel ? (
                <span className="truncate font-medium text-[#475569]" title={budgetGroupLabel}>
                  Presupuesto: {budgetGroupLabel}
                </span>
              ) : (
                <span className="truncate text-[#94a3b8]" title="Sin grupo de presupuesto">
                  Presupuesto: sin grupo
                </span>
              )}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#2563eb]"
                style={{ width: `${avancePct}%` }}
              />
            </div>
            {cpmSnap && !cpmSnap.isCritical ? (
              <p className="text-[8px] text-[#64748b]">
                Holgura {cpmSnap.float}d
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-1 space-y-0.5 text-[10px] text-[#64748b]">
            <p>
              Hijo(s): <span className="font-bold text-[#0f172a]">{childCount}</span>
            </p>
            {(precedentInCount > 0 || precedentOutCount > 0) && (
              <p className="flex items-center gap-0.5">
                <GitBranch className="h-2.5 w-2.5" />
                Prec. {precedentInCount}→{precedentOutCount}
              </p>
            )}
          </div>
        )}

        <p className="mt-1 text-[8px] leading-snug text-[#94a3b8]">
          {node.type === 'tarea'
            ? 'Inspector: checklist, presupuesto y precedencias.'
            : 'Doble click para bajar de nivel.'}
        </p>
      </div>
    </div>
  );
});

export const multinivelFlowNodeTypes = { multinivel: MultinivelFlowNodeInner };
