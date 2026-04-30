'use client';

import { ArrowUpRight, ChevronRight, Layers3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { labelEstadoNivel, labelTipoNodo } from '../canvasMultinivelHelpers';

type Props = {
  ordered: CanvasNode[];
  selectedId: string | null;
  connectMode: boolean;
  pendingSourceId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  onConnectFirst: (id: string) => void;
  onConnectSecond: (sourceId: string, targetId: string) => boolean;
  childCount: (id: string) => number;
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
  ordered,
  selectedId,
  connectMode,
  pendingSourceId,
  onSelect,
  onEnter,
  onConnectFirst,
  onConnectSecond,
  childCount,
}: Props) {
  return (
    <div className="relative flex min-h-[min(68vh,760px)] w-full flex-col overflow-hidden rounded-[30px] bg-[#f6fafe] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3e7_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#cfe5ff]/45 blur-3xl" />
      <div className="relative z-10 mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#24a375]">
            Macro secuencia
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#001629]">
            Etapas de la obra
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#545f6e]">
            Orden macro de ejecución. Doble click para abrir una fase y descomponerla en plantas o sectores.
          </p>
        </div>
        {connectMode ? (
          <span className="rounded-full bg-[#d7e4f5] px-4 py-2 text-xs font-black text-[#0f3d66] shadow-sm">
            {pendingSourceId
              ? 'Elegí la etapa destino (derecha en el tiempo).'
              : 'Elegí la etapa origen (izquierda en el tiempo).'}
          </span>
        ) : null}
      </div>

      {ordered.length === 0 ? null : (
        <div className="relative z-10 flex-1 overflow-x-auto pb-3">
          <div className="flex min-h-[430px] min-w-min items-center gap-0 px-3">
            {ordered.map((n, idx) => {
              const st = statusStyle(n);
              const pct = progressValue(n);
              return (
              <div key={n.id} className="flex shrink-0 items-center">
                {idx > 0 && (
                  <div className="flex items-center px-2" aria-hidden>
                    <div className="h-px w-10 bg-[#bbc8d8]" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
                      <ChevronRight className="h-5 w-5 text-[#406182]" />
                    </div>
                    <div className="h-px w-10 bg-[#bbc8d8]" />
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
                    'group relative w-[min(330px,80vw)] overflow-hidden rounded-[28px] bg-white px-6 py-6 text-left shadow-[0_12px_32px_rgba(23,28,31,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(23,28,31,0.10)]',
                    selectedId === n.id && !connectMode
                      ? 'ring-2 ring-[#24a375] ring-offset-4 ring-offset-[#f6fafe]'
                      : 'ring-1 ring-[#c3c7ce]/25',
                    connectMode && pendingSourceId === n.id
                      ? 'ring-2 ring-amber-400 ring-offset-4 ring-offset-[#f6fafe]'
                      : null,
                  )}
                >
                  <div className={cn('absolute inset-x-0 top-0 h-1.5', st.line)} />
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', st.icon)}>
                      <Layers3 className="h-7 w-7" strokeWidth={1.6} />
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]', st.chip)}>
                      {labelEstadoNivel(n.estadoNivel)}
                    </span>
                  </div>
                  <span className="mt-7 block text-[10px] font-black uppercase tracking-[0.18em] text-[#8a94a5]">
                    {labelTipoNodo(n.type)} · {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-2 line-clamp-2 text-2xl font-black leading-tight tracking-[-0.04em] text-[#001629]">
                    {n.title}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f0f4f8] px-3 py-3">
                      <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-[#7f8b9b]">
                        Hijos
                      </span>
                      <span className="mt-1 block text-sm font-black text-[#001629]">
                        {childCount(n.id)}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-[#f0f4f8] px-3 py-3">
                      <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-[#7f8b9b]">
                        Avance
                      </span>
                      <span className="mt-1 block text-sm font-black text-[#001629]">
                        {pct}%
                      </span>
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
