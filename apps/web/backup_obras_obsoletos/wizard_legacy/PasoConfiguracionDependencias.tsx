'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Trash2, RotateCcw, Play, Pause } from 'lucide-react';
import { TareaGenerada } from '../WizardCrearObra';

interface PasoConfiguracionDependenciasProps {
  tareas: TareaGenerada[];
  onTareasChange: (tareas: TareaGenerada[]) => void;
}

interface NodoTarea {
  id: string;
  x: number;
  y: number;
  tarea: TareaGenerada;
  isSelected: boolean;
}

interface Conexion {
  id: string;
  desde: string;
  hasta: string;
  isCritica: boolean;
}

export function PasoConfiguracionDependencias({ tareas, onTareasChange }: PasoConfiguracionDependenciasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodos, setNodos] = useState<NodoTarea[]>([]);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [nodoInicio, setNodoInicio] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [caminoCritico, setCaminoCritico] = useState<string[]>([]);

  // Inicializar nodos basados en las tareas
  useEffect(() => {
    const nuevosNodos: NodoTarea[] = tareas.map((tarea, index) => ({
      id: tarea.id,
      x: 100 + (index % 4) * 200,
      y: 100 + Math.floor(index / 4) * 150,
      tarea,
      isSelected: false
    }));
    setNodos(nuevosNodos);
  }, [tareas]);

  // Calcular camino crítico
  useEffect(() => {
    const calcularCaminoCritico = () => {
      // Algoritmo simplificado para encontrar el camino crítico
      const tareasCriticas = tareas.filter(t => t.esCritica);
      const camino = tareasCriticas.map(t => t.id);
      setCaminoCritico(camino);
    };

    calcularCaminoCritico();
  }, [tareas]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar conexiones
    conexiones.forEach(conexion => {
      const nodoDesde = nodos.find(n => n.id === conexion.desde);
      const nodoHasta = nodos.find(n => n.id === conexion.hasta);
      
      if (nodoDesde && nodoHasta) {
        ctx.strokeStyle = conexion.isCritica ? '#ef4444' : '#6b7280';
        ctx.lineWidth = conexion.isCritica ? 3 : 2;
        ctx.setLineDash(conexion.isCritica ? [] : [5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(nodoDesde.x + 50, nodoDesde.y + 25);
        ctx.lineTo(nodoHasta.x + 50, nodoHasta.y + 25);
        ctx.stroke();
        
        // Dibujar flecha
        const angle = Math.atan2(nodoHasta.y - nodoDesde.y, nodoHasta.x - nodoDesde.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        ctx.beginPath();
        ctx.moveTo(nodoHasta.x + 50, nodoHasta.y + 25);
        ctx.lineTo(
          nodoHasta.x + 50 - arrowLength * Math.cos(angle - arrowAngle),
          nodoHasta.y + 25 - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(nodoHasta.x + 50, nodoHasta.y + 25);
        ctx.lineTo(
          nodoHasta.x + 50 - arrowLength * Math.cos(angle + arrowAngle),
          nodoHasta.y + 25 - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
      }
    });

    // Dibujar nodos
    nodos.forEach(nodo => {
      // Fondo del nodo
      ctx.fillStyle = nodo.isSelected ? '#3b82f6' : '#f3f4f6';
      ctx.fillRect(nodo.x, nodo.y, 100, 50);
      
      // Borde del nodo
      ctx.strokeStyle = nodo.isSelected ? '#1d4ed8' : '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(nodo.x, nodo.y, 100, 50);
      
      // Texto del nodo
      ctx.fillStyle = nodo.isSelected ? '#ffffff' : '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        nodo.tarea.nombre.length > 15 
          ? nodo.tarea.nombre.substring(0, 15) + '...' 
          : nodo.tarea.nombre,
        nodo.x + 50,
        nodo.y + 20
      );
      
      // Duración
      ctx.font = '10px Arial';
      ctx.fillText(
        `${nodo.tarea.duracion}d`,
        nodo.x + 50,
        nodo.y + 35
      );
      
      // Indicador de tarea crítica
      if (nodo.tarea.esCritica) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(nodo.x + 90, nodo.y + 10, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    drawCanvas();
  }, [nodos, conexiones]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Buscar nodo clickeado
    const nodoClickeado = nodos.find(nodo => 
      x >= nodo.x && x <= nodo.x + 100 && 
      y >= nodo.y && y <= nodo.y + 50
    );

    if (nodoClickeado) {
      if (nodoInicio) {
        // Crear conexión
        if (nodoInicio !== nodoClickeado.id) {
          const nuevaConexion: Conexion = {
            id: `${nodoInicio}-${nodoClickeado.id}`,
            desde: nodoInicio,
            hasta: nodoClickeado.id,
            isCritica: false
          };
          
          // Verificar si ya existe la conexión
          const existeConexion = conexiones.some(c => 
            (c.desde === nodoInicio && c.hasta === nodoClickeado.id) ||
            (c.desde === nodoClickeado.id && c.hasta === nodoInicio)
          );
          
          if (!existeConexion) {
            setConexiones([...conexiones, nuevaConexion]);
          }
        }
        setNodoInicio(null);
      } else {
        // Seleccionar nodo para conectar
        setNodoInicio(nodoClickeado.id);
        setNodos(nodos.map(n => ({ ...n, isSelected: n.id === nodoClickeado.id })));
      }
    } else {
      // Deseleccionar todos los nodos
      setNodos(nodos.map(n => ({ ...n, isSelected: false })));
      setNodoInicio(null);
    }
  };

  const handleEliminarConexion = (conexionId: string) => {
    setConexiones(conexiones.filter(c => c.id !== conexionId));
  };

  const handleToggleCritica = (conexionId: string) => {
    setConexiones(conexiones.map(c => 
      c.id === conexionId ? { ...c, isCritica: !c.isCritica } : c
    ));
  };

  const handleAnimarCamino = () => {
    setIsAnimating(!isAnimating);
  };

  const handleReset = () => {
    setConexiones([]);
    setNodoInicio(null);
    setNodos(nodos.map(n => ({ ...n, isSelected: false })));
  };

  const duracionTotal = tareas.reduce((total, tarea) => total + tarea.duracion, 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primario mb-2">Configuración de Dependencias</h3>
          <p className="text-primario/70">
            Define las dependencias entre tareas arrastrando desde un nodo a otro
          </p>
        </div>

        {/* Controles */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleAnimarCamino}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isAnimating 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isAnimating ? 'Pausar' : 'Animar'} Camino</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Resetear</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{tareas.length}</span> tareas • 
              <span className="font-medium ml-1">{conexiones.length}</span> conexiones • 
              <span className="font-medium ml-1">{duracionTotal}</span> días totales
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas principal */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-primario">Canvas de Dependencias</h4>
                <p className="text-sm text-gray-600">
                  Haz clic en un nodo para seleccionarlo, luego en otro para crear una conexión
                </p>
              </div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  onClick={handleCanvasClick}
                  className="w-full h-[600px] cursor-crosshair"
                />
                {nodoInicio && (
                  <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                    Nodo seleccionado. Haz clic en otro nodo para conectar.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Leyenda */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-primario mb-3">Leyenda</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                    <span>Nodo normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                    <span>Nodo seleccionado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-gray-400 border-dashed"></div>
                    <span>Conexión normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-0.5 bg-red-500"></div>
                    <span>Conexión crítica</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Tarea crítica</span>
                  </div>
                </div>
              </div>

              {/* Conexiones */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-primario mb-3">Conexiones</h4>
                {conexiones.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay conexiones creadas</p>
                ) : (
                  <div className="space-y-2">
                    {conexiones.map(conexion => {
                      const nodoDesde = nodos.find(n => n.id === conexion.desde);
                      const nodoHasta = nodos.find(n => n.id === conexion.hasta);
                      
                      return (
                        <div key={conexion.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-primario">
                              {nodoDesde?.tarea.nombre} → {nodoHasta?.tarea.nombre}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <button
                                onClick={() => handleToggleCritica(conexion.id)}
                                className={`text-xs px-2 py-1 rounded ${
                                  conexion.isCritica 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {conexion.isCritica ? 'Crítica' : 'Normal'}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEliminarConexion(conexion.id)}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Camino crítico */}
              {caminoCritico.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Camino Crítico</h4>
                  <div className="space-y-1">
                    {caminoCritico.map(tareaId => {
                      const tarea = tareas.find(t => t.id === tareaId);
                      return (
                        <div key={tareaId} className="text-sm text-red-700">
                          • {tarea?.nombre}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

