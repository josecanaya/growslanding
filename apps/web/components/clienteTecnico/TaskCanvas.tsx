'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Circle } from 'lucide-react';

export type TaskCanvasEstado = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
export type TaskCanvasEtapa = 'estructura' | 'obra_gris' | 'terminaciones';

export interface TaskCanvasNode {
  id: string;
  nombre: string;
  lider: string;
  estado: TaskCanvasEstado;
  etapa: TaskCanvasEtapa;
  duracion: number;
  dependencias: string[];
  x?: number;
  y?: number;
}

interface TaskCanvasProps {
  tareas: TaskCanvasNode[];
  onTaskClick: (taskId: string) => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1100;

const getColorEtapa = (etapa: string) => {
  switch (etapa) {
    case 'estructura':
      return '#D4A017';
    case 'obra_gris':
      return '#555A5F';
    case 'terminaciones':
      return '#2ECC71';
    default:
      return '#dce0e5';
  }
};

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

export function TaskCanvas({ tareas, onTaskClick }: TaskCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodos, setNodos] = useState<TaskCanvasNode[]>([]);
  const [zoom, setZoom] = useState(0.9);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const precargarLayout = useCallback(
    (tareasEntrada: TaskCanvasNode[], prevPositions: Map<string, TaskCanvasNode>) => {
      const ordenEtapas: TaskCanvasEtapa[] = ['estructura', 'obra_gris', 'terminaciones'];
      const posicionesIniciales: Record<TaskCanvasEtapa, { x: number; y: number }> = {
        estructura: { x: 120, y: 80 },
        obra_gris: { x: 520, y: 80 },
        terminaciones: { x: 920, y: 80 },
      };

      const tareasConPosicion: TaskCanvasNode[] = [];

      ordenEtapas.forEach((etapaActual) => {
        const tareasEtapa = tareasEntrada.filter((t) => t.etapa === etapaActual);
        const posInicial = posicionesIniciales[etapaActual];
        let offsetY = 0;

        tareasEtapa.forEach((tarea) => {
          const deps = tarea.dependencias || [];
          let x = posInicial.x;
          let y = posInicial.y + offsetY;

          if (deps.length > 0) {
            const dependenciasCargadas = tareasConPosicion.filter((t) => deps.includes(t.id));
            if (dependenciasCargadas.length > 0) {
              const maxX = Math.max(...dependenciasCargadas.map((t) => t.x ?? posInicial.x));
              const avgY =
                dependenciasCargadas.reduce((sum, t) => sum + (t.y ?? posInicial.y), 0) / dependenciasCargadas.length;
              x = maxX + 220;
              y = avgY;
            }
          }

          const previa = prevPositions.get(tarea.id);

          tareasConPosicion.push({
            ...tarea,
            x: previa?.x ?? tarea.x ?? x,
            y: previa?.y ?? tarea.y ?? y,
          });

          offsetY += 120;
        });
      });

      return tareasConPosicion;
    },
    [],
  );

  useEffect(() => {
    if (tareas.length === 0) {
      setNodos([]);
      return;
    }
    setNodos((prev) => {
      const prevMap = new Map(prev.map((nodo) => [nodo.id, nodo]));
      const posicionadas = precargarLayout(tareas, prevMap);
      return posicionadas;
    });
  }, [tareas, precargarLayout]);

  const renderConexiones = () => {
    const conexiones: JSX.Element[] = [];

    nodos.forEach((tarea) => {
      const deps = tarea.dependencias || [];
      deps.forEach((depId, index) => {
        const origen = nodos.find((t) => t.id === depId);
        if (!origen) return;

        const x1 = (origen.x ?? 0) + 230;
        const y1 = (origen.y ?? 0) + 50;
        const x2 = tarea.x ?? 0;
        const y2 = (tarea.y ?? 0) + 50;

        const offsetY = (index - (deps.length - 1) / 2) * 15;
        const controlPointX1 = x1 + 100;
        const controlPointY1 = y1 + offsetY;
        const controlPointX2 = x2 - 100;
        const controlPointY2 = y2 + offsetY;

        const path = `M ${x1},${y1} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${x2},${y2}`;

        conexiones.push(
          <path
            key={`${depId}-${tarea.id}-${index}`}
            d={path}
            stroke="#f4e27e"
            strokeWidth="2.5"
            fill="none"
            opacity="0.9"
            strokeLinecap="round"
          />,
        );
      });
    });

    return conexiones;
  };

