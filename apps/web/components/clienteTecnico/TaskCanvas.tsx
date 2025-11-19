'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Circle, Trash2, ZoomIn, ZoomOut, MoreVertical, X, Link2, Eye } from 'lucide-react';

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
  dependencias: string[]; // IDs de tareas predecesoras
  x?: number;
  y?: number;
  // Valores CPM (opcionales)
  cpm?: {
    es: number;
    ef: number;
    ls: number;
    lf: number;
    float: number; // float_total
    float_free: number; // float_free
    isCritical: boolean;
  };
}

interface TaskCanvasProps {
  tareas: TaskCanvasNode[];
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onPositionChange?: (taskId: string, position: { x: number; y: number }) => void;
  onConnectionCreate?: (fromTaskId: string, toTaskId: string) => void;
  onConnectionDelete?: (fromTaskId: string, toTaskId: string) => void;
  onAddPrecedence?: (taskId: string) => void;
  onViewDetails?: (taskId: string) => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;
const HANDLE_SIZE = 12;
const HANDLE_OFFSET = 6;

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

interface NodeHandleProps {
  type: 'input' | 'output';
  x: number;
  y: number;
  onMouseDown?: (event: React.MouseEvent) => void;
  isConnecting?: boolean;
}

function NodeHandle({ type, x, y, onMouseDown, isConnecting }: NodeHandleProps) {
  return (
    <g
      className={`cursor-crosshair ${isConnecting ? 'opacity-50' : ''}`}
      onMouseDown={onMouseDown}
      style={{ pointerEvents: 'all' }}
    >
      <circle
        cx={x}
        cy={y}
        r={HANDLE_SIZE / 2}
        fill={isConnecting ? '#e74c3c' : '#ffffff'}
        stroke={isConnecting ? '#e74c3c' : '#4a5568'}
        strokeWidth={2}
        className="transition-all hover:r-7"
      />
      {type === 'input' && (
        <circle cx={x} cy={y} r={HANDLE_SIZE / 2 - 2} fill="#4a5568" />
      )}
    </g>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  onAddPrecedence: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}

function ContextMenu({ x, y, onAddPrecedence, onViewDetails, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg border bg-white shadow-lg py-1"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '180px',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddPrecedence();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Link2 className="h-4 w-4" />
        Agregar precedencia
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Eye className="h-4 w-4" />
        Ver detalles
      </button>
    </div>
  );
}

function TaskNode({
  tarea,
  allTasks,
  onMouseDown,
  onDoubleClick,
  onDelete,
  onConnectionStart,
  onMenuClick,
  onAddPrecedence,
  onViewDetails,
}: {
  tarea: TaskCanvasNode;
  allTasks: TaskCanvasNode[];
  onMouseDown: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onDelete?: () => void;
  onConnectionStart?: (taskId: string, handleType: 'input' | 'output') => void;
  onMenuClick?: (taskId: string, event: React.MouseEvent) => void;
  onAddPrecedence?: (taskId: string) => void;
  onViewDetails?: (taskId: string) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const isCritical = tarea.cpm?.float === 0;
  const borderColor = isCritical ? '#e74c3c' : '#9ca3af';
  const borderWidth = isCritical ? 3 : 2;

  // Obtener nombres de las tareas predecesoras
  const predecesorasNombres = tarea.dependencias.length > 0
    ? tarea.dependencias
        .map((depId) => allTasks.find((t) => t.id === depId)?.nombre)
        .filter((nombre): nombre is string => !!nombre)
    : [];

  // Posiciones de los handles
  const inputHandleX = 0;
  const inputHandleY = NODE_HEIGHT / 2;
  const outputHandleX = NODE_WIDTH;
  const outputHandleY = NODE_HEIGHT / 2;

  const handleInputMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    onConnectionStart?.(tarea.id, 'input');
  };

  const handleOutputMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    onConnectionStart?.(tarea.id, 'output');
  };

  return (
    <div
      ref={nodeRef}
      className="absolute select-none group"
      style={{
        left: `${tarea.x ?? 0}px`,
        top: `${tarea.y ?? 0}px`,
        zIndex: 1,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
    >
      {/* Nodo principal */}
      <div
        className="relative rounded-lg shadow-md transition-all cursor-move"
        style={{
          width: `${NODE_WIDTH}px`,
          height: `${NODE_HEIGHT}px`,
          backgroundColor: '#ffffff',
          border: `${borderWidth}px solid ${borderColor}`,
          padding: '8px',
        }}
        onMouseDown={onMouseDown}
      >
        {/* Botón de menú */}
        {isHovering && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              const rect = nodeRef.current?.getBoundingClientRect();
              if (rect) {
                setMenuPosition({ x: rect.right, y: rect.top });
                setShowMenu(true);
              }
              onMenuClick?.(tarea.id, event);
            }}
            className="absolute -top-2 -right-2 z-10 rounded-full bg-gray-600 p-1 text-white shadow-lg transition-opacity hover:bg-gray-700"
            style={{ pointerEvents: 'auto' }}
            title="Menú"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        )}

        {/* Botón de eliminar */}
        {isHovering && onDelete && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2 -left-2 z-10 rounded-full bg-red-500 p-1 text-white shadow-lg transition-opacity hover:bg-red-600"
            style={{ pointerEvents: 'auto' }}
            title="Eliminar nodo"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Contenido del nodo */}
        <div className="flex flex-col h-full justify-between">
          {/* Nombre de la tarea */}
          <h4
            className="text-sm font-semibold truncate leading-tight mb-1"
            style={{ color: '#1B263B' }}
            title={tarea.nombre}
          >
            {tarea.nombre}
          </h4>

          {/* Duración */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium" style={{ color: '#4a5568' }}>
              ⏱️ {tarea.duracion} días
            </span>
          </div>

          {/* Dependencias */}
          {predecesorasNombres.length > 0 && (
            <p className="text-[10px] text-gray-500 truncate mb-1" title={`Depende de: ${predecesorasNombres.join(', ')}`}>
              ← {predecesorasNombres.length === 1 ? predecesorasNombres[0] : `${predecesorasNombres.length} precedencias`}
            </p>
          )}

          {/* Etiqueta de camino crítico o holguras */}
          {isCritical ? (
            <p className="text-[10px] font-bold leading-tight mt-1" style={{ color: '#e74c3c' }}>
              ⚡ CAMINO CRÍTICO
            </p>
          ) : tarea.cpm && tarea.cpm.float > 0 ? (
            <p
              className="text-[10px] leading-tight mt-1"
              style={{
                color: '#6B7280',
              }}
              title={`Holgura total: ${tarea.cpm.float}d, Holgura libre: ${tarea.cpm.float_free}d`}
            >
              ⏳ Holgura: {tarea.cpm.float}d (libre {tarea.cpm.float_free} / total {tarea.cpm.float})
            </p>
          ) : null}
        </div>
      </div>

      {/* Menú contextual */}
      {showMenu && (
        <ContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onAddPrecedence={() => onAddPrecedence?.(tarea.id)}
          onViewDetails={() => onViewDetails?.(tarea.id)}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* Handles SVG (sobre el nodo) */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: `-${HANDLE_SIZE / 2}px`,
          top: `-${HANDLE_SIZE / 2}px`,
          width: `${NODE_WIDTH + HANDLE_SIZE}px`,
          height: `${NODE_HEIGHT + HANDLE_SIZE}px`,
          zIndex: 2,
        }}
      >
        {/* Input handle (izquierda) */}
        <NodeHandle
          type="input"
          x={inputHandleX + HANDLE_SIZE / 2}
          y={inputHandleY + HANDLE_SIZE / 2}
          onMouseDown={handleInputMouseDown}
        />

        {/* Output handle (derecha) */}
        <NodeHandle
          type="output"
          x={outputHandleX + HANDLE_SIZE / 2}
          y={outputHandleY + HANDLE_SIZE / 2}
          onMouseDown={handleOutputMouseDown}
        />
      </svg>
    </div>
  );
}

export function TaskCanvas({
  tareas,
  onTaskClick,
  onTaskDoubleClick,
  onTaskDelete,
  onPositionChange,
  onConnectionCreate,
  onConnectionDelete,
  onAddPrecedence,
  onViewDetails,
}: TaskCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodos, setNodos] = useState<TaskCanvasNode[]>([]);
  const [zoom, setZoom] = useState(0.9);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ taskId: string; handleType: 'input' | 'output' } | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const nodosRef = useRef<TaskCanvasNode[]>([]);

  useEffect(() => {
    if (tareas.length === 0) {
      setNodos([]);
      nodosRef.current = [];
      return;
    }
    // Eliminar duplicados: mantener solo el primero de cada id
    const tareasUnicas = tareas.filter((tarea, index, self) => 
      index === self.findIndex((t) => t.id === tarea.id)
    );
    const clones = tareasUnicas.map((tarea) => ({ ...tarea }));
    setNodos(clones);
    nodosRef.current = clones;
  }, [tareas]);

  const getNodePosition = (taskId: string, handleType: 'input' | 'output' = 'output') => {
    const node = nodosRef.current.find((n) => n.id === taskId);
    if (!node) return { x: 0, y: 0 };
    const baseX = node.x ?? 0;
    const baseY = node.y ?? 0;
    
    if (handleType === 'input') {
      return {
        x: baseX,
        y: baseY + NODE_HEIGHT / 2,
      };
    } else {
      return {
        x: baseX + NODE_WIDTH,
        y: baseY + NODE_HEIGHT / 2,
      };
    }
  };

  const renderConexiones = () => {
    const conexiones: JSX.Element[] = [];
    const conexionesVistas = new Set<string>(); // Para evitar duplicados

    nodos.forEach((tarea) => {
      const deps = tarea.dependencias || [];
      // Eliminar duplicados del array de dependencias
      const depsUnicas = Array.from(new Set(deps));
      
      depsUnicas.forEach((depId, index) => {
        const origen = nodos.find((t) => t.id === depId);
        if (!origen) return;

        // Crear una clave única para esta conexión
        const conexionKey = `${depId}-${tarea.id}`;
        // Si ya vimos esta conexión, saltarla
        if (conexionesVistas.has(conexionKey)) {
          return;
        }
        conexionesVistas.add(conexionKey);

        const fromPos = getNodePosition(depId, 'output');
        const toPos = getNodePosition(tarea.id, 'input');

        const isCritical = tarea.cpm?.float === 0 || origen.cpm?.float === 0;
        const strokeColor = isCritical ? '#e74c3c' : '#9ca3af';
        const strokeWidth = isCritical ? 2.5 : 2;
        const strokeDasharray = isCritical ? '0' : '5,5';

        // Calcular puntos de control para curva suave
        const dx = toPos.x - fromPos.x;
        const controlPointX1 = fromPos.x + Math.max(50, dx * 0.5);
        const controlPointY1 = fromPos.y;
        const controlPointX2 = toPos.x - Math.max(50, dx * 0.5);
        const controlPointY2 = toPos.y;

        const path = `M ${fromPos.x},${fromPos.y} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${toPos.x},${toPos.y}`;

        conexiones.push(
          <g key={`${conexionKey}-${index}`}>
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              fill="none"
              opacity="0.8"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
            {/* Punto de conexión en el origen */}
            <circle cx={fromPos.x} cy={fromPos.y} r={4} fill={strokeColor} />
            {/* Punto de conexión en el destino */}
            <circle cx={toPos.x} cy={toPos.y} r={4} fill={strokeColor} />
          </g>,
        );
      });
    });

    // Preview de conexión en progreso
    if (connectingFrom && connectionPreview) {
      const fromPos = getNodePosition(
        connectingFrom.taskId,
        connectingFrom.handleType === 'output' ? 'output' : 'input'
      );
      const dx = connectionPreview.x - fromPos.x;
      const controlPointX1 = fromPos.x + Math.max(50, dx * 0.5);
      const controlPointY1 = fromPos.y;
      const controlPointX2 = connectionPreview.x - Math.max(50, dx * 0.5);
      const controlPointY2 = connectionPreview.y;

      const path = `M ${fromPos.x},${fromPos.y} C ${controlPointX1},${controlPointY1} ${controlPointX2},${controlPointY2} ${connectionPreview.x},${connectionPreview.y}`;

      conexiones.push(
        <path
          key="preview"
          d={path}
          stroke="#e74c3c"
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
          opacity="0.6"
          strokeLinecap="round"
        />,
      );
    }

    return conexiones;
  };

  const handleMouseDown = (event: React.MouseEvent, tareaId: string) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;

    const canvasX = (event.clientX - rect.left + scrollLeft) / zoom;
    const canvasY = (event.clientY - rect.top + scrollTop) / zoom;

    const currentNode = nodosRef.current.find((n) => n.id === tareaId);
    if (currentNode) {
      const nodeX = currentNode.x ?? 0;
      const nodeY = currentNode.y ?? 0;

      const offsetX = canvasX - nodeX;
      const offsetY = canvasY - nodeY;

      setDragStart({ x: offsetX, y: offsetY });
      setIsDragging(true);
      setHasDragged(false);
      setDraggedNode(tareaId);
    }
  };

  const handleConnectionStart = (taskId: string, handleType: 'input' | 'output') => {
    setConnectingFrom({ taskId, handleType });
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scrollLeft = canvasRef.current.scrollLeft;
      const scrollTop = canvasRef.current.scrollTop;

      const canvasX = (event.clientX - rect.left + scrollLeft) / zoom;
      const canvasY = (event.clientY - rect.top + scrollTop) / zoom;

      if (connectingFrom) {
        setConnectionPreview({ x: canvasX, y: canvasY });
      } else if (isDragging && draggedNode) {
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
      }
    },
    [dragStart, draggedNode, isDragging, zoom, connectingFrom],
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (connectingFrom && connectionPreview && canvasRef.current) {
        // Buscar nodo bajo el cursor
        const rect = canvasRef.current.getBoundingClientRect();
        const scrollLeft = canvasRef.current.scrollLeft;
        const scrollTop = canvasRef.current.scrollTop;

        const canvasX = (event.clientX - rect.left + scrollLeft) / zoom;
        const canvasY = (event.clientY - rect.top + scrollTop) / zoom;

        const targetNode = nodosRef.current.find((node) => {
          const nodeX = node.x ?? 0;
          const nodeY = node.y ?? 0;
          return (
            canvasX >= nodeX &&
            canvasX <= nodeX + NODE_WIDTH &&
            canvasY >= nodeY &&
            canvasY <= nodeY + NODE_HEIGHT
          );
        });

        if (targetNode && targetNode.id !== connectingFrom.taskId) {
          // Crear conexión
          if (connectingFrom.handleType === 'output') {
            // Conectar desde output a input del target
            onConnectionCreate?.(connectingFrom.taskId, targetNode.id);
          } else {
            // Conectar desde input a output del target (inverso)
            onConnectionCreate?.(targetNode.id, connectingFrom.taskId);
          }
        }
      } else if (isDragging && draggedNode && hasDragged) {
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
      setConnectingFrom(null);
      setConnectionPreview(null);
    },
    [draggedNode, hasDragged, nodos, onPositionChange, connectingFrom, connectionPreview, zoom, onConnectionCreate],
  );

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: '#eaf0f6' }}>
      <div
        ref={canvasRef}
        className="relative h-full w-full overflow-auto"
        style={{ background: '#eaf0f6', minHeight: '100%' }}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.1 : 0.1;
          setZoom((prev) => Math.max(0.5, Math.min(1.6, prev + delta)));
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
            {/* Definir flecha para las conexiones */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
              </marker>
            </defs>
            {renderConexiones()}
          </svg>

          {nodos
            .filter((tarea, index, self) => 
              // Eliminar duplicados: mantener solo el primero de cada id
              index === self.findIndex((t) => t.id === tarea.id)
            )
            .map((tarea) => (
            <TaskNode
              key={tarea.id}
              tarea={tarea}
              allTasks={nodos}
              onMouseDown={(event) => handleMouseDown(event, tarea.id)}
              onDoubleClick={() => onTaskDoubleClick?.(tarea.id)}
              onDelete={() => onTaskDelete?.(tarea.id)}
              onConnectionStart={handleConnectionStart}
              onMenuClick={(taskId, event) => {
                onTaskClick?.(taskId);
              }}
              onAddPrecedence={onAddPrecedence}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </div>
      <div className="absolute left-4 bottom-4 z-50 rounded-lg border bg-white p-2 shadow-lg" style={{ borderColor: '#dce3ea', pointerEvents: 'auto' }}>
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
