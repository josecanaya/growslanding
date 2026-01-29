'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

interface CardResumenTareasProps {
  obraId?: string | null;
  tareasPendientes: number;
  tareasVencidas: number;
  tareasProximas7d: number;
  completadasUltimos7d?: number[];
}

export function CardResumenTareas({
  obraId,
  tareasPendientes,
  tareasVencidas,
  tareasProximas7d,
  completadasUltimos7d = [],
}: CardResumenTareasProps) {
  const router = useRouter();

  const handleVerTareas = () => {
    if (obraId) {
      router.push(`/cliente/dashboard?section=tareas&obraId=${obraId}` as Route);
    } else {
      router.push('/cliente/dashboard?section=tareas' as Route);
    }
  };

  // Generar datos para sparkline (normalizados)
  const maxValue = Math.max(...completadasUltimos7d, 1);
  const sparklineData = completadasUltimos7d.map(val => (val / maxValue) * 100);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Tareas</h4>
        <button
          onClick={handleVerTareas}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
        >
          Ver tareas <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Número grande */}
      <div className="text-2xl font-semibold text-gray-900 mb-3">
        {tareasPendientes}
      </div>

      {/* Chips */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {tareasVencidas > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-red-50 text-xs font-medium text-red-700">
            Vencidas {tareasVencidas}
          </div>
        )}
        {tareasProximas7d > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-amber-50 text-xs font-medium text-amber-700">
            Próx 7d {tareasProximas7d}
          </div>
        )}
      </div>

      {/* Micro sparkline */}
      {sparklineData.length > 0 ? (
        <div className="h-8 flex items-end gap-0.5">
          {sparklineData.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t"
              style={{ height: `${Math.max(height, 4)}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="h-8 flex items-center text-[10px] text-gray-400">
          Sin datos recientes
        </div>
      )}
    </div>
  );
}