  const handleMouseDown = (event: React.MouseEvent, tareaId: string) => {
    event.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    setDraggedNode(tareaId);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !draggedNode) return;

      const deltaX = (event.clientX - dragStart.x) / zoom;
      const deltaY = (event.clientY - dragStart.y) / zoom;

      setNodos((prev) =>
        prev.map((nodo) =>
          nodo.id === draggedNode
            ? {
                ...nodo,
                x: (nodo.x ?? 0) + deltaX,
                y: (nodo.y ?? 0) + deltaY,
              }
            : nodo,
        ),
      );

      setDragStart({ x: event.clientX, y: event.clientY });
      setHasDragged(true);
    },
    [dragStart, draggedNode, isDragging, zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, isDragging]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.6));
  const handleReset = () => {
    setZoom(1);
    const posicionadas = precargarLayout(tareas, new Map<string, TaskCanvasNode>());
    setNodos(posicionadas);
  };

  const handleNodeClick = (tareaId: string) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    onTaskClick(tareaId);
  };

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: '#eaf0f6' }}>
      <div className="absolute left-4 top-4 z-10 rounded-lg border bg-white p-2 shadow-lg" style={{ borderColor: '#dce3ea' }}>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="rounded p-2 transition-colors"
            style={{ color: '#1B263B' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-sm font-medium" style={{ color: '#1B263B' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="rounded p-2 transition-colors"
            style={{ color: '#1B263B' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-6 w-px" style={{ backgroundColor: '#dce3ea' }} />
          <button
            onClick={handleReset}
            className="rounded p-2 transition-colors"
            style={{ color: '#1B263B' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#f5f7fa';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative h-full w-full overflow-auto"
        style={{ background: '#eaf0f6', minHeight: '640px' }}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.1 : 0.1;
          setZoom((prev) => Math.max(0.6, Math.min(1.6, prev + delta)));
        }}
      >
        <div
          className="relative"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ zIndex: 0 }}
          >
            {renderConexiones()}
          </svg>

          {nodos.map((tarea) => (
            <div
              key={tarea.id}
              className="absolute cursor-move select-none"
              style={{
                left: `${tarea.x ?? 0}px`,
                top: `${tarea.y ?? 0}px`,
                zIndex: 1,
              }}
              onMouseDown={(event) => handleMouseDown(event, tarea.id)}
              onClick={(event) => {
                event.stopPropagation();
                handleNodeClick(tarea.id);
              }}
            >
              <div
                className="rounded-lg shadow-sm transition-all"
                style={{
                  width: '230px',
                  height: '100px',
                  backgroundColor: '#ffffff',
                  border: `2px solid ${getColorEtapa(tarea.etapa)}`,
                  borderRadius: '10px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  padding: '12px',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                }}
              >
                <div className="mb-2 flex items-start">
                  <Circle
                    className="mr-2 mt-1 h-2 w-2"
                    style={{ color: getColorEstado(tarea.estado) }}
                    fill={getColorEstado(tarea.estado)}
                  />
                  <h4 className="flex-1 truncate text-sm font-semibold" style={{ color: '#1B263B' }}>
                    {tarea.nombre}
                  </h4>
                </div>

                <p className="mb-1 text-xs" style={{ color: '#4a4e57' }}>
                  {tarea.lider}
                </p>

                <p className="mb-1 text-xs" style={{ color: '#4a4e57' }}>
                  {tarea.duracion}d
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-1 text-xs"
                    style={{
                      backgroundColor: `${getColorEstado(tarea.estado)}20`,
                      color: getColorEstado(tarea.estado),
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
    </div>
  );
}

