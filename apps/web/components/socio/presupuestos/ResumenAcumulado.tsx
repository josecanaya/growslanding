'use client';

import { DollarSign, Calendar } from 'lucide-react';
import { formatPesos, formatArgentineNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface ResumenAcumuladoProps {
  totalDias: number;
  totalMonto: number;
  cantidadTareas: number;
  stitchMode?: boolean;
}

export function ResumenAcumulado({
  totalDias,
  totalMonto,
  cantidadTareas,
  stitchMode = false,
}: ResumenAcumuladoProps) {
  return (
    <div
      className={cn(
        'border-t-2 px-4 py-4',
        stitchMode
          ? 'border-stitch-primary/30 bg-stitch-primary/5'
          : 'border-emerald-200 bg-emerald-50 shadow-sm',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              stitchMode ? 'bg-stitch-primary/10' : 'bg-emerald-100',
            )}
          >
            <Calendar
              className={cn('h-5 w-5', stitchMode ? 'text-stitch-primary' : 'text-emerald-700')}
            />
          </div>
          <div>
            <div
              className={cn(
                'text-xs font-medium uppercase tracking-wide',
                stitchMode ? 'text-stitch-primary' : 'text-emerald-600',
              )}
            >
              Días totales
            </div>
            <div
              className={cn(
                'text-xl font-bold',
                stitchMode ? 'font-stitch-headline text-stitch-on-surface' : 'text-emerald-900',
              )}
            >
              {formatArgentineNumber(totalDias)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              stitchMode ? 'bg-stitch-primary/10' : 'bg-emerald-100',
            )}
          >
            <DollarSign
              className={cn('h-5 w-5', stitchMode ? 'text-stitch-primary' : 'text-emerald-700')}
            />
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-xs font-medium uppercase tracking-wide',
                stitchMode ? 'text-stitch-primary' : 'text-emerald-600',
              )}
            >
              Total
            </div>
            <div
              className={cn(
                'text-xl font-bold font-mono',
                stitchMode ? 'text-stitch-on-surface' : 'text-emerald-900',
              )}
            >
              {formatPesos(totalMonto)}
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'border-t pt-2 text-center',
          stitchMode ? 'border-stitch-primary/15' : 'border-emerald-200',
        )}
      >
        <span
          className={cn(
            'text-sm font-semibold',
            stitchMode ? 'text-stitch-on-surface' : 'text-emerald-800',
          )}
        >
          {cantidadTareas} {cantidadTareas === 1 ? 'tarea' : 'tareas'} seleccionadas
        </span>
      </div>
    </div>
  );
}

