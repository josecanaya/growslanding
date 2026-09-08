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
  /** El cuadro contiene otro Canvas (tiene hijos). Habilita el hint de doble click. */
  containsCanvas: boolean;
  /**
   * Relaciones del grafo global que NO se dibujan en este nivel:
   * externas = hacia otro scope; agregadas = más profundas, entre tarjetas visibles.
   * Se muestran como contador para no dibujar flechas hacia nodos ocultos.
   */
  externalRelationCount: number;
  aggregatedRelationCount: number;
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
    containsCanvas,
    externalRelationCount,
    aggregatedRelationCount,
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
      : { label: '', bar: 'bg-[#D3D2CC]', pill: '' };
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

  const hasBadges =
    muestraCriticaBadge ||
    (cpmSnap != null && !cpmSnap.isCritical) ||
    taskPublication != null ||
    externalRelationCount > 0 ||
    aggregatedRelationCount > 0 ||
    budgetGroupLabel != null;

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
          'relative flex flex-col rounded-[6px] border bg-white px-3 py-2.5 overflow-hidden transition-[box-shadow,border-color]',
          reviewRing,
          !reviewRing &&
            (selected
              ? 'border-[#0C1D36] shadow-[0_0_0_1px_#0C1D36]'
              : ringCritico
                ? 'border-[#C6A3A0]'
                : 'border-[#D3D2CC]'),
        )}
      >
        {/* franja izquierda de estado */}
        <div className={`absolute inset-y-0 left-0 w-0.5 ${tareaExtras.bar}`} />

        {/* 1 — eyebrow + glifo */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wide text-[#8B8C90]">
            {labelTipoNodo(node.type, projectKind)}
          </span>
          <Ico className="h-[13px] w-[13px] shrink-0 text-[#55565C]" aria-hidden strokeWidth={1.8} />
        </div>

        {/* 2 — título */}
        <p className="mt-0.5 break-words text-[13px] font-semibold leading-tight text-[#15161A]">
          {node.title}
        </p>

        {/* 3 — id + duración (solo tareas) */}
        {node.type === 'tarea' ? (
          <p className="mt-0.5 font-mono text-[9px] text-[#8B8C90]">
            {tareaShortId} · {duracion} {duracion === 1 ? 'día' : 'días'}
          </p>
        ) : null}

        {/* 4 — métricas */}
        {node.type === 'tarea' ? (
          <p className="mt-0.5 text-[10px] tabular-nums text-[#55565C]">
            {total > 0 ? `${done}/${total} · ` : ''}
            {avancePct > 0 ? `${avancePct}%` : '—'}
            {precedentInCount > 0 || precedentOutCount > 0
              ? ` · in ${precedentInCount} out ${precedentOutCount}`
              : ''}
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] tabular-nums text-[#55565C]">
            {childCount} hijo(s)
            {precedentInCount > 0 || precedentOutCount > 0
              ? ` · prec ${precedentInCount}→${precedentOutCount}`
              : ''}
          </p>
        )}

        {/* 5 — barra de avance 2 px (solo si pct > 0) */}
        {avancePct > 0 ? (
          <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-[#E9E8E3]">
            <div className={`h-full rounded-full ${tareaExtras.bar}`} style={{ width: `${avancePct}%` }} />
          </div>
        ) : null}

        {/* 6 — badges (solo los que no son cero/nulo) */}
        {hasBadges ? (
          <div className="mt-1 flex flex-wrap gap-0.5">
            {muestraCriticaBadge ? (
              <span className="rounded border border-[#C6A3A0] bg-[#FBF1F0] px-1 py-px text-[8px] font-bold uppercase text-[#A32A2A]">
                Crítica
              </span>
            ) : null}
            {cpmSnap && !cpmSnap.isCritical ? (
              <span className="rounded border border-[#D3D2CC] px-1 py-px text-[8px] text-[#8B8C90]">
                Holgura {cpmSnap.float}d
              </span>
            ) : null}
            {taskPublication === 'publicada' ? (
              <span className="rounded border border-emerald-400/80 bg-emerald-50 px-1 py-px text-[8px] font-bold uppercase text-emerald-900">
                Publicada
              </span>
            ) : taskPublication === 'sin_publicar' ? (
              <span className="rounded border border-[#D3D2CC] bg-[#F4F4F1] px-1 py-px text-[8px] font-bold uppercase text-[#55565C]">
                Sin pub.
              </span>
            ) : null}
            {externalRelationCount > 0 ? (
              <span
                className="rounded border border-[#c084fc]/60 bg-[#faf5ff] px-1 py-px text-[8px] font-bold text-[#6b21a8]"
                title={`${externalRelationCount} relación(es) con nodos de otros cuadros`}
              >
                Ext. {externalRelationCount}
              </span>
            ) : null}
            {aggregatedRelationCount > 0 ? (
              <span
                className="rounded border border-[#7dd3fc]/70 bg-[#f0f9ff] px-1 py-px text-[8px] font-bold text-[#075985]"
                title={`${aggregatedRelationCount} relación(es) entre elementos más profundos`}
              >
                Agr. {aggregatedRelationCount}
              </span>
            ) : null}
            {budgetGroupLabel ? (
              <span
                className="max-w-[120px] truncate rounded border border-[#D3D2CC] bg-[#F4F4F1] px-1 py-px text-[8px] text-[#55565C]"
                title={budgetGroupLabel}
              >
                {budgetGroupLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* 7 — hint */}
        <p className="mt-1 text-[8px] leading-snug text-[#B2B1AA]">
          {containsCanvas ? 'Doble clic para entrar' : 'Doble clic abre su lienzo'}
        </p>
      </div>
    </div>
  );
});

export const multinivelFlowNodeTypes = { multinivel: MultinivelFlowNodeInner };
