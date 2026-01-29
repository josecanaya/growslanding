'use client';

import { useState } from 'react';

interface ActivityChartProps {
  actividad: { 
    tareasCompletadasPorSemana: Array<{ semana: number; completadas: number }>; 
    actividadProyectada: Array<{ semana: number; proyectado: number }>; 
    insight?: 'success' | 'warning' | 'error'; 
    milestones?: Array<{ semana: number; nombre: string }> 
  };
  rangoTemporal: number;
  onHover?: (semana: number | null) => void;
  hoveredSemana?: number | null;
}

export function ActivityChart({ 
  actividad, 
  rangoTemporal, 
  onHover, 
  hoveredSemana 
}: ActivityChartProps) {
  const { tareasCompletadasPorSemana, actividadProyectada, insight = 'success', milestones = [] } = actividad;
  const semanas = tareasCompletadasPorSemana.map(t => t.semana);
  const completadas = tareasCompletadasPorSemana.map(t => t.completadas);
  const proyectado = actividadProyectada.map(t => t.proyectado);
  
  // Estado para tooltip local
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredHito, setHoveredHito] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  // Filtrar datos según rango temporal seleccionado - CORRECCIÓN: mostrar ÚLTIMAS semanas
  const totalSemanas = semanas.length;
  const inicioSlice = rangoTemporal >= totalSemanas 
    ? 0 
    : totalSemanas - rangoTemporal;
  
  const semanasFiltradas = semanas.slice(inicioSlice);
  const completadasFiltradas = completadas.slice(inicioSlice);
  const proyectadoFiltradas = proyectado.slice(inicioSlice);
  
  // Calcular máximo entre serie real y planificada (del rango filtrado)
  const maxReal = Math.max(...completadasFiltradas, 0);
  const maxPlanificado = Math.max(...proyectadoFiltradas, 0);
  const maxAbsoluto = Math.max(maxReal, maxPlanificado);
  // Tope = max + 5-10% (usamos 7.5% para margen apropiado)
  const maxTareas = maxAbsoluto * 1.075;
  const minTareas = 0;
  const rangoTareas = maxTareas - minTareas;
  
  // Calcular semana actual (última semana con datos reales)
  const semanaActual = semanas.length;
  
  // Usar datos filtrados para los cálculos
  const semanasParaGrafico = semanasFiltradas;
  const completadasParaGrafico = completadasFiltradas;
  const proyectadoParaGrafico = proyectadoFiltradas;
  
  // Simplificar ticks del eje Y (0, 20, 40, 60)
  const ticksY = [];
  const step = Math.ceil(maxTareas / 60) * 20; // Redondea a múltiplos de 20
  for (let i = 0; i <= Math.ceil(maxTareas / step); i++) {
    const value = i * step;
    if (value <= maxTareas) {
      ticksY.push(value);
    }
  }
  if (ticksY[ticksY.length - 1] < maxTareas) {
    ticksY.push(Math.ceil(maxTareas / 20) * 20); // Redondea hacia arriba
  }
  
  // Dimensiones del gráfico (en porcentajes del viewBox)
  // El eje X debe ser el doble que el Y
  const viewBoxWidth = 200; // Doble del height para que X sea 2x Y
  const viewBoxHeight = 100;
  const paddingLeft = 14; // Más espacio para etiquetas del eje Y
  const paddingRight = 6;
  const paddingTop = 10;
  const paddingBottom = 18; // Más espacio para etiquetas del eje X
  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = viewBoxHeight - paddingTop - paddingBottom;
  
  // Calcular puntos de la línea proyectada (usando datos filtrados)
  const puntosProyectados = proyectadoParaGrafico.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minTareas) / rangoTareas) * chartHeight;
    return { x, y, cantidad };
  });
  
  // Calcular puntos de la línea de tareas completadas (usando datos filtrados)
  const puntosTareas = completadasParaGrafico.map((cantidad, index) => {
    const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((cantidad - minTareas) / rangoTareas) * chartHeight;
    return { x, y, cantidad };
  });
  
  // Crear path para la línea proyectada
  const pathProyectado = puntosProyectados.reduce((acc, punto, index) => {
    if (index === 0) {
      return `M ${punto.x} ${punto.y}`;
    }
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');
  
  // Crear path para la línea real
  const pathTareas = puntosTareas.reduce((acc, punto, index) => {
    if (index === 0) {
      return `M ${punto.x} ${punto.y}`;
    }
    return `${acc} L ${punto.x} ${punto.y}`;
  }, '');
  
  // Primer punto para el área
  const primerPunto = puntosTareas[0];
  // Último punto
  const ultimoPunto = puntosTareas[puntosTareas.length - 1];
  const tareasActuales = completadas[completadas.length - 1];
  
  // Path del área bajo la línea (cierra desde el último punto hasta el primer punto pasando por la base)
  // Validar que existan puntos antes de crear el path
  const pathArea = primerPunto && ultimoPunto
    ? `${pathTareas} L ${ultimoPunto.x} ${paddingTop + chartHeight} L ${primerPunto.x} ${paddingTop + chartHeight} Z`
    : '';
  
  // ID único para el gradiente del área (verde suave tipo Google Finance)
  const gradientId = `activityGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calcular total de tareas acumuladas (del rango completo, no filtrado)
  const totalTareas = completadas[completadas.length - 1] || 0;
  const totalPlanificado = proyectado[proyectado.length - 1] || 0;
  
  // 1. DESVÍO ACTUAL
  const desvioActual = totalTareas - totalPlanificado;
  let desvioColor = 'text-emerald-600';
  let desvioEstado: 'success' | 'warning' | 'error' = 'success';
  if (desvioActual >= 0 && desvioActual >= -2) {
    desvioColor = 'text-emerald-600';
    desvioEstado = 'success';
  } else if (desvioActual >= -6) {
    desvioColor = 'text-amber-600';
    desvioEstado = 'warning';
  } else {
    desvioColor = 'text-red-600';
    desvioEstado = 'error';
  }
  
  // 2. PROYECCIÓN DE FECHA DE FIN
  // Calcular ritmo promedio real (últimas 4 semanas)
  const ultimasSemanas = Math.min(4, completadas.length);
  const tareasUltimasSemanas = completadas.slice(-ultimasSemanas);
  const ritmoReal = ultimasSemanas > 1 
    ? (tareasUltimasSemanas[ultimasSemanas - 1] - tareasUltimasSemanas[0]) / (ultimasSemanas - 1)
    : 2.4; // Fallback
  
  // Extender línea real 3 semanas más
  const semanasProyeccion = 3;
  const semanaFinPlanificado = semanas.length;
  const tareasRestantes = totalPlanificado - totalTareas;
  const semanasEstimadas = ritmoReal > 0 ? Math.max(1, Math.ceil(tareasRestantes / ritmoReal)) : semanasProyeccion;
  const semanaFinEstimada = semanaActual + semanasEstimadas;
  
  // Puntos proyectados (extensión de la línea real)
  const puntosProyeccion = [];
  for (let i = 1; i <= semanasProyeccion; i++) {
    const semana = semanaActual + i;
    const tareasProyectadas = totalTareas + (ritmoReal * i);
    // Calcular X considerando el viewBox completo (incluyendo proyección)
    const maxSemanas = semanas.length + semanasProyeccion;
    const x = paddingLeft + ((semana - 1) / Math.max(maxSemanas - 1, 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((tareasProyectadas - minTareas) / rangoTareas) * chartHeight;
    puntosProyeccion.push({ x, y, semana, tareas: tareasProyectadas });
  }
  
  // Path para la proyección (línea discontinua, conectada desde el último punto real)
  const pathProyeccion = puntosProyeccion.length > 0 && ultimoPunto
    ? `M ${ultimoPunto.x} ${ultimoPunto.y} ${puntosProyeccion.map(p => `L ${p.x} ${p.y}`).join(' ')}`
    : '';
  
  // Calcular tareas ejecutadas por semana (para el tooltip)
  const tareasPorSemana = completadasParaGrafico.map((acum, index) => {
    if (index === 0) return acum;
    return acum - completadasParaGrafico[index - 1];
  });
  
  // Calcular ritmo comparativo (últimas 4 semanas vs anteriores)
  const ultimasSemanasCount = Math.min(4, completadas.length);
  const semanasAnterioresCount = Math.min(4, completadas.length - ultimasSemanasCount);
  
  let ritmoUltimas4 = 0;
  let ritmoAnteriores = 0;
  
  if (ultimasSemanasCount > 1) {
    const inicioUltimas = completadas.length - ultimasSemanasCount;
    ritmoUltimas4 = (completadas[completadas.length - 1] - completadas[inicioUltimas]) / (ultimasSemanasCount - 1);
  }
  
  if (semanasAnterioresCount > 1 && completadas.length > ultimasSemanasCount) {
    const inicioAnteriores = completadas.length - ultimasSemanasCount - semanasAnterioresCount;
    const finAnteriores = completadas.length - ultimasSemanasCount;
    ritmoAnteriores = (completadas[finAnteriores - 1] - completadas[inicioAnteriores]) / (semanasAnterioresCount - 1);
  }
  
  const diferenciaRitmo = ritmoUltimas4 - ritmoAnteriores;
  let ritmoTendencia = '→';
  let ritmoTexto = 'Ritmo estable';
  let ritmoColor = 'text-amber-600';
  
  if (Math.abs(diferenciaRitmo) < 0.1) {
    ritmoTendencia = '→';
    ritmoTexto = 'Ritmo estable';
    ritmoColor = 'text-amber-600';
  } else if (diferenciaRitmo > 0) {
    ritmoTendencia = '↑';
    ritmoTexto = `Ritmo en aumento (+${diferenciaRitmo.toFixed(1)} tareas/sem)`;
    ritmoColor = 'text-emerald-600';
  } else {
    ritmoTendencia = '↓';
    ritmoTexto = `Ritmo en baja (${diferenciaRitmo.toFixed(1)} tareas/sem)`;
    ritmoColor = 'text-red-600';
  }
  
  // Calcular estado del avance (para indicador abajo a la derecha)
  const diferencia = totalTareas - totalPlanificado;
  let estadoTexto = 'Dentro del plan';
  let estadoColor = 'text-emerald-600';
  if (diferencia < -6) {
    estadoTexto = 'Retraso acumulado';
    estadoColor = 'text-red-600';
  } else if (diferencia < -2) {
    estadoTexto = 'Requiere atención';
    estadoColor = 'text-amber-600';
  } else if (diferencia > 2) {
    estadoTexto = 'Adelanto';
    estadoColor = 'text-emerald-600';
  }
  
  // Agregar semana actual como hito
  const todosLosHitos = [
    ...milestones,
    { semana: semanaActual, nombre: 'Semana actual' }
  ];
  
  // Calcular puntos de hitos (milestones) en el rango visible
  const puntosHitos = todosLosHitos
    .filter(m => semanasParaGrafico.includes(m.semana))
    .map(milestone => {
      const index = semanasParaGrafico.indexOf(milestone.semana);
      if (index === -1) return null;
      const punto = puntosTareas[index];
      return { ...punto, nombre: milestone.nombre, semana: milestone.semana };
    })
    .filter(p => p !== null);
  
  // Calcular punto hovered antes del render
  const puntoHovered = hoveredSemana && !hoveredHito && semanasParaGrafico.includes(hoveredSemana)
    ? (() => {
        const index = semanasParaGrafico.indexOf(hoveredSemana);
        return puntosTareas[index] || null;
      })()
    : null;
  
  // Calcular flecha de tendencia (dirección del último tramo)
  const ultimosTramos = puntosTareas.slice(-2);
  const tieneAceleracion = ultimosTramos.length === 2 && 
    ultimosTramos[1] && ultimosTramos[0] &&
    ultimosTramos[1].y < ultimosTramos[0].y; // Y menor = más alto = más tareas
  
  // 3. RITMO PROMEDIO
  const ritmoPlanificado = semanas.length > 0 ? totalPlanificado / semanas.length : 0;
  const ritmoRealPromedio = semanas.length > 0 ? totalTareas / semanas.length : 0;
  const tendenciaRitmo = ritmoRealPromedio >= ritmoPlanificado ? '↑' : '↓';
  
  // 4. INSIGHT AUTOMÁTICO MEJORADO
  const ultimaReal = completadas[completadas.length - 1] || 0;
  const ultimaPlanificada = proyectado[proyectado.length - 1] || 0;
  // Nota: diferencia ya está declarada arriba, usar esa
  const porcentajeDiferencia = ultimaPlanificada > 0 ? (diferencia / ultimaPlanificada) * 100 : 0;
  
  // Detectar desde cuándo hay retraso
  let semanaInicioRetraso: number | null = null;
  for (let i = 0; i < completadas.length; i++) {
    if (completadas[i] < proyectado[i] - 2) {
      semanaInicioRetraso = i + 1;
      break;
    }
  }
  
  let insightCalculado: 'success' | 'warning' | 'error' = 'success';
  let insightTexto = 'La obra mantiene un avance estable y dentro del plan.';
  if (porcentajeDiferencia < -10 || desvioActual < -6) {
    insightCalculado = 'error';
    insightTexto = semanaInicioRetraso 
      ? `El atraso comenzó a partir de la semana ${semanaInicioRetraso}.`
      : 'Retraso acumulado en el cronograma.';
  } else if (porcentajeDiferencia < -3 || (desvioActual < -2 && desvioActual >= -6)) {
    insightCalculado = 'warning';
    insightTexto = 'Se detecta una leve desaceleración en las últimas semanas.';
  } else {
    insightCalculado = 'success';
    insightTexto = 'La obra mantiene un avance estable y dentro del plan.';
  }

  return (
    <div className="space-y-4 w-full">
      {/* Gráfico */}
      <div className="relative w-full h-48 md:h-64 lg:h-[380px]">
        <svg 
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ display: 'block' }}
        >
          {/* Definiciones */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid horizontal (muy sutil, casi imperceptible) */}
          {ticksY.map((value, index) => {
            const y = paddingTop + chartHeight - ((value - minTareas) / rangoTareas) * chartHeight;
            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="0.2"
                  opacity="0.3"
                />
                <text
                  x={paddingLeft - 3.5}
                  y={y + 0.5}
                  fontSize="1.8"
                  fill="#9CA3AF"
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontWeight="300"
                  className="text-[8px] md:text-[10px]"
                >
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* Eje Y y Eje X (muy sutiles) */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.2"
            opacity="0.4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight}
            stroke="#E5E7EB"
            strokeWidth="0.2"
            opacity="0.4"
          />
          
          {/* Área bajo la línea real (degradado verde suave tipo Google Finance) */}
          <path
            d={pathArea}
            fill={`url(#${gradientId})`}
          />
          
          {/* Línea vertical para semana actual con label (solo si está en el rango visible) */}
          {semanaActual > 0 && semanasParaGrafico.includes(semanaActual) && (
            <g key="semana-actual">
              <line
                x1={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y1={paddingTop}
                x2={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y2={paddingTop + chartHeight}
                stroke="#6366F1"
                strokeWidth="0.5"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              {/* Label "Semana actual" arriba */}
              <text
                x={paddingLeft + ((semanasParaGrafico.indexOf(semanaActual)) / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth}
                y={paddingTop - 2}
                fontSize="2"
                fill="#6366F1"
                textAnchor="middle"
                dominantBaseline="hanging"
                fontWeight="500"
                opacity="0.7"
              >
                Semana actual
              </text>
            </g>
          )}
          
          {/* Etiquetas del eje X (semanas) - mostrar semanas del rango filtrado */}
          {(() => {
            // Mostrar primera, última y algunas intermedias del rango visible
            const primeraSemana = semanasParaGrafico[0];
            const ultimaSemana = semanasParaGrafico[semanasParaGrafico.length - 1];
            const semanasAMostrar = [primeraSemana];
            
            // Agregar semanas intermedias si hay espacio
            if (semanasParaGrafico.length > 8) {
              const medio1 = semanasParaGrafico[Math.floor(semanasParaGrafico.length / 3)];
              const medio2 = semanasParaGrafico[Math.floor(semanasParaGrafico.length * 2 / 3)];
              semanasAMostrar.push(medio1, medio2);
            } else if (semanasParaGrafico.length > 4) {
              const medio = semanasParaGrafico[Math.floor(semanasParaGrafico.length / 2)];
              semanasAMostrar.push(medio);
            }
            
            semanasAMostrar.push(ultimaSemana);
            
            // Eliminar duplicados
            const semanasUnicas = [...new Set(semanasAMostrar)];
            
            return semanasUnicas.map((semana) => {
              const index = semanasParaGrafico.indexOf(semana);
              if (index === -1) return null;
              const x = paddingLeft + (index / Math.max(semanasParaGrafico.length - 1, 1)) * chartWidth;
              return (
                <g key={semana}>
                  <line
                    x1={x}
                    y1={paddingTop + chartHeight}
                    x2={x}
                    y2={paddingTop + chartHeight + 1.5}
                    stroke="#E5E7EB"
                    strokeWidth="0.3"
                    opacity="0.5"
                  />
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 4.5}
                    fontSize="2.5"
                    fill="#6B7280"
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontWeight="400"
                  >
                    S{semana}
                  </text>
                </g>
              );
            });
          })()}
          
          {/* Línea proyectada (planificada - gris claro, discontinua, fina y sutil) */}
          <path
            d={pathProyectado}
            stroke="#9CA3AF"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
          
          {/* Línea de tareas completadas (real - verde sólido, muy fina estilo fintech) */}
          <path
            d={pathTareas}
            stroke="#16a34a"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Resaltar semana hovered (desde presupuesto) - solo si no es un hito */}
          {puntoHovered && (
            <circle
              key={`hovered-${hoveredSemana}`}
              cx={puntoHovered.x}
              cy={puntoHovered.y}
              r="6"
              fill="#3B82F6"
              opacity="0.2"
            />
          )}
          
          {/* Hitos de obra (milestones) - marcadores circulares azules/violetas */}
          {puntosHitos.map((hito, index) => {
            if (!hito) return null;
            const esActual = hito.semana === semanaActual;
            const esHovered = hoveredSemana === hito.semana;
            return (
              <g key={`hito-${hito.semana}`}>
                {/* Círculo del hito (más pequeño para estilo fino) */}
                <circle
                  cx={hito.x}
                  cy={hito.y}
                  r={esActual ? "4" : "4"}
                  fill="white"
                  stroke={esActual ? "#16a34a" : "#6366F1"}
                  strokeWidth={esHovered ? "2" : (esActual ? "1.5" : "1.5")}
                  opacity={esHovered ? 1 : 0.9}
                />
                <circle
                  cx={hito.x}
                  cy={hito.y}
                  r={esActual ? "2.5" : "2.5"}
                  fill={esActual ? "#16a34a" : "#6366F1"}
                  opacity={esHovered ? 1 : 0.9}
                />
              </g>
            );
          })}
          
          {/* Flecha de tendencia sobre el último tramo */}
          {ultimosTramos.length === 2 && ultimosTramos[0] && ultimosTramos[1] && (
            <g key="flecha-tendencia">
              <path
                d={`M ${ultimosTramos[0].x} ${ultimosTramos[0].y} L ${ultimosTramos[1].x} ${ultimosTramos[1].y}`}
                stroke={tieneAceleracion ? "#16a34a" : "#ef4444"}
                strokeWidth="1.5"
                strokeLinecap="round"
                markerEnd={`url(#arrow-${tieneAceleracion ? 'up' : 'down'})`}
                opacity="0.6"
              />
              {/* Definir marcadores de flecha */}
              <defs>
                <marker
                  id="arrow-up"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 0 L 0 6 L 6 3 z" fill="#16a34a" />
                </marker>
                <marker
                  id="arrow-down"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M 0 6 L 0 0 L 6 3 z" fill="#ef4444" />
                </marker>
              </defs>
            </g>
          )}
          
          {/* Punto destacado en la semana actual (pequeño con halo sutil) */}
          {ultimoPunto && (
            <>
              <circle
                cx={ultimoPunto.x}
                cy={ultimoPunto.y}
                r="3.5"
                fill="#16a34a"
                stroke="white"
                strokeWidth="1.5"
              />
              {/* Halo sutil */}
              <circle
                cx={ultimoPunto.x}
                cy={ultimoPunto.y}
                r="5"
                fill="none"
                stroke="#16a34a"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </>
          )}
          
          {/* Zonas interactivas para tooltip y click - usando coordenadas del SVG */}
          {puntosTareas.map((punto, index) => {
            const semanaClick = semanasParaGrafico[index];
            return (
              <circle
                key={index}
                cx={punto.x}
                cy={punto.y}
                r="12"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // Navegar a la semana correspondiente
                  // window.location.href = `/cliente/tareas?semana=${semanaClick}`;
                  console.log(`Navegar a semana ${semanaClick}`);
                }}
                onMouseMove={(e) => {
                  const svg = e.currentTarget.ownerSVGElement;
                  if (!svg) return;
                  const svgRect = svg.getBoundingClientRect();
                  const point = svg.createSVGPoint();
                  point.x = e.clientX;
                  point.y = e.clientY;
                  const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
                  
                  setHoveredIndex(index);
                  setHoveredHito(null); // Limpiar hover de hito
                  setTooltipPos({
                    x: (svgPoint.x / viewBoxWidth) * 100,
                    y: (svgPoint.y / viewBoxHeight) * 100
                  });
                  // Notificar al componente padre para sincronización
                  if (onHover) {
                    onHover(semanasParaGrafico[index]);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setTooltipPos(null);
                  if (onHover) {
                    onHover(null);
                  }
                }}
              />
            );
          })}
          
          {/* Zonas interactivas para hitos */}
          {puntosHitos.map((hito, index) => {
            if (!hito) return null;
            const hitoIndex = semanasParaGrafico.indexOf(hito.semana);
            const tareasHito = hitoIndex >= 0 ? completadasParaGrafico[hitoIndex] : 0;
            return (
              <g key={`hito-interactive-${hito.semana}`}>
                <circle
                  cx={hito.x}
                  cy={hito.y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // Navegar a la fase correspondiente
                    console.log(`Navegar a hito: ${hito.nombre} (Semana ${hito.semana})`);
                  }}
              onMouseEnter={(e) => {
                const svg = e.currentTarget.ownerSVGElement;
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const point = svg.createSVGPoint();
                point.x = e.clientX;
                point.y = e.clientY;
                const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
                
                setHoveredHito(hito.semana);
                setHoveredIndex(null); // Limpiar hover de punto normal
                setTooltipPos({
                  x: (svgPoint.x / viewBoxWidth) * 100,
                  y: (svgPoint.y / viewBoxHeight) * 100
                });
                if (onHover) {
                  onHover(hito.semana);
                }
              }}
              onMouseLeave={() => {
                setHoveredHito(null);
                setTooltipPos(null);
                if (onHover) {
                  onHover(null);
                }
              }}
              />
            </g>
          );
        })}
        </svg>
        
        {/* Etiquetas de ejes fuera del SVG */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 -rotate-90 text-[10px] font-medium text-gray-500">
          Tareas acumuladas
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-[10px] font-medium text-gray-500">
          Semanas
        </div>
        
        {/* Tooltip tipo mercado (Google Finance style) - solo si no es un hito */}
        {hoveredIndex !== null && !hoveredHito && tooltipPos && (
          <div
            className="absolute z-10 bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-3 pointer-events-none min-w-[140px]"
            style={{
              left: `${tooltipPos.x}%`,
              top: `${tooltipPos.y}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px'
            }}
          >
            <div className="text-xs font-semibold text-gray-300 mb-2">
              Semana {semanasParaGrafico[hoveredIndex]}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Tareas acumuladas:</span>
                <span className="font-semibold text-white">{completadasParaGrafico[hoveredIndex]}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Tareas ejecutadas:</span>
                <span className="font-semibold text-white">{tareasPorSemana[hoveredIndex]}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700">
                <span className="text-gray-400">Planificado:</span>
                <span className="font-semibold text-gray-300">{proyectadoParaGrafico[hoveredIndex]}</span>
              </div>
              <button className="w-full mt-2 pt-1.5 border-t border-gray-700 text-xs text-blue-400 hover:text-blue-300 text-left">
                Ver tareas de esta semana →
              </button>
            </div>
          </div>
        )}
        
        {/* Tooltip para hitos (solo cuando hover directamente en un hito) */}
        {hoveredHito && tooltipPos && (() => {
          const hitoHovered = puntosHitos.find(h => h && h.semana === hoveredHito);
          if (!hitoHovered) return null;
          const hitoIndex = semanasParaGrafico.indexOf(hitoHovered.semana);
          if (hitoIndex === -1) return null;
          
          return (
            <div
              className="absolute z-10 bg-indigo-600 rounded-lg shadow-xl border border-indigo-700 p-3 pointer-events-none min-w-[160px]"
              style={{
                left: `${tooltipPos.x}%`,
                top: `${tooltipPos.y}%`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px'
              }}
            >
              <div className="text-xs font-semibold text-white mb-2">
                {hitoHovered.nombre}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-indigo-200">Semana:</span>
                  <span className="font-semibold text-white">{hitoHovered.semana}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-indigo-200">Tareas acumuladas:</span>
                  <span className="font-semibold text-white">{completadasParaGrafico[hitoIndex]}</span>
                </div>
                <button className="w-full mt-2 pt-1.5 border-t border-indigo-500 text-xs text-white hover:text-indigo-100 text-left font-medium">
                  Ver tareas del hito →
                </button>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Información operativa debajo del gráfico */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        {/* Primera fila: Leyenda y Ritmo */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Leyenda */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600 rounded-full"></div>
              <span className="text-xs text-gray-600 font-medium">Real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t border-dashed border-gray-400"></div>
              <span className="text-xs text-gray-600 font-medium">Planificado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border-2 border-indigo-500 bg-white"></div>
              <span className="text-xs text-gray-600 font-medium">Hitos</span>
            </div>
          </div>
          
          {/* Indicador de ritmo */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="font-medium">Ritmo promedio:</span>
            <span>Planificado: {ritmoPlanificado.toFixed(1)} tareas/sem</span>
            <span className={`flex items-center gap-1 ${ritmoColor}`}>
              Real: {ritmoRealPromedio.toFixed(1)} tareas/sem
              <span className="text-base">{ritmoTendencia}</span>
            </span>
          </div>
          
          {/* Desvío acumulado */}
          <div className="text-xs">
            <span className="text-gray-600">Desvío acumulado:</span>
            <span className={`ml-2 font-semibold ${
              desvioEstado === 'success' ? 'text-emerald-600' :
              desvioEstado === 'warning' ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {desvioActual >= 0 ? '+' : ''}{desvioActual} tareas
            </span>
          </div>
        </div>
        
        {/* Segunda fila: Estado y Acción */}
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium ${estadoColor}`}>
            {estadoTexto}
          </div>
          
          {/* Botón de acción */}
          <button 
            onClick={() => {
              // Navegar a tareas de esta semana
              // window.location.href = `/cliente/tareas?semana=${semanaActual}`;
              console.log(`Ver tareas de semana ${semanaActual}`);
            }}
            className="text-xs font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
          >
            Ver tareas de esta semana →
          </button>
        </div>
      </div>
    </div>
  );
}
