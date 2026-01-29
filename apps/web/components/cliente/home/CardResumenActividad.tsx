'use client';

import { ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

interface CardResumenActividadProps {
  obraId?: string | null;
  ritmoPlan: number;
  ritmoReal: number;
  desvio: number;
  datosActividad?: Array<{ fecha: string; valor: number }>;
}

export function CardResumenActividad({
  obraId,
  ritmoPlan,
  ritmoReal,
  desvio,
  datosActividad = [],
}: CardResumenActividadProps) {
  const router = useRouter();

  const handleVerTablero = () => {
    if (obraId) {
      router.push(`/cliente/obras?obraId=${obraId}` as Route);
    } else {
      router.push('/cliente/obras' as Route);
    }
  };

  const tieneDatos = datosActividad.length > 0;
  const ritmoDiferencia = ritmoReal - ritmoPlan;
  const ritmoDireccion = ritmoDiferencia >= 0 ? 'up' : 'down';

  // Generar puntos para el gráfico
  const maxValue = Math.max(...datosActividad.map(d => d.valor), 1);
  const puntos = datosActividad.map(d => ({
    x: datosActividad.indexOf(d),
    y: (d.valor / maxValue) * 100,
  }));

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Actividad</h4>
        <button
          onClick={handleVerTablero}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
        >
          Ver tablero <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {tieneDatos && puntos.length > 0 ? (
        <>
          {/* Mini gráfico línea + área */}
          <div className="h-16 mb-3 relative">
            <svg className="w-full h-full" viewBox={`0 0 ${Math.max(puntos.length * 20, 100)} 100`} preserveAspectRatio="none">
              {/* Área suave */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {puntos.length > 0 && (
                <>
                  <path
                    d={`M 0,100 ${puntos.map(p => `L ${p.x * 20},${100 - p.y}`).join(' ')} L ${(puntos.length - 1) * 20},100 Z`}
                    fill="url(#areaGradient)"
                  />
                  <path
                    d={`M 0,${100 - puntos[0]?.y || 100} ${puntos.slice(1).map(p => `L ${p.x * 20},${100 - p.y}`).join(' ')}`}
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                  />
                </>
              )}
            </svg>
          </div>

          {/* KPIs */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">Ritmo:</span>
              <span className="font-semibold text-gray-900">{ritmoReal}/sem</span>
              {ritmoDireccion === 'up' ? (
                <ArrowUp className="h-3 w-3 text-emerald-600" />
              ) : (
                <ArrowDown className="h-3 w-3 text-amber-600" />
              )}
            </div>
            <div className="text-xs text-gray-600">
              Desvío: <span className={desvio >= 0 ? 'text-emerald-700' : 'text-amber-700'}>{desvio >= 0 ? '+' : ''}{desvio}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-6 text-center">
          <p className="text-xs text-gray-500 mb-3">Aún no hay avances registrados</p>
          <button
            onClick={() => router.push('/cliente/obras/nueva' as Route)}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Crear tarea
          </button>
        </div>
      )}
    </div>
  );
}
