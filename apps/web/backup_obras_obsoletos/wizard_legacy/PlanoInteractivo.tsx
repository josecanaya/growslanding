'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Home,
  Bath,
  ChefHat,
  Sofa,
  Car,
  TreePine,
  Square,
  Plus,
  Trash2,
  Move,
  Edit3,
  Ruler,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCcw as Reset
} from 'lucide-react';
import { ModalDimensionesAmbiente } from './ModalDimensionesAmbiente';
import { ModalAmbientePersonalizado } from './ModalAmbientePersonalizado';

interface DimensionesPlanta {
  ancho: number;
  largo: number;
  superficie: number;
}

interface PlanoBloque {
  id: string;
  tipo: string;
  nombre: string;
  color: string;
  x: number;
  y: number;
  ancho: number;
  largo: number;
  superficie: number;
  isDragging?: boolean;
  isResizing?: boolean;
}

interface PlantaData {
  numero: number;
  nombre: string;
  dimensiones: DimensionesPlanta;
  bloques: PlanoBloque[];
}

interface PlanoInteractivoProps {
  data: PlantaData;
  onChange: (data: PlantaData) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLastPlanta: boolean;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  blockId: string | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startBlockX: number;
  startBlockY: number;
  resizeHandle: string | null;
}

export function PlanoInteractivo({ data, onChange, onNext, onPrevious, isLastPlanta }: PlanoInteractivoProps) {
  const [selectedBlock, setSelectedBlock] = useState<PlanoBloque | null>(null);
  const [showDimensionesModal, setShowDimensionesModal] = useState(false);
  const [showAmbientePersonalizadoModal, setShowAmbientePersonalizadoModal] = useState(false);
  const [selectedAmbienteType, setSelectedAmbienteType] = useState<{id: string, nombre: string, color: string} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    blockId: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startBlockX: 0,
    startBlockY: 0,
    resizeHandle: null
  });

  const planoRef = useRef<HTMLDivElement>(null);

  // Tipos de ambientes disponibles para el plano
  const tiposAmbientesPlano = [
    { id: 'AMB001', nombre: 'Dormitorio', color: 'bg-blue-400', icon: Home },
    { id: 'AMB002', nombre: 'Baño', color: 'bg-green-400', icon: Bath },
    { id: 'AMB003', nombre: 'Cocina', color: 'bg-orange-400', icon: ChefHat },
    { id: 'AMB004', nombre: 'Estar', color: 'bg-purple-400', icon: Sofa },
    { id: 'AMB005', nombre: 'Circulación', color: 'bg-gray-400', icon: Square },
    { id: 'AMB006', nombre: 'Garage', color: 'bg-slate-400', icon: Car },
    { id: 'AMB007', nombre: 'Quincho', color: 'bg-amber-400', icon: TreePine },
    { id: 'AMB008', nombre: 'Galería', color: 'bg-cyan-400', icon: Square },
    { id: 'AMB009', nombre: 'Balcón', color: 'bg-teal-400', icon: Square },
    { id: 'AMB010', nombre: 'Terraza', color: 'bg-lime-400', icon: Square },
    { id: 'AMB011', nombre: 'Patio', color: 'bg-emerald-400', icon: Square }
  ];

  // Función para convertir coordenadas de píxeles a metros
  const pixelToMeters = useCallback((pixels: number, dimension: 'width' | 'height'): number => {
    if (!planoRef.current) return 0;
    const rect = planoRef.current.getBoundingClientRect();
    const dimensionInPixels = dimension === 'width' ? rect.width : rect.height;
    const dimensionInMeters = dimension === 'width' ? data.dimensiones.ancho : data.dimensiones.largo;
    return (pixels / dimensionInPixels) * dimensionInMeters;
  }, [data.dimensiones]);

  // Función para convertir coordenadas de metros a píxeles
  const metersToPixels = useCallback((meters: number, dimension: 'width' | 'height'): number => {
    if (!planoRef.current) return 0;
    const rect = planoRef.current.getBoundingClientRect();
    const dimensionInPixels = dimension === 'width' ? rect.width : rect.height;
    const dimensionInMeters = dimension === 'width' ? data.dimensiones.ancho : data.dimensiones.largo;
    return (meters / dimensionInMeters) * dimensionInPixels;
  }, [data.dimensiones]);

  // Función de snap automático
  const snapToGrid = useCallback((value: number, gridSize: number = 0.5): number => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  const handleAmbienteClick = (tipoAmbiente: {id: string, nombre: string, color: string}) => {
    setSelectedAmbienteType(tipoAmbiente);
    setShowDimensionesModal(true);
  };

  const addBloque = (ancho: number, largo: number) => {
    if (!selectedAmbienteType) return;

    // Buscar una posición libre en el plano
    let x = 1, y = 1;
    let positionFound = false;
    const gridSize = 0.5;

    while (!positionFound && x < data.dimensiones.ancho - ancho) {
      while (!positionFound && y < data.dimensiones.largo - largo) {
        const overlaps = data.bloques.some(bloque => {
          return !(
            x + ancho <= bloque.x || 
            x >= bloque.x + bloque.ancho || 
            y + largo <= bloque.y || 
            y >= bloque.y + bloque.largo
          );
        });
        
        if (!overlaps) {
          positionFound = true;
          break;
        }
        y += gridSize;
      }
      if (!positionFound) {
        x += gridSize;
        y = 1;
      }
    }

    const nuevoBloque: PlanoBloque = {
      id: `bloque_${Date.now()}`,
      tipo: selectedAmbienteType.id,
      nombre: selectedAmbienteType.nombre,
      color: selectedAmbienteType.color,
      x: snapToGrid(Math.max(0, x)),
      y: snapToGrid(Math.max(0, y)),
      ancho: snapToGrid(Math.max(0.5, ancho)),
      largo: snapToGrid(Math.max(0.5, largo)),
      superficie: snapToGrid(Math.max(0.5, ancho)) * snapToGrid(Math.max(0.5, largo))
    };
    
    onChange({ ...data, bloques: [...data.bloques, nuevoBloque] });
    setSelectedAmbienteType(null);
    setSelectedBlock(nuevoBloque);
  };

  const handleAmbientePersonalizado = (nombre: string, color: string, id: string) => {
    const nuevoTipoAmbiente = { id, nombre, color };
    setSelectedAmbienteType(nuevoTipoAmbiente);
    setShowDimensionesModal(true);
  };

  const updateBloque = (bloqueId: string, updates: Partial<PlanoBloque>) => {
    const bloquesActualizados = data.bloques.map(bloque => {
      if (bloque.id === bloqueId) {
        const updated = { ...bloque, ...updates };
        
        // Asegurar que las dimensiones sean números válidos
        updated.ancho = Math.max(0.5, updated.ancho || 0.5);
        updated.largo = Math.max(0.5, updated.largo || 0.5);
        updated.x = Math.max(0, updated.x || 0);
        updated.y = Math.max(0, updated.y || 0);
        
        // Recalcular superficie si cambian dimensiones
        if (updates.ancho !== undefined || updates.largo !== undefined) {
          updated.superficie = updated.ancho * updated.largo;
        }
        
        return updated;
      }
      return bloque;
    });
    onChange({ ...data, bloques: bloquesActualizados });
    
    // Actualizar bloque seleccionado si es el mismo
    if (selectedBlock?.id === bloqueId) {
      setSelectedBlock(bloquesActualizados.find(b => b.id === bloqueId) || null);
    }
  };

  const deleteBloque = (bloqueId: string) => {
    const bloquesActualizados = data.bloques.filter(bloque => bloque.id !== bloqueId);
    onChange({ ...data, bloques: bloquesActualizados });
    if (selectedBlock?.id === bloqueId) {
      setSelectedBlock(null);
    }
  };

  // Funciones de zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  // Funciones de drag & drop corregidas
  const handleMouseDown = (e: React.MouseEvent, bloque: PlanoBloque, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!planoRef.current) return;
    
    const rect = planoRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragState({
      isDragging: !handle,
      isResizing: !!handle,
      blockId: bloque.id,
      startX: x,
      startY: y,
      startWidth: bloque.ancho,
      startHeight: bloque.largo,
      startBlockX: bloque.x,
      startBlockY: bloque.y,
      resizeHandle: handle || null
    });
    
    setSelectedBlock(bloque);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.blockId || !planoRef.current) return;
    
    const rect = planoRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragState.startX;
    const deltaY = currentY - dragState.startY;
    
    if (dragState.isDragging) {
      // Mover bloque - convertir píxeles a metros
      const deltaXMeters = (deltaX / rect.width) * data.dimensiones.ancho;
      const deltaYMeters = (deltaY / rect.height) * data.dimensiones.largo;
      
      const newX = Math.max(0, Math.min(data.dimensiones.ancho - dragState.startWidth, dragState.startBlockX + deltaXMeters));
      const newY = Math.max(0, Math.min(data.dimensiones.largo - dragState.startHeight, dragState.startBlockY + deltaYMeters));
      
      updateBloque(dragState.blockId, { 
        x: snapToGrid(newX),
        y: snapToGrid(newY)
      });
    } else if (dragState.isResizing && dragState.resizeHandle) {
      // Redimensionar bloque
      const deltaXMeters = (deltaX / rect.width) * data.dimensiones.ancho;
      const deltaYMeters = (deltaY / rect.height) * data.dimensiones.largo;
      
      let newWidth = dragState.startWidth;
      let newHeight = dragState.startHeight;
      let newX = dragState.startBlockX;
      let newY = dragState.startBlockY;
      
      switch (dragState.resizeHandle) {
        case 'se':
          newWidth = Math.max(0.5, dragState.startWidth + deltaXMeters);
          newHeight = Math.max(0.5, dragState.startHeight + deltaYMeters);
          break;
        case 'sw':
          newWidth = Math.max(0.5, dragState.startWidth - deltaXMeters);
          newHeight = Math.max(0.5, dragState.startHeight + deltaYMeters);
          newX = Math.min(dragState.startBlockX + dragState.startWidth - 0.5, dragState.startBlockX + deltaXMeters);
          break;
        case 'ne':
          newWidth = Math.max(0.5, dragState.startWidth + deltaXMeters);
          newHeight = Math.max(0.5, dragState.startHeight - deltaYMeters);
          newY = Math.min(dragState.startBlockY + dragState.startHeight - 0.5, dragState.startBlockY + deltaYMeters);
          break;
        case 'nw':
          newWidth = Math.max(0.5, dragState.startWidth - deltaXMeters);
          newHeight = Math.max(0.5, dragState.startHeight - deltaYMeters);
          newX = Math.min(dragState.startBlockX + dragState.startWidth - 0.5, dragState.startBlockX + deltaXMeters);
          newY = Math.min(dragState.startBlockY + dragState.startHeight - 0.5, dragState.startBlockY + deltaYMeters);
          break;
      }
      
      updateBloque(dragState.blockId, {
        ancho: snapToGrid(newWidth),
        largo: snapToGrid(newHeight),
        x: snapToGrid(newX),
        y: snapToGrid(newY)
      });
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      isResizing: false,
      blockId: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
      startBlockX: 0,
      startBlockY: 0,
      resizeHandle: null
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending drag operations
      setDragState({
        isDragging: false,
        isResizing: false,
        blockId: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startBlockX: 0,
        startBlockY: 0,
        resizeHandle: null
      });
    };
  }, []);

  const superficieUsada = data.bloques.reduce((total, bloque) => total + bloque.superficie, 0);
  const superficieDisponible = data.dimensiones.superficie - superficieUsada;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-white p-6 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A202C' }}>
                {data.nombre} - Planta {data.numero}
              </h2>
              <p className="text-gray-600">Diseña el plano de tu planta arrastrando y redimensionando ambientes</p>
            </div>
            <div className="flex items-center space-x-6">
              {/* Controles de Zoom */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#FEEB70' }}>
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="h-4 w-4" style={{ color: '#1A202C' }} />
                </button>
                <span className="text-sm font-medium min-w-[3rem] text-center" style={{ color: '#1A202C' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="h-4 w-4" style={{ color: '#1A202C' }} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                  title="Resetear zoom"
                >
                  <Reset className="h-4 w-4" style={{ color: '#1A202C' }} />
                </button>
              </div>
              
              {/* Superficie Total */}
              <div className="text-right">
                <div className="text-gray-600 text-sm mb-1">Superficie Total</div>
                <div className="text-2xl font-bold px-4 py-2 rounded-xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                  {data.dimensiones.superficie.toFixed(1)} m²
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* Panel izquierdo - Ambientes disponibles */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-bold mb-4 flex items-center space-x-2" style={{ color: '#1A202C' }}>
                <Home className="h-5 w-5" style={{ color: '#FEEB70' }} />
                <span>Ambientes Disponibles</span>
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {tiposAmbientesPlano.map((tipo) => {
                  const Icon = tipo.icon;
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => handleAmbienteClick(tipo)}
                      className="w-full p-3 rounded-lg text-sm text-left transition-all duration-200 hover:shadow-md border border-gray-200 bg-white group hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${tipo.color} shadow-sm`}></div>
                        <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
                        <span className="font-medium" style={{ color: '#1A202C' }}>{tipo.nombre}</span>
                      </div>
                      <div className="text-xs mt-1 text-gray-500">ID: {tipo.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón agregar ambiente personalizado */}
            <button
              onClick={() => setShowAmbientePersonalizadoModal(true)}
              className="w-full p-4 border-2 border-dashed rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md text-white"
              style={{ 
                backgroundColor: '#22C55E', 
                borderColor: '#16A34A'
              }}
            >
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Agregar ambiente personalizado</span>
              </div>
            </button>

            {/* Panel de propiedades del bloque seleccionado */}
            {selectedBlock && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-bold mb-4 flex items-center space-x-2" style={{ color: '#1A202C' }}>
                  <Edit3 className="h-5 w-5" style={{ color: '#FEEB70' }} />
                  <span>Propiedades</span>
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded ${selectedBlock.color} shadow-sm`}></div>
                    <span className="font-bold" style={{ color: '#1A202C' }}>{selectedBlock.nombre}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-600">Ancho (m)</label>
                      <input
                        type="number"
                        value={selectedBlock.ancho || 0}
                        onChange={(e) => updateBloque(selectedBlock.id, { 
                          ancho: Math.max(0.5, parseFloat(e.target.value) || 0.5)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.1"
                        min="0.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-600">Largo (m)</label>
                      <input
                        type="number"
                        value={selectedBlock.largo || 0}
                        onChange={(e) => updateBloque(selectedBlock.id, { 
                          largo: Math.max(0.5, parseFloat(e.target.value) || 0.5)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="0.1"
                        min="0.5"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEEB70' }}>
                    <div className="text-xs font-medium mb-1" style={{ color: '#1A202C' }}>Superficie</div>
                    <div className="text-lg font-bold" style={{ color: '#1A202C' }}>
                      {(selectedBlock.superficie || 0).toFixed(1)} m²
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteBloque(selectedBlock.id)}
                    className="w-full p-3 text-white rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors duration-200 shadow-sm"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Área del plano */}
          <div className="lg:col-span-3">
            <div className="border-2 rounded-xl p-4 shadow-inner" style={{ backgroundColor: '#FFFFFF', borderColor: '#F8F8F8' }}>
              <div 
                ref={planoRef}
                className="relative cursor-crosshair bg-gray-50 rounded-lg overflow-hidden"
                style={{ 
                  height: '500px',
                  background: `
                    linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                    linear-gradient(180deg, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Dimensiones del plano */}
                <div className="absolute top-3 left-3 text-xs text-gray-600 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-1">
                    <Ruler className="h-3 w-3" />
                    <span className="font-medium">{data.dimensiones.ancho}m × {data.dimensiones.largo}m</span>
                  </div>
                </div>

                {/* Bloques */}
                {data.bloques.map((bloque) => {
                  const isSelected = selectedBlock?.id === bloque.id;
                  const isDragging = dragState.blockId === bloque.id && dragState.isDragging;
                  const isResizing = dragState.blockId === bloque.id && dragState.isResizing;
                  
                  return (
                    <div
                      key={bloque.id}
                      onMouseDown={(e) => handleMouseDown(e, bloque)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlock(isSelected ? null : bloque);
                      }}
                      className={`absolute border-2 cursor-move transition-all duration-200 ${bloque.color} ${
                        isSelected ? 'border-blue-500 shadow-xl z-20 ring-4 ring-blue-100' : 'border-gray-400 hover:border-gray-600 z-10'
                      } ${isDragging || isResizing ? 'opacity-90' : ''}`}
                      style={{
                        left: `${(bloque.x / data.dimensiones.ancho) * 100}%`,
                        top: `${(bloque.y / data.dimensiones.largo) * 100}%`,
                        width: `${(bloque.ancho / data.dimensiones.ancho) * 100}%`,
                        height: `${(bloque.largo / data.dimensiones.largo) * 100}%`,
                        minWidth: '30px',
                        minHeight: '30px'
                      }}
                    >
                      {/* Contenido del bloque */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-white font-bold p-2">
                        <span className="truncate w-full text-center leading-tight">{bloque.nombre}</span>
                        <span className="text-xs opacity-90 mt-1">{bloque.superficie.toFixed(1)} m²</span>
                        <span className="text-xs opacity-75 mt-1">{bloque.ancho}m × {bloque.largo}m</span>
                      </div>

                      {/* Handles de redimensionado */}
                      {isSelected && (
                        <>
                          {/* Handle SE (sureste) */}
                          <div
                            onMouseDown={(e) => handleMouseDown(e, bloque, 'se')}
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize border border-white shadow-sm"
                          />
                          {/* Handle SW (suroeste) */}
                          <div
                            onMouseDown={(e) => handleMouseDown(e, bloque, 'sw')}
                            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize border border-white shadow-sm"
                          />
                          {/* Handle NE (noreste) */}
                          <div
                            onMouseDown={(e) => handleMouseDown(e, bloque, 'ne')}
                            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize border border-white shadow-sm"
                          />
                          {/* Handle NW (noroeste) */}
                          <div
                            onMouseDown={(e) => handleMouseDown(e, bloque, 'nw')}
                            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize border border-white shadow-sm"
                          />
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Instrucciones */}
                {data.bloques.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Move className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">¡Comienza diseñando tu plano!</p>
                      <p className="text-sm">Haz clic en un ambiente del panel izquierdo para agregarlo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen del plano */}
            <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold mb-4 flex items-center space-x-2" style={{ color: '#1A202C' }}>
                <Ruler className="h-5 w-5" style={{ color: '#FEEB70' }} />
                <span>Resumen del Plano</span>
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-gray-200 text-center" style={{ backgroundColor: '#FEEB70' }}>
                  <div className="text-sm mb-1" style={{ color: '#1A202C' }}>Total Bloques</div>
                  <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>{data.bloques.length}</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 text-center" style={{ backgroundColor: '#22C55E' }}>
                  <div className="text-sm mb-1 text-white">Superficie Usada</div>
                  <div className="text-2xl font-bold text-white">
                    {superficieUsada.toFixed(1)} m²
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 text-center" style={{ backgroundColor: '#FEEB70' }}>
                  <div className="text-sm mb-1" style={{ color: '#1A202C' }}>Disponible</div>
                  <div className="text-2xl font-bold" style={{ color: '#1A202C' }}>
                    {superficieDisponible.toFixed(1)} m²
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              style={{ 
                color: '#1A202C',
                backgroundColor: '#FEEB70'
              }}
            >
              <span>Anterior</span>
            </button>

            <button
              onClick={onNext}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              style={{ backgroundColor: '#22C55E' }}
            >
              <span>{isLastPlanta ? 'Finalizar Plantas' : 'Siguiente Planta'}</span>
            </button>
          </div>
        </div>

        {/* Modales */}
        <ModalDimensionesAmbiente
          isOpen={showDimensionesModal}
          onClose={() => {
            setShowDimensionesModal(false);
            setSelectedAmbienteType(null);
          }}
          onConfirm={addBloque}
          nombreAmbiente={selectedAmbienteType?.nombre || ''}
        />

        <ModalAmbientePersonalizado
          isOpen={showAmbientePersonalizadoModal}
          onClose={() => setShowAmbientePersonalizadoModal(false)}
          onConfirm={handleAmbientePersonalizado}
        />
      </div>
    </div>
  );
}
