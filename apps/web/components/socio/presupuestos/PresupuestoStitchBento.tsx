'use client';

import { Clock, Wallet } from 'lucide-react';
import { formatPesos, formatArgentineNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

type BentoVariant = 'stitch' | 'slate';

export type PresupuestoStitchBentoProps = {
  titulo: string;
  totalMonto: number;
  totalDias: number;
  partidasEnEtapa?: number;
  partidasCompletas?: number;
  estadoPaquete?: string;
  variant?: BentoVariant;
  isDemo?: boolean;
};

/** Resumen único tipo dashboard (mobile-first, sin rejilla recargada). */
export function PresupuestoStitchBento({
  titulo,
  totalMonto,
  totalDias,
  partidasEnEtapa,
  partidasCompletas,
  estadoPaquete,
  variant = 'stitch',
  isDemo = false,
}: PresupuestoStitchBentoProps) {
  const stitch = variant === 'stitch';
  const total = partidasEnEtapa ?? 0;
  const ok = partidasCompletas ?? 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border shadow-[0_12px_40px_rgba(22,50,116,0.08)]',
        stitch ? 'border-[#163274]/12 bg-white' : 'border-slate-200 bg-white',
      )}
    >
      <div
        className={cn(
          'px-5 py-4 text-white',
          stitch ? 'bg-gradient-to-br from-[#163274] to-[#314a8d]' : 'bg-slate-800',
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-85">Total presupuesto (etapa)</p>
        <p className={cn('mt-1 text-3xl font-black tabular-nums', stitch && 'font-stitch-headline')}>
          {formatPesos(totalMonto)}
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm font-semibold opacity-95">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Plazo acumulado: {formatArgentineNumber(totalDias)} días</span>
        </div>
      </div>
      <div className={cn('space-y-3 px-5 py-4 text-sm', stitch ? 'text-[#434653]' : 'text-slate-600')}>
        <div className="flex justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">Obra</span>
          <span className="max-w-[60%] truncate text-right font-bold text-[#163274]">{titulo}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">Partidas en etapa</span>
          <span className="font-bold text-[#163274]">{total > 0 ? total : '—'}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-xs font-medium text-slate-500">Cargadas / listas</span>
          <span className="font-bold tabular-nums text-[#163274]">
            {total > 0 ? `${ok}/${total}` : '—'}
          </span>
        </div>
        {estadoPaquete ? (
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">Estado</span>
            <span className="rounded-full bg-[#f2f4f6] px-3 py-0.5 text-xs font-bold text-[#163274]">
              {estadoPaquete}
            </span>
          </div>
        ) : null}
        <div
          className={cn(
            'flex items-start gap-2 rounded-2xl p-3 text-xs leading-snug',
            stitch ? 'bg-[#f2f4f6] text-[#434653]' : 'bg-slate-50 text-slate-600',
          )}
        >
          <Wallet className={cn('mt-0.5 h-4 w-4 shrink-0', stitch ? 'text-[#163274]' : 'text-slate-700')} />
          {isDemo
            ? 'Demo: los valores no se guardan en servidor.'
            : 'Abrí cada partida abajo para cargar monto y plazo. Enviá cuando esté listo.'}
        </div>
      </div>
    </div>
  );
}
