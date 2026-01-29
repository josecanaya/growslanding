'use client';

import { ArrowRight } from 'lucide-react';

interface Tareas {
  enCurso: number;
  paraValidar: number;
  completadas: number;
  bloqueadas: number;
  total: number;
  vencidas: number;
  proximas7d: number;
  ritmoPromedio: number;
  last2WeeksCompleted: number;
  prev2WeeksCompleted: number;
}

interface CardTareasMobileProps {
  tareas: Tareas;
  periodRange: number;
  onVerTareas: () => void;
}

export function CardTareasMobile({
  tareas,
  periodRange,
  onVerTareas,
}: CardTareasMobileProps) {
  const porcentajeCompletadas = (tareas.completadas / tareas.total) * 100;
  const porcentajeEnCurso = (tareas.enCurso / tareas.total) * 100;
  const porcentajeParaValidar = (tareas.paraValidar / tareas.total) * 100;
  const porcentajeBloqueadas = (tareas.bloqueadas / tareas.total) * 100;

  // Donut 72-74px
  const size = 74;
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 6;

  // Calcular offsets acumulativos
  const segmentos = [];
  let offsetAcumulado = 0;

  if (porcentajeCompletadas > 0) {
    segmentos.push({
      porcentaje: porcentajeCompletadas,
      color: '#10B981',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeCompletadas;
  }

  if (porcentajeEnCurso > 0) {
    segmentos.push({
      porcentaje: porcentajeEnCurso,
      color: '#3B82F6',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeEnCurso;
  }

  if (porcentajeParaValidar > 0) {
    segmentos.push({
      porcentaje: porcentajeParaValidar,
      color: '#F59E0B',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeParaValidar;
  }

  if (tareas.bloqueadas > 0 && porcentajeBloqueadas > 0) {
    segmentos.push({
      porcentaje: porcentajeBloqueadas,
      color: '#EF4444',
      offset: offsetAcumulado,
    });
  }

  const delta = tareas.last2WeeksCompleted - tareas.prev2WeeksCompleted;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Tareas</h3>
        <button
          onClick={onVerTareas}
          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver tablero
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />
            {segmentos.map((seg, idx) => {
              const strokeDasharray = `${(seg.porcentaje / 100) * circumference} ${circumference}`;
              const strokeDashoffset = `-${(seg.offset / 100) * circumference}`;
              return (
                <circle
                  key={`${seg.color}-${idx}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-lg font-semibold text-gray-900">{tareas.total}</div>
            {delta !== 0 && (
              <div className={`text-[10px] font-medium ${delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {delta >= 0 ? '+' : ''}{delta} últ. 2 sem
              </div>
            )}
          </div>
        </div>

        {/* Lista mini */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">En curso</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.enCurso}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Validar</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.paraValidar}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">Completadas</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.completadas}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

