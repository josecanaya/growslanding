'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

interface CardResumenEscrowProps {
  ejecutado: number;
  aprobado: number;
  semanasSinEjecucion: number;
  formatCurrency: (v: number) => string;
}

export function CardResumenEscrow({
  ejecutado,
  aprobado,
  semanasSinEjecucion,
  formatCurrency,
}: CardResumenEscrowProps) {
  const router = useRouter();

  const handleVerPresupuesto = () => {
    router.push('/cliente/dashboard?section=billetera' as Route);
  };

  const porcentaje = aprobado > 0 ? Math.round((ejecutado / aprobado) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Escrow</h4>
        <button
          onClick={handleVerPresupuesto}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
        >
          Ver presupuesto <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Número grande */}
      <div className="text-2xl font-semibold text-gray-900 mb-2">
        {formatCurrency(ejecutado)} / {formatCurrency(aprobado)}
      </div>

      {/* Barra horizontal mini */}
      <div className="h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-emerald-600 rounded-full transition-all"
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>

      {/* Texto mínimo */}
      <div className="text-xs text-gray-600">
        Semanas sin ejecución: {semanasSinEjecucion}
      </div>
    </div>
  );
}
