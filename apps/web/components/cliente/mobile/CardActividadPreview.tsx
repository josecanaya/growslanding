'use client';

interface Actividad {
  tareasCompletadasPorSemana: Array<{ semana: number; completadas: number; planificadas: number }>;
}

interface CardActividadPreviewProps {
  actividad: Actividad;
  periodRange: number;
  onVerActividad: () => void;
}

export function CardActividadPreview({
  actividad,
  periodRange,
  onVerActividad,
}: CardActividadPreviewProps) {
  const { tareasCompletadasPorSemana } = actividad;
  const totalSemanas = tareasCompletadasPorSemana.length;
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const datosFiltrados = tareasCompletadasPorSemana.slice(inicioSlice);

  // Calcular estado y desvío
  const ultimaReal = tareasCompletadasPorSemana[tareasCompletadasPorSemana.length - 1]?.completadas || 0;
  const ultimaPlanificada = tareasCompletadasPorSemana[tareasCompletadasPorSemana.length - 1]?.planificadas || 0;
  const desvio = ultimaReal - ultimaPlanificada;

  let estadoTexto = 'Dentro del plan';
  let estadoColor = 'text-emerald-600';
  if (desvio < -6) {
    estadoTexto = 'Retraso acumulado';
    estadoColor = 'text-red-600';
  } else if (desvio < -2) {
    estadoTexto = 'Requiere atención';
    estadoColor = 'text-amber-600';
  } else if (desvio > 2) {
    estadoTexto = 'Adelanto';
    estadoColor = 'text-emerald-600';
  }

  // Sparkline: últimos 8 datos
  const sparklineData = datosFiltrados.slice(-8);
  const maxSparkline = Math.max(...sparklineData.map((d) => Math.max(d.completadas, d.planificadas)), 1);
  const minSparkline = Math.min(...sparklineData.map((d) => Math.min(d.completadas, d.planificadas)), 0);
  const rangeSparkline = maxSparkline - minSparkline || 1;

  // Crear path para sparkline
  const width = 120;
  const height = 30;
  const puntos = sparklineData.map((dato, index) => {
    const x = (index / (sparklineData.length - 1 || 1)) * width;
    const y = height - ((dato.completadas - minSparkline) / rangeSparkline) * height;
    return { x, y };
  });

  const pathData = puntos.reduce((acc, punto, index) => {
    if (index === 0) return `M ${punto.x} ${punto.y}`;
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');

  return (
    <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-900">Actividad</h3>
        <button
          onClick={onVerActividad}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700"
        >
          Ver actividad →
        </button>
      </div>

      {/* Estado y desvío */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className={`text-xs font-semibold ${estadoColor}`}>{estadoTexto}</div>
          <div className="text-[10px] text-gray-600">
            Desvío: {desvio >= 0 ? '+' : ''}
            {desvio} tareas
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900">{ultimaReal}</div>
          <div className="text-[10px] text-gray-500">acumuladas</div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-10 flex items-center justify-center bg-gray-50 rounded mb-2">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Área bajo la línea */}
          <path
            d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
            fill="url(#sparklineGradient)"
            opacity="0.2"
          />
          {/* Línea */}
          <path
            d={pathData}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Defs para gradiente */}
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Indicador de período */}
      <div className="pt-2 border-t border-gray-100">
        <span className="text-[9px] text-gray-500">
          Mostrando {periodRange >= totalSemanas ? 'Total' : `${periodRange} sem`}
        </span>
      </div>
    </div>
  );
}




