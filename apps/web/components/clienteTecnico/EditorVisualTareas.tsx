'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  X, 
  Save, 
  Settings, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Move,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  plantilla: string;
  checklist: string[];
  evidencias: string[];
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  precedencia: string[];
  duracion: number;
  esCritica: boolean;
  holgura: number; // LS - ES
  earlyStart: number; // ES
  earlyFinish: number; // EF
  lateStart: number; // LS
  lateFinish: number; // LF
  x: number;
  y: number;
}

interface Conexion {
  id: string;
  desde: string;
  hasta: string;
}

interface EditorVisualTareasProps {
  tareas: Tarea[];
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  onActualizarTarea: (tarea: Tarea) => void;
  onEliminarTarea: (tareaId: string) => void;
  onCrearTarea: (tarea: Omit<Tarea, 'id' | 'x' | 'y'>) => void;
}

export function EditorVisualTareas({ 
  tareas, 
  etapa, 
  onActualizarTarea, 
  onEliminarTarea, 
  onCrearTarea 
}: EditorVisualTareasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodos, setNodos] = useState<Tarea[]>(tareas);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<Tarea | null>(null);
  const [nodoEditando, setNodoEditando] = useState<Tarea | null>(null);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [conexionCreando, setConexionCreando] = useState<{ desde: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Colores por etapa
  const getColorEtapa = (etapa: string) => {
    switch (etapa) {
      case 'estructura':
        return 'bg-blue-500';
      case 'obra_gris':
        return 'bg-gray-500';
      case 'terminaciones':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'bloqueada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getIconoEstado = (estado: string) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="h-3 w-3" />;
      case 'en_progreso':
        return <Play className="h-3 w-3" />;
      case 'bloqueada':
        return <Pause className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Algoritmo CPM completo con Early Start/Finish y Late Start/Finish
  const calcularCaminoCritico = useCallback((tareas: Tarea[]) => {
    const tareasConCPM = [...tareas];
    
    // Inicializar tiempos
    tareasConCPM.forEach(tarea => {
      tarea.earlyStart = 0;
      tarea.earlyFinish = 0;
      tarea.lateStart = 0;
      tarea.lateFinish = 0;
      tarea.holgura = 0;
      tarea.esCritica = false;
    });

    // Forward Pass - Calcular Early Start (ES) y Early Finish (EF)
    const calcularEarlyTimes = (tarea: Tarea) => {
      if (tarea.earlyStart > 0) return tarea.earlyStart;
      
      let maxEarlyFinish = 0;
      tarea.precedencia.forEach(idPrecedencia => {
        const tareaPrecedencia = tareasConCPM.find(t => t.id === idPrecedencia);
        if (tareaPrecedencia) {
          const esPrecedencia = calcularEarlyTimes(tareaPrecedencia);
          const efPrecedencia = esPrecedencia + tareaPrecedencia.duracion;
          maxEarlyFinish = Math.max(maxEarlyFinish, efPrecedencia);
        }
      });
      
      tarea.earlyStart = maxEarlyFinish;
      tarea.earlyFinish = tarea.earlyStart + tarea.duracion;
      return tarea.earlyStart;
    };

    // Backward Pass - Calcular Late Start (LS) y Late Finish (LF)
    const calcularLateTimes = (tarea: Tarea) => {
      if (tarea.lateStart > 0) return tarea.lateStart;
      
      // Encontrar tareas que dependen de esta
      const tareasDependientes = tareasConCPM.filter(t => t.precedencia.includes(tarea.id));
      
      if (tareasDependientes.length === 0) {
        // Tarea final - LF = EF del proyecto
        const proyectoEF = Math.max(...tareasConCPM.map(t => t.earlyFinish));
        tarea.lateFinish = proyectoEF;
        tarea.lateStart = tarea.lateFinish - tarea.duracion;
      } else {
        // LF = mÃ­nimo LS de las tareas dependientes
        let minLateStart = Infinity;
        tareasDependientes.forEach(tareaDep => {
          const lsDependiente = calcularLateTimes(tareaDep);
          minLateStart = Math.min(minLateStart, lsDependiente);
        });
        tarea.lateFinish = minLateStart;
        tarea.lateStart = tarea.lateFinish - tarea.duracion;
      }
      
      return tarea.lateStart;
    };

    // Ejecutar cÃ¡lculos
    tareasConCPM.forEach(calcularEarlyTimes);
    tareasConCPM.forEach(calcularLateTimes);

    // Calcular holgura y identificar camino crÃ­tico
    tareasConCPM.forEach(tarea => {
      tarea.holgura = tarea.lateStart - tarea.earlyStart;
      tarea.esCritica = tarea.holgura === 0;
    });

    return tareasConCPM;
  }, []);

  // Actualizar nodos cuando cambien las tareas
  useEffect(() => {
    const tareasConPosicion = tareas.map((tarea, index) => ({
      ...tarea,
      x: tarea.x || 100 + (index % 3) * 200,
      y: tarea.y || 100 + Math.floor(index / 3) * 150
    }));
    setNodos(calcularCaminoCritico(tareasConPosicion));
  }, [tareas, calcularCaminoCritico]);

  // Generar conexiones desde precedencias
  useEffect(() => {
    const nuevasConexiones: Conexion[] = [];
    nodos.forEach(nodo => {
      nodo.precedencia.forEach(idPrecedencia => {
        nuevasConexiones.push({
          id: `${idPrecedencia}-${nodo.id}`,
          desde: idPrecedencia,
          hasta: nodo.id
        });
      });
    });
    setConexiones(nuevasConexiones);
  }, [nodos]);

  // Obtener tiempo total del proyecto
  const obtenerTiempoTotalProyecto = () => {
    return Math.max(...nodos.map(t => t.earlyFinish));
  };

  // Obtener tareas crÃ­ticas
  const obtenerTareasCriticas = () => {
    return nodos.filter(t => t.esCritica);
  };

  // Obtener tareas con holgura
  const obtenerTareasConHolgura = () => {
    return nodos.filter(t => !t.esCritica && t.holgura > 0);
  };

  // Manejar drag del canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomStep = 0.1;
    setZoom((prevZoom) => {
      const nextZoom = e.deltaY < 0
        ? Math.min(2, prevZoom + zoomStep)
        : Math.max(0.5, prevZoom - zoomStep);
      return Number(nextZoom.toFixed(2));
    });
  };

  // Manejar clic en nodos
  const handleNodoClick = (e: React.MouseEvent, nodo: Tarea) => {
    e.stopPropagation();
    setNodoSeleccionado(nodo);
    setNodoEditando(nodo);
  };

  // Manejar drag de nodos
  const handleNodoMouseDown = (e: React.MouseEvent, nodo: Tarea) => {
    e.stopPropagation();
    setNodoSeleccionado(nodo);
    
    const startX = e.clientX - nodo.x;
    const startY = e.clientY - nodo.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      setNodos(prev => prev.map(n => 
        n.id === nodo.id ? { ...n, x: newX, y: newY } : n
      ));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Crear nueva tarea
  const handleCrearTarea = (datosTarea: any) => {
    const nuevaTarea: Omit<Tarea, 'id' | 'x' | 'y'> = {
      nombre: datosTarea.nombre,
      obraId: tareas[0]?.obraId || '',
      lider: datosTarea.lider,
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date(Date.now() + datosTarea.duracion * 24 * 60 * 60 * 1000).toISOString(),
      plantilla: '',
      checklist: datosTarea.checklist || [],
      evidencias: [],
      estado: 'pendiente',
      etapa: datosTarea.etapa,
      precedencia: [],
      duracion: datosTarea.duracion,
      esCritica: false,
      holgura: 0,
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0
    };

    onCrearTarea(nuevaTarea);
    setShowModalCrear(false);
  };

  // Eliminar tarea
  const handleEliminarTarea = (nodoId: string) => {
    if (confirm('Â¿EstÃ¡s seguro de que quieres eliminar esta tarea?')) {
      onEliminarTarea(nodoId);
      setNodoSeleccionado(null);
    }
  };

  // Renderizar conexiones SVG
  const renderConexiones = () => {
    return conexiones.map(conexion => {
      const nodoDesde = nodos.find(n => n.id === conexion.desde);
      const nodoHasta = nodos.find(n => n.id === conexion.hasta);
      
      if (!nodoDesde || !nodoHasta) return null;

      const x1 = nodoDesde.x + 100; // Centro del nodo
      const y1 = nodoDesde.y + 30;
      const x2 = nodoHasta.x + 100;
      const y2 = nodoHasta.y + 30;

      const esCritica = nodoDesde.esCritica && nodoHasta.esCritica;

      return (
        <g key={conexion.id}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={esCritica ? '#ef4444' : '#6b7280'}
            strokeWidth={esCritica ? 3 : 2}
            markerEnd="url(#arrowhead)"
          />
          {/* Flecha */}
          <polygon
            points={`${x2-5},${y2-3} ${x2},${y2} ${x2-5},${y2+3}`}
            fill={esCritica ? '#ef4444' : '#6b7280'}
          />
        </g>
      );
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Panel lateral mejorado */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
        {/* Header del panel */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Editor Visual</h3>
            <div className="flex space-x-2">
            <button
              onClick={handleCrearTarea}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Crear nueva tarea"
            >
              <Plus className="h-4 w-4" />
            </button>
              <button
                onClick={() => setOffset({ x: 0, y: 0 })}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Centrar vista"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* EstadÃ­sticas del proyecto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-blue-600 font-medium">Tiempo Total</div>
              <div className="text-lg font-bold text-blue-900">{obtenerTiempoTotalProyecto()}d</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xs text-green-600 font-medium">Tareas</div>
              <div className="text-lg font-bold text-green-900">{nodos.length}</div>
            </div>
          </div>
          </div>

        {/* Controles de zoom */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Zoom</span>
            <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${((zoom - 0.5) / 1.5) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            </div>
          </div>

        {/* Lista de tareas */}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
            {nodos.map((tarea) => (
              <div
                key={tarea.id}
                onClick={() => setNodoSeleccionado(tarea)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  nodoSeleccionado?.id === tarea.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getColorEstado(tarea.estado).split(' ')[0]}`}></div>
                    <span className="text-sm font-medium text-gray-900 truncate">{tarea.nombre}</span>
                  </div>
                  <div className="flex space-x-1">
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNodoEditando(tarea);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                </button>
                <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarTarea(tarea.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{tarea.duracion}d</span>
                  </div>
                  <div className="mt-1">{tarea.lider}</div>
                </div>
              </div>
            ))}
            </div>
        </div>
      </div>

      {/* Canvas principal */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar superior */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <button
              onClick={() => setOffset({ x: 0, y: 0 })}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Centrar vista"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas SVG */}
        <div
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          <svg
            width="100%"
            height="100%"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
            {/* Definir marcadores de flecha */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>

            {/* Renderizar conexiones */}
            {renderConexiones()}

            {/* Renderizar nodos */}
            {nodos.map((tarea) => (
              <g key={tarea.id}>
                {/* Nodo principal */}
                <rect
                  x={tarea.x}
                  y={tarea.y}
                  width="200"
                  height="80"
                  rx="8"
                  ry="8"
                  fill="white"
                  stroke={nodoSeleccionado?.id === tarea.id ? '#3b82f6' : '#e5e7eb'}
                  strokeWidth={nodoSeleccionado?.id === tarea.id ? '2' : '1'}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setNodoSeleccionado(tarea)}
                />

                {/* Indicador de estado */}
                <rect
                  x={tarea.x + 8}
                  y={tarea.y + 8}
                  width="4"
                  height="4"
                  rx="2"
                  fill={tarea.estado === 'completada' ? '#10b981' : 
                        tarea.estado === 'en_progreso' ? '#3b82f6' : 
                        tarea.estado === 'bloqueada' ? '#ef4444' : '#f59e0b'}
                />

                {/* Nombre de la tarea */}
                <text
                  x={tarea.x + 20}
                  y={tarea.y + 20}
                  fontSize="12"
                  fontWeight="600"
                  fill="#111827"
                  className="select-none"
                >
                  {tarea.nombre.length > 20 ? tarea.nombre.substring(0, 20) + '...' : tarea.nombre}
                </text>

                {/* DuraciÃ³n */}
                <text
                  x={tarea.x + 20}
                  y={tarea.y + 35}
                  fontSize="10"
                  fill="#6b7280"
                  className="select-none"
                >
                  {tarea.duracion} dÃ­as
                </text>

                {/* LÃ­der */}
                <text
                  x={tarea.x + 20}
                  y={tarea.y + 50}
                  fontSize="10"
                  fill="#6b7280"
                  className="select-none"
                >
                  {tarea.lider}
                </text>

                {/* Indicador crÃ­tico */}
                {tarea.esCritica && (
                  <circle
                    cx={tarea.x + 190}
                    cy={tarea.y + 20}
                    r="6"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}

                {/* Puntos de conexiÃ³n */}
                <circle
                  cx={tarea.x + 100}
                  cy={tarea.y}
                  r="4"
                  fill="#3b82f6"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConexionCreando({ desde: tarea.id, x: tarea.x + 100, y: tarea.y });
                  }}
                />
                <circle
                  cx={tarea.x + 100}
                  cy={tarea.y + 80}
                  r="4"
                  fill="#3b82f6"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConexionCreando({ desde: tarea.id, x: tarea.x + 100, y: tarea.y + 80 });
                  }}
                />
              </g>
            ))}

            {/* LÃ­nea de conexiÃ³n temporal */}
            {conexionCreando && (
              <line
                x1={conexionCreando.x}
                y1={conexionCreando.y}
                x2={conexionCreando.x}
                y2={conexionCreando.y}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

