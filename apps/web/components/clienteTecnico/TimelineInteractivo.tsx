'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Settings, 
  GitBranch, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Info
} from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  lider: string;
  costo?: number;
  dependencias?: string[];
  etapa?: string;
}

interface TimelineInteractivoProps {
  tareas: Tarea[];
  onTareaClick: (tarea: Tarea) => void;
  onEditarPlanificacion: () => void;
  onVerDependencias: () => void;
}

type VistaTimeline = 'semana' | 'mes' | 'total';

export function TimelineInteractivo({ 
  tareas, 
  onTareaClick, 
  onEditarPlanificacion, 
  onVerDependencias 
}: TimelineInteractivoProps) {
  const [vistaActual, setVistaActual] = useState<VistaTimeline>('total');
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredTarea, setHoveredTarea] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [forceRender, setForceRender] = useState(0);

  // No animaciones - timeline estático

  // Forzar re-render de conexiones cuando cambie la página o zoom
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [currentPage, zoom]);

  // Agregar listener para resize y scroll
  useEffect(() => {
    const handleResize = () => {
      setForceRender(prev => prev + 1);
    };

    const handleScroll = () => {
      setForceRender(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    if (timelineRef.current) {
      timelineRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timelineRef.current) {
        timelineRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Calcular fechas para el timeline
  const fechasTareas = tareas.flatMap(t => [new Date(t.fechaInicio), new Date(t.fechaFin)]);
  const fechaMin = new Date(Math.min(...fechasTareas.map(f => f.getTime())));
  const fechaMax = new Date(Math.max(...fechasTareas.map(f => f.getTime())));
  
  // Ajustar fechas para mostrar contexto
  fechaMin.setDate(fechaMin.getDate() - 7);
  fechaMax.setDate(fechaMax.getDate() + 7);

  const duracionTotal = fechaMax.getTime() - fechaMin.getTime();
  const diasTotal = Math.ceil(duracionTotal / (1000 * 60 * 60 * 24));

  // Calcular posición y ancho de una tarea
  const getTareaPosicion = (tarea: Tarea) => {
    const inicioMs = new Date(tarea.fechaInicio).getTime();
    const finMs = new Date(tarea.fechaFin).getTime();
    const duracionMs = finMs - inicioMs;
    
    const posicionInicio = ((inicioMs - fechaMin.getTime()) / duracionTotal) * 100;
    const ancho = (duracionMs / duracionTotal) * 100;
    
    return { posicionInicio, ancho };
  };

  // Obtener color del estado y etapa
  const getEstadoColor = (estado: string, etapa?: string) => {
    const baseStyle = {
      backgroundColor: '#ffffff',
      color: '#1B263B',
      border: '1px solid #d3dae3'
    };

    // Colores por etapa
    const etapaColors = {
      'Estructura': { borderColor: '#1B263B', accentColor: '#1B263B' },
      'Obra gris': { borderColor: '#eaf0f6', accentColor: '#6b7280' },
      'Terminaciones': { borderColor: '#f4e27e', accentColor: '#f4e27e' }
    };

    const etapaStyle = etapa ? etapaColors[etapa as keyof typeof etapaColors] : { borderColor: '#d3dae3', accentColor: '#1B263B' };

    switch (estado) {
      case 'completada':
        return { 
          ...baseStyle, 
          backgroundColor: '#f5f7fa',
          color: '#f4e27e',
          border: `1px solid ${etapaStyle.borderColor}`
        };
      case 'en_progreso':
        return { 
          ...baseStyle, 
          backgroundColor: '#ffffff',
          color: '#1B263B',
          border: `2px solid ${etapaStyle.accentColor}`
        };
      case 'bloqueada':
        return { 
          ...baseStyle, 
          backgroundColor: '#f5f7fa',
          color: '#5b5f6a',
          border: '1px dashed #dce3ea'
        };
      default:
        return { 
          ...baseStyle,
          border: `1px solid ${etapaStyle.borderColor}`
        };
    }
  };

  // Manejar hover para tooltip
  const handleTareaMouseEnter = (tarea: Tarea, event: React.MouseEvent) => {
    setHoveredTarea(tarea.id);
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    
    setTooltipPosition({
      x: rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2,
      y: rect.top - (tooltipRect?.height || 0) - 10
    });
  };

  const handleTareaMouseLeave = () => {
    setHoveredTarea(null);
  };

  // Generar dependencias lógicas entre tareas
  const generarDependencias = () => {
    const dependencias: { [key: string]: string[] } = {};
    
    // Estructura: cada tarea depende de la anterior en la misma etapa
    const etapas = ['Estructura', 'Obra gris', 'Terminaciones'];
    
    etapas.forEach(etapa => {
      const tareasEtapa = tareas.filter(t => t.etapa === etapa).sort((a, b) => 
        new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
      );
      
      tareasEtapa.forEach((tarea, index) => {
        if (index > 0) {
          dependencias[tarea.id] = [tareasEtapa[index - 1].id];
        }
      });
    });
    
    // Dependencias entre etapas: primera tarea de obra gris depende de la última de estructura
    const ultimaEstructura = tareas.filter(t => t.etapa === 'Estructura')
      .sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime())[0];
    const primeraObraGris = tareas.filter(t => t.etapa === 'Obra gris')
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())[0];
    const primeraTerminaciones = tareas.filter(t => t.etapa === 'Terminaciones')
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())[0];
    
    if (ultimaEstructura && primeraObraGris) {
      dependencias[primeraObraGris.id] = [ultimaEstructura.id];
    }
    
    if (primeraObraGris && primeraTerminaciones) {
      const ultimaObraGris = tareas.filter(t => t.etapa === 'Obra gris')
        .sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime())[0];
      dependencias[primeraTerminaciones.id] = [ultimaObraGris.id];
    }
    
    return dependencias;
  };

  // Renderizar conexiones basadas en dependencias reales (sin animaciones)
  const renderConnections = () => {
    const conexiones: JSX.Element[] = [];
    const tareasOrdenadas = tareas.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    const tareasVisibles = tareasOrdenadas.slice(currentPage * 5, (currentPage + 1) * 5);
    
    // Función para obtener dependencias reales (detectar campo existente)
    const getDependencies = (tarea: Tarea): string[] => {
      return tarea.dependencias || tarea.dependsOn || [];
    };
    
    // Mapear tareas visibles por ID para acceso rápido
    const tareasMap = new Map(tareasVisibles.map(t => [t.id, t]));
    
    // Renderizar conexiones basadas en dependencias reales
    tareasVisibles.forEach((tareaDestino, indexDestino) => {
      const dependencias = getDependencies(tareaDestino);
      
      dependencias.forEach((dependenciaId, depIndex) => {
        const tareaOrigen = tareasMap.get(dependenciaId);
        
        if (tareaOrigen) {
          const indexOrigen = tareasVisibles.findIndex(t => t.id === dependenciaId);
          
          // Calcular posiciones con stagger vertical
          const staggerOffset = indexOrigen % 2 === 0 ? -40 : 40; // Alternar arriba/abajo
          const staggerDestino = indexDestino % 2 === 0 ? -40 : 40;
          
          const x1 = (indexOrigen * 300) + 235; // Centro derecho origen (230px + 5px margen)
          const x2 = (indexDestino * 300) + 5;  // Centro izquierdo destino
          const y1 = 260 + staggerOffset;       // Centro vertical con stagger
          const y2 = 260 + staggerDestino;
          
          // Offset para evitar solapamiento en fan-out/fan-in
          const verticalOffset = depIndex * 12 - (dependencias.length - 1) * 6;
          
          // Curva Bezier tipo n8n
          const controlPointX1 = x1 + 60;
          const controlPointY1 = y1 + verticalOffset;
          const controlPointX2 = x2 - 60;
          const controlPointY2 = y2 + verticalOffset;
          
          conexiones.push(
            <path
              key={`${dependenciaId}-${tareaDestino.id}-${depIndex}`}
              d={`M ${x1},${y1} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${x2},${y2}`}
              stroke="#f4e27e"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
              strokeLinecap="round"
            />
          );
        }
      });
    });
    
    return conexiones;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controles superiores */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg" style={{backgroundColor: '#f5f7fa', border: '1px solid #dce3ea'}}>
        <div className="flex items-center space-x-4">
          {/* Selector de vista */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" style={{color: '#1B263B'}} />
            <select
              value={vistaActual}
              onChange={(e) => setVistaActual(e.target.value as VistaTimeline)}
              className="px-3 py-1 rounded border text-sm"
              style={{borderColor: '#d3dae3', backgroundColor: '#ffffff', color: '#1B263B'}}
            >
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
              <option value="total">Total Obra</option>
            </select>
          </div>
          
          {/* Controles de zoom */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1 rounded hover:bg-white transition-colors"
              style={{color: '#1B263B'}}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm" style={{color: '#1B263B'}}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-1 rounded hover:bg-white transition-colors"
              style={{color: '#1B263B'}}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onEditarPlanificacion}
            className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-all duration-300 ease-in-out"
            style={{backgroundColor: '#1B263B', color: 'white'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#162033';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1B263B';
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Editar planificación (Gantt)</span>
          </button>
          
          <button
            onClick={onVerDependencias}
            className="flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-all duration-300 ease-in-out"
            style={{backgroundColor: '#f5f7fa', color: '#1B263B', border: '1px solid #dce3ea'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e8ecf0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
          >
            <GitBranch className="h-4 w-4" />
            <span>Ver dependencias</span>
          </button>
        </div>
      </div>

      {/* Timeline principal - Vista N8N */}
      <div 
        ref={timelineRef}
        className="relative overflow-x-auto rounded-lg border"
        style={{
          backgroundColor: '#f5f7fa', 
          borderColor: '#d3dae3', 
          height: '520px'
        }}
      >
        {/* Fondo limpio para el flujo */}
        <div className="absolute top-0 left-0 right-0 bottom-0" style={{backgroundColor: '#f5f7fa'}}></div>

        {/* SVG para conexiones entre módulos */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          style={{
            zIndex: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          {renderConnections()}
        </svg>

        {/* Canvas con zoom local */}
        <div 
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Contenedor de tareas con stagger vertical */}
          <div className="relative h-full px-8 py-8">
            <div className="flex items-start justify-start h-full">
              {(() => {
                const tareasOrdenadas = tareas.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
                const tareasVisibles = tareasOrdenadas.slice(currentPage * 5, (currentPage + 1) * 5);
                
                return tareasVisibles.map((tarea, index) => {
                  const estadoStyle = getEstadoColor(tarea.estado, tarea.etapa);
                  
                  // Stagger vertical: alternar arriba/abajo
                  const staggerOffset = index % 2 === 0 ? 0 : 80;
                  
                  return (
                    <div
                      key={tarea.id}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${index * 300}px`,
                        top: `${staggerOffset}px`,
                        zIndex: 1
                      }}
                      onClick={() => onTareaClick(tarea)}
                      onMouseEnter={(e) => handleTareaMouseEnter(tarea, e)}
                      onMouseLeave={handleTareaMouseLeave}
                    >
                  {/* Tarjeta compacta (-30%) */}
                  <div
                    className="rounded-lg p-4 shadow-sm"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d3dae3',
                      boxShadow: '0 4px 10px rgba(27, 38, 59, 0.08)',
                      borderRadius: '10px',
                      width: '230px',
                      height: '110px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(27, 38, 59, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(27, 38, 59, 0.08)';
                    }}
                  >
                    {/* Título del módulo */}
                    <h4 className="font-semibold text-sm mb-2 leading-tight truncate" style={{color: '#1B263B'}}>
                      {tarea.nombre}
                    </h4>
                    
                    {/* Información secundaria compacta */}
                    <div className="mb-2">
                      <p className="text-xs mb-1" style={{color: '#4a4e57'}}>
                        {new Date(tarea.fechaInicio).toLocaleDateString('es-AR')} - {new Date(tarea.fechaFin).toLocaleDateString('es-AR')}
                      </p>
                      <p className="text-xs truncate" style={{color: '#4a4e57'}}>
                        {tarea.lider}
                      </p>
                    </div>
                    
                    {/* Estado y progreso compactos */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="capitalize text-xs px-2 py-1 rounded-full font-medium" style={{
                        backgroundColor: tarea.estado === 'completada' ? '#f5f7fa' : 
                                       tarea.estado === 'en_progreso' ? '#eaf0f6' : '#ffffff',
                        color: tarea.estado === 'completada' ? '#f4e27e' : 
                               tarea.estado === 'en_progreso' ? '#1B263B' : '#9aa3af',
                        border: '1px solid #d3dae3'
                      }}>
                        {tarea.estado.replace('_', ' ')}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{color: '#f4e27e'}}>
                          {tarea.progreso}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Barra de progreso refinada */}
                    <div className="w-full h-1 rounded-sm" style={{backgroundColor: '#eaf0f6'}}>
                      <div
                        className="h-1 rounded-sm transition-all duration-250 ease-in-out"
                        style={{
                          width: `${tarea.progreso}%`,
                          backgroundColor: '#f4e27e',
                          borderRadius: '2px'
                        }}
                      ></div>
                    </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Navegación Prev/Next */}
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-3 rounded-full transition-all duration-250 ease-in-out"
            style={{
              backgroundColor: currentPage === 0 ? '#eaf0f6' : '#ffffff',
              border: '1px solid #d3dae3',
              color: currentPage === 0 ? '#9aa3af' : '#1B263B'
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
          <button
            onClick={() => setCurrentPage(Math.min(Math.floor(tareas.length / 5), currentPage + 1))}
            disabled={currentPage >= Math.floor(tareas.length / 5)}
            className="p-3 rounded-full transition-all duration-250 ease-in-out"
            style={{
              backgroundColor: currentPage >= Math.floor(tareas.length / 5) ? '#eaf0f6' : '#ffffff',
              border: '1px solid #d3dae3',
              color: currentPage >= Math.floor(tareas.length / 5) ? '#9aa3af' : '#1B263B'
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de página */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(tareas.length / 5) }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-250 ease-in-out"
                style={{
                  backgroundColor: i === currentPage ? '#f4e27e' : '#d3dae3'
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Tooltip minimalista */}
      {hoveredTarea && (
        <div
          ref={tooltipRef}
          className="fixed z-50 p-3 rounded-lg shadow-lg border transition-all duration-250 ease-in-out"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            backgroundColor: '#ffffff',
            borderColor: '#f4e27e',
            color: '#1B263B',
            minWidth: '180px',
            border: '1px solid #f4e27e'
          }}
        >
          {(() => {
            const tarea = tareas.find(t => t.id === hoveredTarea);
            if (!tarea) return null;
            
            return (
              <div>
                <h4 className="font-semibold text-sm mb-2" style={{color: '#1B263B'}}>{tarea.nombre}</h4>
                <div className="space-y-1 text-xs">
                  <div style={{color: '#5b5f6a'}}><strong>Responsable:</strong> {tarea.lider}</div>
                  <div style={{color: '#5b5f6a'}}><strong>Fechas:</strong> {new Date(tarea.fechaInicio).toLocaleDateString('es-AR')} - {new Date(tarea.fechaFin).toLocaleDateString('es-AR')}</div>
                  <div style={{color: '#5b5f6a'}}><strong>Progreso:</strong> {tarea.progreso}%</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
