'use client';

import { useState } from 'react';

interface TasksChartProps {
  tareas: { 
    enCurso: number; 
    paraValidar: number; 
    completadas: number;
    bloqueadas?: number;
    total?: number;
    vencidas?: number;
    proximas7d?: number;
    ritmoPromedio?: number;
    weeklyCompleted?: number[];
    last2WeeksCompleted?: number;
    prev2WeeksCompleted?: number;
  };
  rangoTemporal?: number;
  obraId?: string;
  onSegmentClick?: (estado: string) => void;
}

export function TasksChart({ 
  tareas, 
  rangoTemporal,
  obraId,
  onSegmentClick
}: TasksChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  // Valores por defecto si no están en tareas
  const bloqueadas = tareas.bloqueadas || 0;
  const total = tareas.total || (tareas.enCurso + tareas.paraValidar + tareas.completadas + bloqueadas);
  const vencidas = tareas.vencidas || 0;
  const proximas7d = tareas.proximas7d || 0;
  const ritmoPromedio = tareas.ritmoPromedio || 0;
  const weeklyCompleted = tareas.weeklyCompleted || [];
  const last2WeeksCompleted = tareas.last2WeeksCompleted || 0;
  const prev2WeeksCompleted = tareas.prev2WeeksCompleted || 0;
  const deltaCompletadas = last2WeeksCompleted - prev2WeeksCompleted;
  
  // Calcular porcentajes
  const circunferencia = 2 * Math.PI * 50; // Radio 50 para donut más grande
  const completadasPct = total > 0 ? tareas.completadas / total : 0;
  const enCursoPct = total > 0 ? tareas.enCurso / total : 0;
  const paraValidarPct = total > 0 ? tareas.paraValidar / total : 0;
  const bloqueadasPct = total > 0 ? bloqueadas / total : 0;
  
  // Colores profesionales y sutiles
  const colors = {
    completadas: '#10B981', // verde emerald-500
    enCurso: '#3B82F6', // azul blue-500
    paraValidar: '#F59E0B', // amarillo amber-500
    bloqueadas: '#EF4444', // rojo red-500
    background: '#F3F4F6' // gris muy claro
  };
  
  // Calcular offsets para segmentos del donut
  const segmentos = [
    { nombre: 'completadas', pct: completadasPct, color: colors.completadas, cantidad: tareas.completadas, offset: 0 },
    { nombre: 'enCurso', pct: enCursoPct, color: colors.enCurso, cantidad: tareas.enCurso, offset: completadasPct },
    { nombre: 'paraValidar', pct: paraValidarPct, color: colors.paraValidar, cantidad: tareas.paraValidar, offset: completadasPct + enCursoPct },
  ];
  
  // Solo agregar bloqueadas si > 0
  if (bloqueadas > 0) {
    segmentos.push({ 
      nombre: 'bloqueadas', 
      pct: bloqueadasPct, 
      color: colors.bloqueadas, 
      cantidad: bloqueadas, 
      offset: completadasPct + enCursoPct + paraValidarPct 
    });
  }
  
  // Calcular micro-insight
  const totalTrabadas = tareas.paraValidar + bloqueadas;
  let insightTexto = 'Flujo estable: buen ritmo de avance.';
  let insightColor = 'text-emerald-600';
  
  if (vencidas > 0) {
    insightTexto = `Tenés ${vencidas} tarea${vencidas > 1 ? 's' : ''} vencida${vencidas > 1 ? 's' : ''}.`;
    insightColor = vencidas > 3 ? 'text-red-600' : 'text-amber-600';
  } else if (totalTrabadas > 3) {
    insightTexto = 'Hay tareas trabadas: revisá validaciones.';
    insightColor = 'text-amber-600';
  }
  
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
        {/* Donut Principal */}
        <div className="relative flex-shrink-0">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <svg className="transform -rotate-90" width="128" height="128" viewBox="0 0 128 128">
              {/* Fondo */}
              <circle cx="64" cy="64" r="50" fill="none" stroke={colors.background} strokeWidth="12" />
              
              {/* Segmentos del donut */}
              {segmentos.map((seg, idx) => {
                if (seg.pct <= 0) return null;
                const dashArray = `${seg.pct * circunferencia} ${circunferencia}`;
                const dashOffset = `-${seg.offset * circunferencia}`;
                
                return (
                  <circle
                    key={seg.nombre}
                    cx="64"
                    cy="64"
                    r="50"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-opacity"
                    style={{ 
                      opacity: hoveredSegment === null || hoveredSegment === seg.nombre ? 1 : 0.3
                    }}
                    onMouseEnter={(e) => {
                      setHoveredSegment(seg.nombre);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                      if (svgRect) {
                        setTooltipPos({
                          x: e.clientX - svgRect.left,
                          y: e.clientY - svgRect.top
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredSegment(null);
                      setTooltipPos(null);
                    }}
                    onClick={() => {
                      if (onSegmentClick) {
                        const estadoMap: { [key: string]: string } = {
                          completadas: 'completadas',
                          enCurso: 'en_curso',
                          paraValidar: 'para_validar',
                          bloqueadas: 'bloqueadas'
                        };
                        onSegmentClick(estadoMap[seg.nombre] || seg.nombre);
                      }
                    }}
                  />
                );
              })}
            </svg>
            
            {/* Centro del donut - texto informativo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] md:text-xs text-gray-500 font-medium mb-0.5">Total</div>
              <div className="text-lg md:text-2xl font-semibold text-gray-900">{total}</div>
              {deltaCompletadas !== 0 && (
                <div className="text-[9px] md:text-[10px] text-gray-500 mt-0.5">
                  últ. 2 sem:
                  <span className={`font-semibold ml-1 ${deltaCompletadas >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {deltaCompletadas >= 0 ? '+' : ''}{deltaCompletadas}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Tooltip en hover */}
          {hoveredSegment && tooltipPos && (() => {
            const seg = segmentos.find(s => s.nombre === hoveredSegment);
            if (!seg) return null;
            return (
              <div
                className="absolute z-50 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-1.5 md:p-2 pointer-events-none min-w-[120px] md:min-w-[140px]"
                style={{
                  left: `${tooltipPos.x + 10}px`,
                  top: `${tooltipPos.y - 10}px`,
                  transform: 'translateY(-100%)'
                }}
              >
                <div className="text-[10px] md:text-xs font-semibold text-gray-300 mb-1 capitalize">
                  {hoveredSegment === 'enCurso' ? 'En curso' : 
                   hoveredSegment === 'paraValidar' ? 'Para validar' : 
                   hoveredSegment}
                </div>
                <div className="text-xs text-gray-400">
                  <div>Cantidad: <span className="font-semibold text-white">{seg.cantidad}</span></div>
                  <div>% sobre total: <span className="font-semibold text-white">{(seg.pct * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            );
          })()}
        </div>
        
        {/* Panel lateral - resumen accionable */}
        <div className="flex-1 w-full md:w-auto space-y-3">
          {/* Lista de estados con links */}
          <div className="space-y-2">
            {/* En curso */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.enCurso }} />
                <span className="text-xs font-medium text-gray-700">En curso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.enCurso}</span>
                <button
                  onClick={() => obraId && onSegmentClick?.('en_curso')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Ver →
                </button>
              </div>
            </div>
            
            {/* Para validar */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.paraValidar }} />
                <span className="text-xs font-medium text-gray-700">Para validar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.paraValidar}</span>
                {tareas.paraValidar > 0 && (
                  <button
                    onClick={() => obraId && onSegmentClick?.('para_validar')}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Revisar →
                  </button>
                )}
              </div>
            </div>
            
            {/* Completadas */}
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.completadas }} />
                <span className="text-xs font-medium text-gray-700">Completadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{tareas.completadas}</span>
                <button
                  onClick={() => obraId && onSegmentClick?.('completadas')}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Historial →
                </button>
              </div>
            </div>
            
            {/* Bloqueadas (solo si > 0) */}
            {bloqueadas > 0 && (
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bloqueadas }} />
                  <span className="text-xs font-medium text-gray-700">Bloqueadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{bloqueadas}</span>
                  <button
                    onClick={() => obraId && onSegmentClick?.('bloqueadas')}
                    className="text-xs text-red-600 hover:text-red-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Resolver →
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Métricas adicionales */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            {vencidas > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Tareas vencidas</span>
                <span className={`text-xs font-semibold ${vencidas > 3 ? 'text-red-600' : 'text-amber-600'}`}>
                  {vencidas}
                </span>
              </div>
            )}
            {proximas7d > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Próximas 7 días</span>
                <span className="text-xs font-semibold text-blue-600">{proximas7d}</span>
              </div>
            )}
            {ritmoPromedio > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Ritmo (promedio)</span>
                <span className="text-xs font-medium text-gray-700">{ritmoPromedio.toFixed(1)} tareas/sem</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Micro-insights (banda inferior) */}
      <div className={`pt-2 border-t border-gray-100 text-xs font-medium ${insightColor}`}>
        {insightTexto}
      </div>
    </div>
  );
}
