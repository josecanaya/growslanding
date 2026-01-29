'use client';

import { useState } from 'react';
import { formatCurrency } from './formatCurrency';

interface BudgetChartProps {
  presupuestoSemanal: Array<{ semana: number; proyectado: number; ejecutado: number; tareasPagadas: number }>;
  rangoTemporal: number;
  onHover?: (semana: number | null) => void;
  hoveredSemana?: number | null;
  onRangoChange?: (rango: number) => void;
}

export function BudgetChart({ 
  presupuestoSemanal, 
  rangoTemporal,
  onHover,
  hoveredSemana,
  onRangoChange
}: BudgetChartProps) {
  // Filtrar datos según rango temporal (últimas semanas + 2 semanas futuras)
  const totalSemanas = presupuestoSemanal.length;
  const inicioSlice = rangoTemporal >= totalSemanas 
    ? 0 
    : totalSemanas - rangoTemporal;
  
  // Obtener semanas pasadas según el rango
  const semanasPasadas = presupuestoSemanal.slice(inicioSlice);
  
  // Agregar 2 semanas futuras (proyectadas) basadas en el promedio o tendencia
  const ultimaSemana = presupuestoSemanal[presupuestoSemanal.length - 1];
  const promedioProyectado = semanasPasadas.reduce((sum, d) => sum + d.proyectado, 0) / semanasPasadas.length;
  
  const semanasFuturas = [
    { 
      semana: totalSemanas + 1, 
      proyectado: promedioProyectado, 
      ejecutado: 0, 
      tareasPagadas: 0,
      esFutura: true
    },
    { 
      semana: totalSemanas + 2, 
      proyectado: promedioProyectado, 
      ejecutado: 0, 
      tareasPagadas: 0,
      esFutura: true
    }
  ];
  
  const datosFiltrados = [...semanasPasadas, ...semanasFuturas];
  
  // Calcular totales (solo semanas pasadas, no futuras)
  const semanasPasadasParaTotal = semanasPasadas;
  const totalProyectado = semanasPasadasParaTotal.reduce((sum, d) => sum + d.proyectado, 0);
  const totalEjecutado = semanasPasadasParaTotal.reduce((sum, d) => sum + d.ejecutado, 0);
  const porcentajeEjecutado = totalProyectado > 0 ? (totalEjecutado / totalProyectado) * 100 : 0;
  const diferencia = totalEjecutado - totalProyectado;
  
  // Determinar estado (escrow - sin sobrecosto)
  let estadoTexto = 'Dentro de lo aprobado';
  let estadoColor = 'text-emerald-600';
  
  if (totalEjecutado === 0 && semanasPasadasParaTotal.length > 0) {
    estadoTexto = 'Sin movimientos en el período';
    estadoColor = 'text-gray-500';
  } else if (porcentajeEjecutado < 50) {
    estadoTexto = 'Ejecución según avance';
    estadoColor = 'text-blue-600';
  } else if (porcentajeEjecutado >= 50 && porcentajeEjecutado < 90) {
    estadoTexto = 'Dentro de lo aprobado';
    estadoColor = 'text-emerald-600';
  } else {
    estadoTexto = 'Dentro de lo aprobado';
    estadoColor = 'text-emerald-600';
  }
  
  // Calcular semanas sin ejecución (solo semanas pasadas, no futuras)
  const semanasSinEjecucion = semanasPasadasParaTotal.filter(d => d.ejecutado === 0).length;
  
  // Calcular máximo para escala (incluir tanto proyectado como ejecutado)
  const maxValorProyectado = Math.max(...datosFiltrados.map(d => d.proyectado), 1);
  const maxValorEjecutado = Math.max(...datosFiltrados.map(d => d.ejecutado), 0);
  const maxValor = Math.max(maxValorProyectado, maxValorEjecutado, 1);
  const maxValorConMargen = maxValor * 1.1; // 10% de margen superior
  
  // Calcular valores del eje Y en miles de pesos (redondeados hacia arriba)
  const maxValorRedondeado = Math.max(
    Math.ceil(maxValorConMargen / 5000) * 5000,
    10000
  );
  
  const numTicks = 5;
  const pasoY = maxValorRedondeado / (numTicks - 1);
  const valoresY: number[] = [];
  for (let i = 0; i < numTicks; i++) {
    valoresY.push((pasoY * i));
  }
  
  // Estado para tooltip
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  return (
    <div className="space-y-4">
      {/* KPIs arriba */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-[10px] md:text-xs mb-3 md:mb-4">
        <div>
          <div className="text-gray-500 mb-1">Total aprobado</div>
          <div className="font-semibold text-gray-900">{formatCurrency(totalProyectado)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Total ejecutado</div>
          <div className="font-semibold text-gray-900">{formatCurrency(totalEjecutado)}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">% ejecutado</div>
          <div className="font-semibold text-gray-900">{porcentajeEjecutado.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Semanas sin ejecución</div>
          <div className="font-semibold text-gray-900">{semanasSinEjecucion}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Saldo escrow</div>
          <div className="font-semibold text-blue-600">{formatCurrency(totalProyectado - totalEjecutado)}</div>
        </div>
      </div>
      
      {/* Gráfico de barras semanales */}
      <div className="relative h-[120px] md:h-[140px] lg:h-[192px] w-full overflow-visible" id="budget-chart-container">
        {/* Eje Y */}
        <div className="absolute left-0 top-0 bottom-5 md:bottom-7 w-10 md:w-14 flex flex-col justify-between pr-1 md:pr-2 pointer-events-none">
          {valoresY.slice().reverse().map((valor, idx) => (
            <div 
              key={`y-${valor}-${idx}`} 
              className="flex items-center justify-end h-full"
              style={{ 
                alignItems: idx === 0 ? 'flex-end' : idx === valoresY.length - 1 ? 'flex-start' : 'center'
              }}
            >
              <div className="text-[9px] md:text-[10px] text-gray-500 font-medium">
                ${(valor / 1000).toFixed(0)}k
              </div>
              <div className="w-2 h-px bg-gray-200 ml-1" />
            </div>
          ))}
        </div>
        
        {/* Contenedor de barras */}
        <div className="ml-10 md:ml-14 mr-1 md:mr-2 h-full px-1 md:px-2 pb-5 md:pb-7 relative">
          <div className="relative h-[100px] md:h-[125px]">
            {/* Líneas de referencia */}
            {valoresY.map((valor, idx) => {
              const porcentajeDesdeAbajo = (valor / maxValorRedondeado) * 100;
              return (
                <div
                  key={`grid-${valor}-${idx}`}
                  className="absolute left-0 right-0 h-px bg-gray-100 z-0"
                  style={{
                    bottom: `${porcentajeDesdeAbajo}%`
                  }}
                />
              );
            })}
            
            {/* Eje X */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 z-10" />
            
            {/* Barras */}
            <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-between gap-1 md:gap-1.5">
              {datosFiltrados.map((dato, index) => {
                const alturaProyectadoPct = (dato.proyectado / maxValorRedondeado) * 100;
                const alturaEjecutadoPct = (dato.ejecutado / maxValorRedondeado) * 100;
                
                const sinEjecucion = dato.ejecutado === 0 && !(dato as any).esFutura;
                const esFutura = (dato as any).esFutura;
                const esHovered = hoveredSemana === dato.semana || hoveredIndex === index;
                
                return (
                  <div 
                    key={dato.semana}
                    className="flex-1 flex flex-col items-center justify-end group relative transition-all cursor-pointer h-full"
                    onClick={() => {
                      console.log(`Click en semana ${dato.semana}`);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredIndex(index);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const graphContainer = document.getElementById('budget-chart-container');
                      if (graphContainer) {
                        const containerRect = graphContainer.getBoundingClientRect();
                        setTooltipPos({
                          x: ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100,
                          y: ((rect.top - containerRect.top) / containerRect.height) * 100
                        });
                      } else {
                        setTooltipPos({
                          x: rect.left + rect.width / 2,
                          y: rect.top
                        });
                      }
                      if (onHover) {
                        onHover(dato.semana);
                      }
                    }}
                    onMouseLeave={() => {
                      setTimeout(() => {
                        if (hoveredIndex === index) {
                          setHoveredIndex(null);
                          setTooltipPos(null);
                          if (onHover) {
                            onHover(null);
                          }
                        }
                      }, 100);
                    }}
                  >
                    <div 
                      className="w-full relative rounded-t transition-all"
                      style={{ 
                        height: `${alturaProyectadoPct}%`,
                        minHeight: alturaProyectadoPct > 0 ? '3px' : '0px',
                        opacity: esHovered ? 1 : 0.85
                      }}
                    >
                      <div 
                        className="absolute inset-0 bg-slate-300 rounded-t"
                        style={{ 
                          opacity: esHovered ? 0.9 : 0.7
                        }}
                      />
                      
                      {!esFutura && (
                        <div 
                          className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${
                            sinEjecucion ? 'bg-gray-400/30' : 'bg-green-500'
                          }`}
                          style={{ 
                            height: dato.proyectado > 0 ? `${(alturaEjecutadoPct / alturaProyectadoPct) * 100}%` : '0%',
                            minHeight: alturaEjecutadoPct > 0 ? '2px' : '0px',
                            opacity: esHovered ? 1 : (sinEjecucion ? 0.4 : 0.9)
                          }}
                        />
                      )}
                      
                      {esFutura && (
                        <div 
                          className="absolute inset-0 rounded-t bg-slate-300/30 border-t-2 border-dashed border-slate-400/50"
                        />
                      )}
                      
                      {sinEjecucion && !esFutura && (
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Labels del eje X */}
          <div className="flex items-center justify-between gap-1 mt-1">
            {datosFiltrados.map((dato, index) => {
              const total = datosFiltrados.length;
              const interval = total > 16 ? 3 : total > 12 ? 2 : 2;
              const mostrar = index % interval === 0 || index === total - 1;
              const esFutura = (dato as any).esFutura;
              
              return (
                <div 
                  key={`label-${dato.semana}`}
                  className={`flex-1 text-center ${mostrar ? '' : 'invisible'}`}
                >
                  {mostrar && (
                    <span className={`text-[9px] md:text-[10px] leading-none font-medium ${esFutura ? 'text-gray-400 italic' : 'text-gray-500'}`}>
                      {esFutura ? `S${dato.semana}*` : `S${dato.semana}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tooltip */}
        {hoveredIndex !== null && tooltipPos && datosFiltrados[hoveredIndex] && (
          <div
            className="absolute z-50 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-2 md:p-3 pointer-events-none min-w-[160px] md:min-w-[200px]"
            style={{
              left: typeof tooltipPos.x === 'number' && tooltipPos.x > 100 
                ? `${tooltipPos.x}px` 
                : `${tooltipPos.x}%`,
              top: typeof tooltipPos.y === 'number' && tooltipPos.y > 100
                ? `${tooltipPos.y - 10}px`
                : `${tooltipPos.y}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-8px'
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="text-[10px] md:text-xs font-semibold text-gray-300 mb-1.5 md:mb-2">
              Semana {datosFiltrados[hoveredIndex].semana}
            </div>
            <div className="space-y-1 md:space-y-1.5 text-[10px] md:text-xs">
              {(datosFiltrados[hoveredIndex] as any).esFutura ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Semana:</span>
                    <span className="font-semibold text-white">S{datosFiltrados[hoveredIndex].semana} (Planificada)</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Aprobado previsto:</span>
                    <span className="font-semibold text-white">{formatCurrency(datosFiltrados[hoveredIndex].proyectado)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                    <span className="text-gray-400">Ejecutado:</span>
                    <span className="font-semibold text-gray-400">Aún no ejecutado</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Aprobado:</span>
                    <span className="font-semibold text-white">{formatCurrency(datosFiltrados[hoveredIndex].proyectado)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Ejecutado:</span>
                    <span className={`font-semibold ${datosFiltrados[hoveredIndex].ejecutado === 0 ? 'text-gray-400' : 'text-white'}`}>
                      {datosFiltrados[hoveredIndex].ejecutado === 0 ? 'Sin ejecución' : formatCurrency(datosFiltrados[hoveredIndex].ejecutado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Diferencia:</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(datosFiltrados[hoveredIndex].proyectado - datosFiltrados[hoveredIndex].ejecutado)}
                    </span>
                  </div>
                  {datosFiltrados[hoveredIndex].ejecutado === 0 && (
                    <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                      <span className="text-gray-400 text-[10px] italic">Sin ejecución esta semana</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                    <span className="text-gray-400">Tareas pagadas:</span>
                    <span className="font-semibold text-white">{datosFiltrados[hoveredIndex].tareasPagadas}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer con estado */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Estado:</span>
          <span className={`font-medium ${estadoColor}`}>{estadoTexto}</span>
        </div>
      </div>
    </div>
  );
}
