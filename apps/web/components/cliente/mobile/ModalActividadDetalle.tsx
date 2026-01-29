'use client';

import { X } from 'lucide-react';
import { PeriodSelectorGlobal } from '@/components/cliente/home/PeriodSelectorGlobal';

interface Actividad {
  tareasCompletadasPorSemana: Array<{ semana: number; completadas: number; planificadas: number }>;
  milestones?: Array<{ semana: number; nombre: string }>;
}

interface ModalActividadDetalleProps {
  isOpen: boolean;
  onClose: () => void;
  actividad: Actividad;
  periodRange: number;
  onPeriodChange: (range: number) => void;
  onVerTareasSemana: (semana: number) => void;
}

export function ModalActividadDetalle({
  isOpen,
  onClose,
  actividad,
  periodRange,
  onPeriodChange,
  onVerTareasSemana,
}: ModalActividadDetalleProps) {
  if (!isOpen) return null;

  const { tareasCompletadasPorSemana, milestones = [] } = actividad;
  const totalSemanas = tareasCompletadasPorSemana.length;
  const inicioSlice = periodRange >= totalSemanas ? 0 : totalSemanas - periodRange;
  const datosFiltrados = tareasCompletadasPorSemana.slice(inicioSlice);

  // Calcular puntos para el gráfico
  const semanas = datosFiltrados.map((d) => d.semana);
  const completadas = datosFiltrados.map((d) => d.completadas);
  const planificadas = datosFiltrados.map((d) => d.planificadas);

  const maxValor = Math.max(...completadas, ...planificadas, 1);
  const minValor = 0;

  // Dimensiones
  const viewBoxWidth = 400;
  const viewBoxHeight = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;

  // Puntos para líneas
  const puntosReal = completadas.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanas.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minValor) / (maxValor - minValor)) * chartHeight;
    return { x, y, cantidad, semana: semanas[index] };
  });

  const puntosPlan = planificadas.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanas.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minValor) / (maxValor - minValor)) * chartHeight;
    return { x, y, cantidad };
  });

  // Paths
  const pathReal = puntosReal.reduce((acc, punto, index) => {
    if (index === 0) return `M ${punto.x} ${punto.y}`;
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');

  const pathPlan = puntosPlan.reduce((acc, punto, index) => {
    if (index === 0) return `M ${punto.x} ${punto.y}`;
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');

  // Área bajo la línea real
  const primerPunto = puntosReal[0];
  const ultimoPunto = puntosReal[puntosReal.length - 1];
  const pathArea = `${pathReal} L ${ultimoPunto.x} ${paddingTop + chartHeight} L ${primerPunto.x} ${paddingTop + chartHeight} Z`;

  // Hitos en el rango visible
  const hitosVisibles = milestones.filter((m) => semanas.includes(m.semana));

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 p-0">
      <div className="w-full h-[90vh] md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Actividad de la obra</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selector de período */}
          <PeriodSelectorGlobal
            periodRange={periodRange}
            totalSemanas={totalSemanas}
            onPeriodChange={onPeriodChange}
          />

          {/* Gráfico completo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
              <svg
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="absolute inset-0 w-full h-full"
              >
                {/* Defs */}
                <defs>
                  <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingTop + chartHeight - ratio * chartHeight;
                  return (
                    <line
                      key={ratio}
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + chartWidth}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                      opacity="0.5"
                    />
                  );
                })}

                {/* Área bajo línea real */}
                <path d={pathArea} fill="url(#activityGradient)" />

                {/* Línea planificada (discontinua) */}
                <path
                  d={pathPlan}
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Línea real (continua) */}
                <path
                  d={pathReal}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Puntos interactivos */}
                {puntosReal.map((punto, index) => (
                  <circle
                    key={index}
                    cx={punto.x}
                    cy={punto.y}
                    r="4"
                    fill="#10B981"
                    className="cursor-pointer hover:r-6 transition-all"
                    onClick={() => onVerTareasSemana(punto.semana)}
                  />
                ))}

                {/* Hitos */}
                {hitosVisibles.map((hito) => {
                  const index = semanas.indexOf(hito.semana);
                  if (index === -1) return null;
                  const punto = puntosReal[index];
                  return (
                    <g key={hito.semana}>
                      <circle
                        cx={punto.x}
                        cy={punto.y}
                        r="6"
                        fill="#6366F1"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-pointer"
                        onClick={() => onVerTareasSemana(hito.semana)}
                      />
                      <text
                        x={punto.x}
                        y={punto.y - 10}
                        fontSize="8"
                        fill="#6366F1"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {hito.nombre}
                      </text>
                    </g>
                  );
                })}

                {/* Eje Y labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = paddingTop + chartHeight - ratio * chartHeight;
                  const valor = Math.round(minValor + ratio * (maxValor - minValor));
                  return (
                    <text
                      key={`y-${ratio}`}
                      x={paddingLeft - 5}
                      y={y + 3}
                      fontSize="10"
                      fill="#6B7280"
                      textAnchor="end"
                    >
                      {valor}
                    </text>
                  );
                })}

                {/* Eje X labels */}
                {semanas.map((semana, index) => {
                  if (index % Math.ceil(semanas.length / 8) !== 0 && index !== semanas.length - 1)
                    return null;
                  const x = paddingLeft + (index / Math.max(semanas.length - 1, 1)) * chartWidth;
                  return (
                    <text
                      key={`x-${semana}`}
                      x={x}
                      y={viewBoxHeight - paddingBottom + 15}
                      fontSize="9"
                      fill="#6B7280"
                      textAnchor="middle"
                    >
                      S{semana}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-emerald-600 rounded-full" />
              <span className="text-gray-600">Real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t border-dashed border-gray-400" />
              <span className="text-gray-600">Planificado</span>
            </div>
            {hitosVisibles.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border-2 border-indigo-500 bg-white" />
                <span className="text-gray-600">Hitos</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

