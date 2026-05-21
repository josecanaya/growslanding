'use client';

import { ArrowUpRight, ChevronRight, Layers3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  labelEstadoNivel,
  labelTipoNodo,
  type DescendantTaskRollup,
} from '../canvasMultinivelHelpers';

type Props = {
  projectKind: CanvasProjectKind;
  ordered: CanvasNode[];
  selectedId: string | null;
  connectMode: boolean;
  pendingSourceId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  onConnectFirst: (id: string) => void;
  onConnectSecond: (sourceId: string, targetId: string) => boolean;
  childCount: (id: string) => number;
  getDescendantRollup?: (nodeId: string) => DescendantTaskRollup;
};

function progressValue(n: CanvasNode): number {
  return Math.min(100, Math.max(0, Math.round(n.avancePct ?? 0)));
}

function statusStyle(n: CanvasNode) {
  switch (n.estadoNivel ?? 'pendiente') {
    case 'completado':
      return {
        chip: 'bg-[#dff8ec] text-[#075c3d]',
        line: 'bg-[#24a375]',
        icon: 'bg-[#dff8ec] text-[#075c3d]',
      };
    case 'en_curso':
      return {
        chip: 'bg-[#d7e4f5] text-[#0f3d66]',
        line: 'bg-[#406182]',
        icon: 'bg-[#d7e4f5] text-[#0f3d66]',
      };
    case 'bloqueado':
      return {
        chip: 'bg-[#ffdad6] text-[#93000a]',
        line: 'bg-[#ba1a1a]',
        icon: 'bg-[#ffdad6] text-[#93000a]',
      };
    default:
      return {
        chip: 'bg-[#e8edf3] text-[#596574]',
        line: 'bg-[#bbc8d8]',
        icon: 'bg-[#f0f4f8] text-[#406182]',
      };
  }
}

export function EtapasTimelineView({
  projectKind,
  ordered,
  selectedId,
  connectMode,
  pendingSourceId,
  onSelect,
  onEnter,
  onConnectFirst,
  onConnectSecond,
  childCount,
  getDescendantRollup,
}: Props) {
  return (
    <div className="relative flex min-h-[min(68vh,760px)] w-full flex-col overflow-hidden rounded-2xl bg-[#f8fafc] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">
            Obra / Fases
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#0f172a]">
            Etapas de la obra
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#64748b]">
            Orden macro de ejecución. Doble click para abrir una fase y descomponerla en plantas o sectores.
          </p>
        </div>
        {connectMode ? (
          <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-xs font-bold text-[#1d4ed8] ring-1 ring-[#bfdbfe]">
            {pendingSourceId
              ? 'Elegí la etapa destino (derecha en el tiempo).'
              : 'Elegí la etapa origen (izquierda en el tiempo).'}
          </span>
        ) : null}
      </div>

      {ordered.length === 0 ? null : (
        <div className="relative z-10 flex-1 overflow-x-auto pb-3">
          <div className="flex min-h-[420px] min-w-min items-center gap-0 px-3">
            {ordered.map((n, idx) => {
              const st = statusStyle(n);
              const pct = progressValue(n);
              const rollup = getDescendantRollup?.(n.id);
              return (
              <div key={n.id} className="flex shrink-0 items-center">
                {idx > 0 && (
                  <div className="flex items-center px-2" aria-hidden>
                    <div className="h-px w-10 bg-[#cbd5e1]" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white">
                      <ChevronRight className="h-5 w-5 text-[#64748b]" />
                    </div>
                    <div className="h-px w-10 bg-[#cbd5e1]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (connectMode) {
                      if (!pendingSourceId) onConnectFirst(n.id);
                      else if (pendingSourceId === n.id) onSelect(n.id);
                      else onConnectSecond(pendingSourceId, n.id);
                      return;
                    }
                    onSelect(n.id);
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    if (!connectMode) onEnter(n.id);
                  }}
                  className={cn(
                    'group relative w-[min(320px,80vw)] overflow-hidden rounded-2xl bg-white px-5 py-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
                    selectedId === n.id && !connectMode
                      ? 'ring-2 ring-[#2563eb] ring-offset-4 ring-offset-[#f8fafc]'
                      : 'ring-1 ring-[#e5e7eb]',
                    connectMode && pendingSourceId === n.id
                      ? 'ring-2 ring-amber-400 ring-offset-4 ring-offset-[#f8fafc]'
                      : null,
                  )}
                >
                  <div className={cn('absolute inset-x-0 top-0 h-1.5', st.line)} />
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', st.icon)}>
                      <Layers3 className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]', st.chip)}>
                      {labelEstadoNivel(n.estadoNivel)}
                    </span>
                  </div>
                  <span className="mt-5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#94a3b8]">
                    {labelTipoNodo(n.type, projectKind)} · {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 line-clamp-2 text-xl font-bold leading-tight tracking-[-0.03em] text-[#0f172a]">
                    {n.title}
                  </p>
                  <div className="mt-4 space-y-1.5 text-sm text-[#64748b]">
                    <p>
                      <span className="font-semibold text-[#0f172a]">{rollup?.taskCount ?? 0}</span> tareas
                    </p>
                    <p>
                      {rollup?.publishedCount ?? 0} publicadas · {rollup?.unpublishedCount ?? 0} pendientes
                    </p>
                    <p>{rollup?.presupuestadasCount ?? 0} grupos de presupuesto</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">Hijos</span>
                      <span className="mt-1 block text-sm font-bold text-[#0f172a]">{childCount(n.id)}</span>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]">Avance</span>
                      <span className="mt-1 block text-sm font-bold text-[#0f172a]">{pct}%</span>
                    </div>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e4e9ed]">
                    <div className={cn('h-full rounded-full', st.line)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mt-5 flex items-center justify-between text-xs font-bold text-[#406182]">
                    Doble click para abrir
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </button>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
