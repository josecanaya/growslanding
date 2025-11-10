'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Circle,
  Link2,
  X,
  Check
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
  holgura: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  x: number;
  y: number;
  dependencias?: string[];
}

interface EditorVisualTareasProps {
  tareas: Tarea[];
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  onActualizarTarea: (tarea: Tarea) => void;
  onEliminarTarea: (tareaId: string) => void;
  onCrearTarea: (tarea: Omit<Tarea, 'id' | 'x' | 'y'>) => void;
}

export function EditorVisualTareas({ 
  tareas: tareasIniciales, 
  etapa, 
  onActualizarTarea, 
  onEliminarTarea, 
  onCrearTarea 
}: EditorVisualTareasProps) {
  console.log('🚀 COMPONENTE ACTUALIZADO - EditorVisualTareas con FILTROS, PRECARGA y EDICIÓN');
  console.log('📊 Tareas recibidas:', tareasIniciales.length, tareasIniciales);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodos, setNodos] = useState<Tarea[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);

  // Colores por etapa
  const getColorEtapa = (etapa: string) => {
    switch (etapa) {
      case 'estructura':
        return '#4A6FA5'; // Azul pálido
      case 'obra_gris':
        return '#555A5F'; // Gris
      case 'terminaciones':
        return '#2ECC71'; // Verde
      default:
        return '#dce0e5';
    }
  };

  // Color del estado
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'completada':
        return '#2ecc71';
      case 'en_progreso':
        return '#f4e27e';
      case 'pendiente':
        return '#e67e22';
      case 'bloqueada':
        return '#e74c3c';
      default:
        return '#dce0e5';
    }
  };

  // Precarga lógica por etapas
  const precargaLogicaPorEtapas = useCallback((tareas: Tarea[]) => {
    const ordenEtapas = ['estructura', 'obra_gris', 'terminaciones'];
    const posicionesIniciales = {
      'estructura': { x: 100, y: 100 },
      'obra_gris': { x: 800, y: 100 },
      'terminaciones': { x: 1500, y: 100 }
    };
    
    const tareasConPosicion: Tarea[] = [];
    
    ordenEtapas.forEach((etapaActual) => {
      const tareasEtapa = tareas.filter(t => t.etapa === etapaActual);
      const posInicial = posicionesIniciales[etapaActual as keyof typeof posicionesIniciales];
      
      let offsetY = 0;
      
      tareasEtapa.forEach((tarea, index) => {
        const deps = tarea.dependencias || [];
        let x = posInicial.x;
        let y = posInicial.y + offsetY;
        
        // Si tiene dependencias, calcular posición relativa
        if (deps.length > 0) {
          const tareasDepYaCargadas = tareasConPosicion.filter(t => deps.includes(t.id));
          
          if (tareasDepYaCargadas.length > 0) {
            const maxX = Math.max(...tareasDepYaCargadas.map(t => t.x));
            const avgY = tareasDepYaCargadas.reduce((sum, t) => sum + t.y, 0) / tareasDepYaCargadas.length;
            
            x = maxX + 300;
            y = avgY;
          }
        }
        
        tareasConPosicion.push({
          ...tarea,
          x: tarea.x || x,
          y: tarea.y || y
        });
        
        offsetY += 150;
      });
    });
    
    return tareasConPosicion;
  }, []);

  // Layout inicial
  useEffect(() => {
    console.log('🎨 Aplicando layout a', tareasIniciales.length, 'tareas');
    if (tareasIniciales.length > 0) {
      const nodosConPosicion = precargaLogicaPorEtapas(tareasIniciales);
      console.log('✅ Nodos posicionados:', nodosConPosicion.length, nodosConPosicion);
      setNodos(nodosConPosicion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareasIniciales]);

  // Tareas visibles según filtro
  const tareasVisibles = filtroEtapa
    ? nodos.filter(t => t.etapa === filtroEtapa)
    : nodos;

  // Renderizar conexiones
  const renderConexiones = () => {
    const conexiones: JSX.Element[] = [];
    
    tareasVisibles.forEach(tarea => {
      const deps = tarea.dependencias || [];
      
      deps.forEach((dependenciaId, index) => {
        const tareaOrigen = nodos.find(t => t.id === dependenciaId);
        
        // Solo mostrar si ambos nodos están visibles
        const origenVisible = tareasVisibles.some(t => t.id === dependenciaId);
        if (!tareaOrigen || !origenVisible) return;
        
        const x1 = tareaOrigen.x + 230;
        const y1 = tareaOrigen.y + 50;
        const x2 = tarea.x;
        const y2 = tarea.y + 50;
        
        const offsetY = (index - (deps.length - 1) / 2) * 15;
        const controlPointX1 = x1 + 100;
        const controlPointY1 = y1 + offsetY;
        const controlPointX2 = x2 - 100;
        const controlPointY2 = y2 + offsetY;
        
        const path = `M ${x1},${y1} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${x2},${y2}`;
        
        conexiones.push(
          <path
            key={`${dependenciaId}-${tarea.id}-${index}`}
            d={path}
            stroke="#f4e27e"
            strokeWidth="2.5"
            fill="none"
            opacity="0.9"
            strokeLinecap="round"
          />
        );
      });
    });
    
    return conexiones;
  };

  // Drag & Drop
  const handleMouseDown = (e: React.MouseEvent, tareaId: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedNode(tareaId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedNode) return;

    const deltaX = (e.clientX - dragStart.x) / zoom;
    const deltaY = (e.clientY - dragStart.y) / zoom;

    setNodos(prevNodos => 
      prevNodos.map(nodo => 
        nodo.id === draggedNode 
          ? { ...nodo, x: nodo.x + deltaX, y: nodo.y + deltaY }
          : nodo
      )
    );

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, draggedNode, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Abrir modal de edición
  const handleClickNodo = (tarea: Tarea) => {
    if (!isDragging) {
      setTareaSeleccionada(tarea);
      setModalEdicionAbierto(true);
    }
  };

  // Actualizar dependencias
  const actualizarDependencias = (tareaId: string, nuevasDeps: string[]) => {
    setNodos(prevNodos =>
      prevNodos.map(nodo =>
        nodo.id === tareaId
          ? { ...nodo, dependencias: nuevasDeps }
          : nodo
      )
    );
  };

  // Toggle filtro etapa
  const toggleFiltroEtapa = (etapa: string) => {
    setFiltroEtapa(prev => prev === etapa ? null : etapa);
  };

  // Controles de zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    const nodosConPosicion = precargaLogicaPorEtapas(tareasIniciales);
    setNodos(nodosConPosicion);
  };

  return (
    <div className="h-full w-full relative" style={{backgroundColor: '#eaf0f6'}}>
      {/* Toolbar superior */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border p-2" style={{borderColor: '#dce3ea'}}>
        <div className="flex items-center space-x-4">
          {/* Filtros por etapa */}
          <div className="flex items-center space-x-2 pr-4 border-r" style={{borderColor: '#dce3ea'}}>
            <button
              onClick={() => toggleFiltroEtapa('estructura')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filtroEtapa === 'estructura' ? '#D4A017' : '#f0e0d6',
                color: filtroEtapa === 'estructura' ? 'white' : '#8b4513',
                border: `2px solid ${filtroEtapa === 'estructura' ? '#D4A017' : '#d4af37'}`
              }}
            >
              Estructura
            </button>
            <button
              onClick={() => toggleFiltroEtapa('obra_gris')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filtroEtapa === 'obra_gris' ? '#555A5F' : '#f5f7fa',
                color: filtroEtapa === 'obra_gris' ? 'white' : '#1B263B',
                border: `2px solid ${filtroEtapa === 'obra_gris' ? '#555A5F' : '#dce3ea'}`
              }}
            >
              Obra Gris
            </button>
            <button
              onClick={() => toggleFiltroEtapa('terminaciones')}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filtroEtapa === 'terminaciones' ? '#2ECC71' : '#d4edda',
                color: filtroEtapa === 'terminaciones' ? 'white' : '#155724',
                border: `2px solid ${filtroEtapa === 'terminaciones' ? '#2ECC71' : '#28a745'}`
              }}
            >
              Terminaciones
            </button>
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded transition-colors"
              style={{color: '#1B263B'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[3rem] text-center" style={{color: '#1B263B'}}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded transition-colors"
              style={{color: '#1B263B'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-6" style={{backgroundColor: '#dce3ea'}}></div>
            <button
              onClick={handleReset}
              className="p-2 rounded transition-colors"
              style={{color: '#1B263B'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f7fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>

      {/* Canvas del Editor */}
        <div
          ref={canvasRef}
        className="w-full h-full relative overflow-auto"
        style={{
          background: '#eaf0f6',
          minHeight: '700px'
        }}
        onWheel={(e) => {
          if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
          }
        }}
      >
        {/* SVG para conexiones */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ 
            zIndex: 0,
            minWidth: '2500px',
            minHeight: '1500px'
          }}
        >
          {renderConexiones()}
        </svg>

        {/* Nodos (tareas) */}
        <div 
          className="relative"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            minWidth: '2500px',
            minHeight: '1500px'
          }}
        >
          {tareasVisibles.map((tarea) => (
            <div
              key={tarea.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${tarea.x}px`,
                top: `${tarea.y}px`,
                zIndex: 1
              }}
              onMouseDown={(e) => handleMouseDown(e, tarea.id)}
              onClick={(e) => {
                if (!isDragging) {
                  e.stopPropagation();
                  handleClickNodo(tarea);
                }
              }}
            >
              {/* Nodo de tarea */}
              <div
                className="rounded-lg shadow-sm transition-all"
                style={{
                  width: '230px',
                  height: '100px',
                  backgroundColor: '#ffffff',
                  border: `2px solid ${getColorEtapa(tarea.etapa)}`,
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  padding: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                }}
              >
                <div className="flex items-start mb-2">
                  <Circle 
                    className="w-2 h-2 mt-1 mr-2" 
                    style={{color: getColorEstado(tarea.estado)}}
                    fill={getColorEstado(tarea.estado)}
                  />
                  <h4 className="text-sm font-semibold truncate flex-1" style={{color: '#1B263B'}}>
                    {tarea.nombre}
                  </h4>
                </div>
                
                <p className="text-xs mb-1" style={{color: '#4a4e57'}}>
                  {tarea.lider}
                </p>
                
                <p className="text-xs mb-1" style={{color: '#4a4e57'}}>
                  {tarea.duracion}d
                </p>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: getColorEstado(tarea.estado) + '20',
                      color: getColorEstado(tarea.estado)
                    }}
                  >
                    {tarea.estado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edición de dependencias */}
      {modalEdicionAbierto && tareaSeleccionada && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setModalEdicionAbierto(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{color: '#1B263B'}}>
                Editar Dependencias
              </h3>
              <button
                onClick={() => setModalEdicionAbierto(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2" style={{color: '#1B263B'}}>
                Tarea: {tareaSeleccionada.nombre}
              </p>
              <p className="text-xs mb-2" style={{color: '#5b5f6a'}}>
                Responsable: {tareaSeleccionada.lider}
              </p>
              <p className="text-xs mb-4" style={{color: '#5b5f6a'}}>
                Etapa: {tareaSeleccionada.etapa}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>
                Tareas Previas (Dependencias):
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {nodos
                  .filter(t => t.id !== tareaSeleccionada.id)
                  .map(tarea => {
                    const isSelected = (tareaSeleccionada.dependencias || []).includes(tarea.id);
                    return (
                      <label
                        key={tarea.id}
                        className="flex items-center p-2 rounded cursor-pointer hover:bg-gray-50"
                        style={{
                          backgroundColor: isSelected ? '#f0f9ff' : 'white',
                          border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const deps = tareaSeleccionada.dependencias || [];
                            const newDeps = e.target.checked
                              ? [...deps, tarea.id]
                              : deps.filter(id => id !== tarea.id);
                            actualizarDependencias(tareaSeleccionada.id, newDeps);
                            setTareaSeleccionada({ ...tareaSeleccionada, dependencias: newDeps });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm" style={{color: '#1B263B'}}>
                          {tarea.nombre}
                        </span>
                        <span 
                          className="ml-auto text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: getColorEtapa(tarea.etapa) + '20',
                            color: getColorEtapa(tarea.etapa)
                          }}
                        >
                          {tarea.etapa}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setModalEdicionAbierto(false)}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{backgroundColor: '#1B263B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#162033'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1B263B'}
              >
                <Check className="h-4 w-4 inline mr-2" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
