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
}

interface CardTareasCompactProps {
  tareas: Tareas;
  periodRange: number;
  onVerTareas: () => void;
}

export function CardTareasCompact({
  tareas,
  periodRange,
  onVerTareas,
}: CardTareasCompactProps) {
  // Calcular porcentajes para el donut (sin NaN cuando total === 0)
  const totalSeguro = Math.max(tareas.total, 1);
  const porcentajeCompletadas = (tareas.completadas / totalSeguro) * 100;
  const porcentajeEnCurso = (tareas.enCurso / totalSeguro) * 100;
  const porcentajeParaValidar = (tareas.paraValidar / totalSeguro) * 100;
  const porcentajeBloqueadas = (tareas.bloqueadas / totalSeguro) * 100;

  // Donut mini SVG
  const size = 60;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 6;

  // Calcular offsets acumulativos para segmentos
  const segmentos = [];
  let offsetAcumulado = 0;
  
  // Completadas primero (verde)
  if (porcentajeCompletadas > 0) {
    segmentos.push({
      porcentaje: porcentajeCompletadas,
      color: '#10B981',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeCompletadas;
  }
  
  // En curso (azul)
  if (porcentajeEnCurso > 0) {
    segmentos.push({
      porcentaje: porcentajeEnCurso,
      color: '#3B82F6',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeEnCurso;
  }
  
  // Para validar (amarillo)
  if (porcentajeParaValidar > 0) {
    segmentos.push({
      porcentaje: porcentajeParaValidar,
      color: '#F59E0B',
      offset: offsetAcumulado,
    });
    offsetAcumulado += porcentajeParaValidar;
  }
  
  // Bloqueadas (rojo) - solo si > 0
  if (tareas.bloqueadas > 0 && porcentajeBloqueadas > 0) {
    segmentos.push({
      porcentaje: porcentajeBloqueadas,
      color: '#EF4444',
      offset: offsetAcumulado,
    });
  }

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-900">Tareas</h3>
        <button
          onClick={onVerTareas}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Ver tablero
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* Donut mini */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Fondo gris */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
            />
            {/* Segmentos */}
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-bold text-gray-900">{tareas.total}</div>
              <div className="text-[8px] text-gray-500">total</div>
            </div>
          </div>
        </div>

        {/* Chips de estado */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-600">En curso</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.enCurso}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-gray-600">Validar</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.paraValidar}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-600">Completadas</span>
            </div>
            <span className="text-xs font-semibold text-gray-900">{tareas.completadas}</span>
          </div>
        </div>
      </div>

      {/* KPIs compactos */}
      <div className="space-y-1 pt-2 border-t border-gray-100">
        {tareas.vencidas > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Vencidas</span>
            <span className="text-xs font-semibold text-red-600">{tareas.vencidas}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">Próximas 7d</span>
          <span className="text-xs font-semibold text-blue-600">{tareas.proximas7d}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">Ritmo</span>
          <span className="text-xs font-semibold text-gray-900">
            {tareas.ritmoPromedio.toFixed(1)} t/sem
          </span>
        </div>
      </div>

      {/* Indicador de período */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <span className="text-[9px] text-gray-500">
          Mostrando {periodRange >= 24 ? 'Total' : `${periodRange} sem`}
        </span>
      </div>
    </div>
  );
}

