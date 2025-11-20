'use client';

import { DollarSign, Calendar } from 'lucide-react';
import { formatPesos, formatArgentineNumber } from '@/lib/utils/format';

interface ResumenAcumuladoProps {
  totalDias: number;
  totalMonto: number;
  cantidadTareas: number;
}

export function ResumenAcumulado({
  totalDias,
  totalMonto,
  cantidadTareas,
}: ResumenAcumuladoProps) {
  return (
    <div className="bg-emerald-50 border-t-2 border-emerald-200 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Calendar className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Días totales</div>
            <div className="text-xl font-bold text-emerald-900">
              {formatArgentineNumber(totalDias)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Total</div>
            <div className="text-xl font-bold text-emerald-900 font-mono">
              {formatPesos(totalMonto)}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center pt-2 border-t border-emerald-200">
        <span className="text-sm font-semibold text-emerald-800">
          {cantidadTareas} {cantidadTareas === 1 ? 'tarea' : 'tareas'} seleccionadas
        </span>
      </div>
    </div>
  );
}

