'use client';

import { DollarSign, Calendar } from 'lucide-react';
import { formatPesos, formatArgentineNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface ResumenAcumuladoProps {
  totalDias: number;
  totalMonto: number;
  cantidadTareas: number;
  /** Partidas con monto + plazo completos (u enviadas/aprobadas) en la etapa activa */
  partidasCompletas?: number;
  partidasTotal?: number;
  stitchMode?: boolean;
}

export function ResumenAcumulado({
  totalDias,
  totalMonto,
  cantidadTareas,
  partidasCompletas,
  partidasTotal,
  stitchMode = false,
}: ResumenAcumuladoProps) {
  const showProgreso =
    partidasCompletas != null && partidasTotal != null && partidasTotal > 0;

  return (
    <div
      className={cn(
        'border-t px-4 py-3',
        stitchMode
          ? 'border-[#163274]/10 bg-[#f7f9fb]'
          : 'border-slate-200 bg-slate-50 shadow-sm',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn('rounded-lg p-1.5', stitchMode ? 'bg-[#163274]/10' : 'bg-slate-200')}>
            <Calendar className={cn('h-4 w-4', stitchMode ? 'text-[#163274]' : 'text-slate-700')} />
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                'text-[10px] font-bold uppercase tracking-wide text-slate-500',
                stitchMode && 'text-[#43617c]',
              )}
            >
              Días
            </div>
            <div
              className={cn(
                'text-lg font-bold tabular-nums leading-tight',
                stitchMode ? 'font-stitch-headline text-[#191c1e]' : 'text-slate-900',
              )}
            >
              {formatArgentineNumber(totalDias)}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-right">
          <div className="min-w-0">
            <div
              className={cn(
                'text-[10px] font-bold uppercase tracking-wide text-slate-500',
                stitchMode && 'text-[#43617c]',
              )}
            >
              Total
            </div>
            <div
              className={cn(
                'truncate text-lg font-bold font-mono leading-tight',
                stitchMode ? 'text-[#191c1e]' : 'text-slate-900',
              )}
            >
              {formatPesos(totalMonto)}
            </div>
          </div>
          <div className={cn('rounded-lg p-1.5', stitchMode ? 'bg-[#163274]/10' : 'bg-slate-200')}>
            <DollarSign className={cn('h-4 w-4', stitchMode ? 'text-[#163274]' : 'text-slate-700')} />
          </div>
        </div>
      </div>
      {showProgreso ? (
        <div className={cn('mb-2 border-b pb-2', stitchMode ? 'border-[#163274]/10' : 'border-slate-200')}>
          <div className="mb-1 flex justify-between text-[10px] font-semibold text-slate-500">
            <span>Progreso</span>
            <span className="tabular-nums text-[#163274]">
              {partidasCompletas}/{partidasTotal}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className={cn('h-full rounded-full transition-all', stitchMode ? 'bg-[#163274]' : 'bg-slate-700')}
              style={{ width: `${Math.min(100, Math.round((partidasCompletas! / partidasTotal!) * 100))}%` }}
            />
          </div>
        </div>
      ) : null}
      <p
        className={cn(
          'text-center text-[11px] font-medium text-slate-500',
          stitchMode && 'text-[#43617c]',
        )}
      >
        {cantidadTareas} {cantidadTareas === 1 ? 'partida' : 'partidas'} en esta etapa
      </p>
    </div>
  );
}
