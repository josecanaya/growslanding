'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Circle, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

export type TaskCanvasEstado = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
export type TaskCanvasEtapa = 'estructura' | 'obra_gris' | 'terminaciones';

export const CANVAS_COLUMN_WIDTH = 400;
export const CANVAS_ROW_HEIGHT = 150;
export const CANVAS_MARGIN_X = 80;
export const CANVAS_MARGIN_Y = 60;

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
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onPositionChange?: (taskId: string, position: { x: number; y: number }) => void;
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

function TaskNode({
  tarea,
  onMouseDown,
  onDoubleClick,
  onDelete,
}: {
  tarea: TaskCanvasNode;
  onMouseDown: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onDelete?: () => void;
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="absolute cursor-move select-none group"
      style={{
        left: `${tarea.x ?? 0}px`,
        top: `${tarea.y ?? 0}px`,
        zIndex: 1,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="rounded-lg shadow-sm transition-all relative"
        style={{
          width: '230px',
          height: '100px',
          backgroundColor: '#ffffff',
          border: `2px solid ${getColorEtapa(tarea.etapa)}`,
          borderRadius: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          padding: '12px',
        }}
      >
        {isHovering && onDelete && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-opacity hover:bg-red-600"
            style={{ pointerEvents: 'auto' }}
            title="Eliminar nodo"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
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
  );
}

export function TaskCanvas({ tareas, onTaskClick, onTaskDoubleClick, onTaskDelete, onPositionChange }: TaskCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodos, setNodos] = useState<TaskCanvasNode[]>([]);
  const [zoom, setZoom] = useState(0.9);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const nodosRef = useRef<TaskCanvasNode[]>([]);

  useEffect(() => {
    if (tareas.length === 0) {
      setNodos([]);
      nodosRef.current = [];
      return;
    }
    const clones = tareas.map((tarea) => ({ ...tarea }));
    setNodos(clones);
    nodosRef.current = clones;
  }, [tareas]);

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
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    
    // Calcular posición EXACTA del mouse en el espacio del canvas (sin zoom)
    const canvasX = (event.clientX - rect.left + scrollLeft) / zoom;
    const canvasY = (event.clientY - rect.top + scrollTop) / zoom;
    
    const currentNode = nodosRef.current.find((n) => n.id === tareaId);
    if (currentNode) {
      const nodeX = currentNode.x ?? 0;
      const nodeY = currentNode.y ?? 0;
      
      // Guardar el offset del mouse relativo al nodo
      const offsetX = canvasX - nodeX;
      const offsetY = canvasY - nodeY;
      
      setDragStart({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setHasDragged(false);
      setDraggedNode(tareaId);
    }
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !draggedNode || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;
      
      // Calcular posición EXACTA del mouse en el espacio del canvas (sin zoom)
      const canvasX = (event.clientX - rect.left + scrollLeft) / zoom;
      const canvasY = (event.clientY - rect.top + scrollTop) / zoom;
      
      // Aplicar offset para mantener la posición relativa del mouse al nodo
      const newX = canvasX - dragStart.x;
      const newY = canvasY - dragStart.y;

      setNodos((prev) => {
        const updated = prev.map((nodo) =>
          nodo.id === draggedNode
            ? {
                ...nodo,
                x: newX,
                y: newY,
              }
            : nodo,
        );
        nodosRef.current = updated;
        return updated;
      });

      setHasDragged(true);
    },
    [dragStart, draggedNode, isDragging, zoom],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedNode && hasDragged) {
      const updatedNode = nodosRef.current.find((item) => item.id === draggedNode);
      if (updatedNode && updatedNode.x !== undefined && updatedNode.y !== undefined) {
        onPositionChange?.(updatedNode.id, {
          x: updatedNode.x,
          y: updatedNode.y,
        });
      }
    }
    setIsDragging(false);
    setDraggedNode(null);
    setHasDragged(false);
  }, [draggedNode, hasDragged, nodos, onPositionChange]);

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
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0));

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: '#eaf0f6' }}>
      <div
        ref={canvasRef}
        className="relative h-full w-full overflow-auto"
        style={{ background: '#eaf0f6', minHeight: '640px' }}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.1 : 0.1;
          setZoom((prev) => Math.max(0, Math.min(1.6, prev + delta)));
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
            <TaskNode
              key={tarea.id}
              tarea={tarea}
              onMouseDown={(event) => handleMouseDown(event, tarea.id)}
              onDoubleClick={() => onTaskDoubleClick?.(tarea.id)}
              onDelete={() => onTaskDelete?.(tarea.id)}
            />
          ))}
        </div>
      </div>
      <div className="absolute left-4 bottom-4 z-20 rounded-lg border bg-white p-2 shadow-lg" style={{ borderColor: '#dce3ea' }}>
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={handleZoomIn}
            className="rounded p-2 transition-colors hover:bg-gray-100"
            style={{ color: '#1B263B' }}
            title="Acercar (Ctrl+Scroll arriba)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-medium" style={{ color: '#1B263B' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="rounded p-2 transition-colors hover:bg-gray-100"
            style={{ color: '#1B263B' }}
            title="Alejar (Ctrl+Scroll abajo)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

