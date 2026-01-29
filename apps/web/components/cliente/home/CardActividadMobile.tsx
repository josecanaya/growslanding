'use client';

import { ArrowRight } from 'lucide-react';

interface Actividad {
  tareasCompletadasPorSemana: Array<{ semana: number; completadas: number; planificadas: number }>;
}

interface CardActividadMobileProps {
  actividad: Actividad;
  periodRange: number;
  onVerActividad: () => void;
}

export function CardActividadMobile({
  actividad,
  periodRange,
  onVerActividad,
}: CardActividadMobileProps) {
  const { tareasCompletadasPorSemana } = actividad;
  const totalSemanas = tareasCompletadasPorSemana.length;
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const datosFiltrados = tareasCompletadasPorSemana.slice(inicioSlice);

  // Calcular estado y desvío
  const ultimaReal = tareasCompletadasPorSemana[tareasCompletadasPorSemana.length - 1]?.completadas || 0;
  const ultimaPlanificada = tareasCompletadasPorSemana[tareasCompletadasPorSemana.length - 1]?.planificadas || 0;
  const desvio = ultimaReal - ultimaPlanificada;

  // Calcular ritmo (últimas 4 semanas)
  const ultimas4 = datosFiltrados.slice(-4);
  const ritmo = ultimas4.length > 1
    ? (ultimas4[ultimas4.length - 1].completadas - ultimas4[0].completadas) / (ultimas4.length - 1)
    : 0;

  // Mini chart (120-140px)
  const height = 120;
  const width = 200;
  const sparklineData = datosFiltrados.slice(-8);
  const maxSparkline = Math.max(...sparklineData.map((d) => Math.max(d.completadas, d.planificadas)), 1);
  const minSparkline = Math.min(...sparklineData.map((d) => Math.min(d.completadas, d.planificadas)), 0);
  const rangeSparkline = maxSparkline - minSparkline || 1;

  // Crear path para sparkline
  const puntos = sparklineData.map((dato, index) => {
    const x = (index / (sparklineData.length - 1 || 1)) * width;
    const y = height - ((dato.completadas - minSparkline) / rangeSparkline) * height;
    return { x, y };
  });

  const pathData = puntos.reduce((acc, punto, index) => {
    if (index === 0) return `M ${punto.x} ${punto.y}`;
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');

  // Área bajo la línea
  const primerPunto = puntos[0];
  const ultimoPunto = puntos[puntos.length - 1];
  const pathArea = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/70 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Actividad</h3>
        <button
          onClick={onVerActividad}
          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
        >
          Ver actividad
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Mini chart */}
      <div className="h-[120px] mb-3 bg-gray-50 border border-gray-200/60 rounded-xl p-3">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="actividadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Área */}
          <path d={pathArea} fill="url(#actividadGradient)" />
          {/* Línea */}
          <path
            d={pathData}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Insight */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          Ritmo: <span className="font-medium text-gray-900">{ritmo.toFixed(1)}/sem</span>
          <span className="text-gray-500 ml-1">(igual)</span>
        </div>
        <div className={`text-xs font-medium ${desvio < 0 ? 'text-amber-700' : 'text-gray-600'}`}>
          Desvío: {desvio >= 0 ? '+' : ''}{desvio}
        </div>
      </div>
    </div>
  );
}

