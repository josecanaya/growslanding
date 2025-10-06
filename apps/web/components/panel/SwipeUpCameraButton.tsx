'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, ChevronUp } from 'lucide-react';

export function SwipeUpCameraButton() {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const touchStartY = useRef(0);
  const currentY = useRef(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY.current;
    
    // Solo permitir movimiento hacia arriba y limitar la distancia
    const maxDrag = 120;
    const dragDistance = Math.max(0, Math.min(deltaY, maxDrag));
    setDragY(dragDistance);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Si se arrastró más de 60px hacia arriba, abrir cámara
    if (dragY > 60) {
      openCamera();
    }
    
    // Resetear posición
    setDragY(0);
  }, [isDragging, dragY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    touchStartY.current = e.clientY;
    currentY.current = e.clientY;
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    currentY.current = e.clientY;
    const deltaY = touchStartY.current - currentY.current;
    
    const maxDrag = 120;
    const dragDistance = Math.max(0, Math.min(deltaY, maxDrag));
    setDragY(dragDistance);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (dragY > 60) {
      openCamera();
    }
    
    setDragY(0);
  }, [isDragging, dragY]);

  const openCamera = () => {
    setIsCameraOpen(true);
    
    // Simular apertura de cámara
    console.log('📷 Abriendo cámara...');
    
    // En una implementación real, aquí se abriría la cámara del dispositivo
    // usando la API de MediaDevices.getUserMedia() o similar
    
    setTimeout(() => {
      alert('📷 Cámara abierta! Foto tomada y guardada como evidencia.');
      setIsCameraOpen(false);
    }, 1000);
  };

  const getButtonStyle = () => {
    const baseTransform = `translateY(${-dragY}px)`;
    const scale = isDragging ? 1.05 : 1;
    const opacity = isDragging ? 0.9 : 1;
    
    return {
      transform: `${baseTransform} scale(${scale})`,
      opacity,
      backgroundColor: dragY > 60 ? '#008080' : '#1A202C', // Usar el azul correcto de la paleta
    };
  };

  const getHandleStyle = () => {
    const rotation = isDragging ? (dragY > 60 ? 180 : dragY * 1.5) : 0;
    return {
      transform: `rotate(${rotation}deg)`,
      color: dragY > 60 ? '#FFFFFF' : '#FFFFFF',
    };
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Área de detección de gestos - todo el ancho inferior */}
      <div 
        className="h-28 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Botón deslizable más grande */}
        <div
          ref={buttonRef}
          className="relative cursor-pointer select-none"
          style={getButtonStyle()}
        >
          {/* Handle visual más grande */}
          <div className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ease-out">
            <div className="flex flex-col items-center space-y-1">
              <Camera className="h-8 w-8" style={{ color: '#FFFFFF' }} />
              <ChevronUp 
                className="h-4 w-4 transition-transform duration-200" 
                style={getHandleStyle()}
              />
            </div>
          </div>
          
          {/* Indicador de arrastre más visible */}
          {isDragging && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="bg-black bg-opacity-80 text-white text-sm px-4 py-2 rounded-full whitespace-nowrap font-medium">
                {dragY > 60 ? 'Soltar para abrir cámara' : 'Desliza hacia arriba'}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Efecto de fondo cuando se está arrastrando */}
      {isDragging && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-10 transition-opacity duration-200"
          style={{ opacity: Math.min(dragY / 120, 0.3) }}
        />
      )}
      
      {/* Overlay de cámara */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-semibold mb-2">Cámara abierta</h2>
            <p className="text-gray-300">Tomando foto para evidencia...</p>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
