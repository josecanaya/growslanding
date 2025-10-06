'use client';

import { useState, useRef, useCallback } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface SlideToConfirmProps {
  onConfirm: () => void;
  label: string;
  confirmLabel?: string;
  disabled?: boolean;
  variant?: 'start' | 'finish';
}

export function SlideToConfirm({ 
  onConfirm, 
  label, 
  confirmLabel = 'Desliza para confirmar',
  disabled = false,
  variant = 'start'
}: SlideToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const touchStartX = useRef(0);
  const currentX = useRef(0);
  const buttonRef = useRef<HTMLDivElement>(null);

  const maxDrag = 200; // Distancia máxima para activar
  const threshold = 150; // Umbral para confirmar

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isConfirmed) return;
    touchStartX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [disabled, isConfirmed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled || isConfirmed) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - touchStartX.current;
    
    // Solo permitir movimiento hacia la derecha
    const dragDistance = Math.max(0, Math.min(deltaX, maxDrag));
    setDragX(dragDistance);
  }, [isDragging, disabled, isConfirmed]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled || isConfirmed) return;
    
    setIsDragging(false);
    
    // Si se arrastró más del umbral, confirmar
    if (dragX > threshold) {
      setIsConfirmed(true);
      setTimeout(() => {
        onConfirm();
        // Resetear después de un momento
        setTimeout(() => {
          setIsConfirmed(false);
          setDragX(0);
        }, 1000);
      }, 300);
    } else {
      // Volver a la posición original
      setDragX(0);
    }
  }, [isDragging, dragX, threshold, onConfirm, disabled, isConfirmed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isConfirmed) return;
    touchStartX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(true);
  }, [disabled, isConfirmed]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || disabled || isConfirmed) return;
    
    currentX.current = e.clientX;
    const deltaX = currentX.current - touchStartX.current;
    
    const dragDistance = Math.max(0, Math.min(deltaX, maxDrag));
    setDragX(dragDistance);
  }, [isDragging, disabled, isConfirmed]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled || isConfirmed) return;
    
    setIsDragging(false);
    
    if (dragX > threshold) {
      setIsConfirmed(true);
      setTimeout(() => {
        onConfirm();
        setTimeout(() => {
          setIsConfirmed(false);
          setDragX(0);
        }, 1000);
      }, 300);
    } else {
      setDragX(0);
    }
  }, [isDragging, dragX, threshold, onConfirm, disabled, isConfirmed]);

  const getButtonStyle = () => {
    const progress = dragX / maxDrag;
    const isReady = dragX > threshold;
    
    return {
      backgroundColor: isReady ? '#008080' : variant === 'start' ? '#1A202C' : '#FEEB70',
      color: isReady ? '#FFFFFF' : variant === 'start' ? '#FFFFFF' : '#1A202C',
      transform: `translateX(${dragX}px)`,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTrackStyle = () => {
    const progress = dragX / maxDrag;
    return {
      backgroundColor: dragX > threshold ? '#008080' : variant === 'start' ? '#1A202C' : '#FEEB70',
      width: `${progress * 100}%`,
    };
  };

  return (
    <div className="relative">
      {/* Track de fondo */}
      <div className="w-full h-14 bg-gray-200 rounded-full overflow-hidden relative">
        {/* Barra de progreso */}
        <div 
          className="h-full rounded-full transition-all duration-200 ease-out"
          style={getTrackStyle()}
        />
        
        {/* Texto de fondo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600">
            {isConfirmed ? '¡Confirmado!' : confirmLabel}
          </span>
        </div>
      </div>

      {/* Botón deslizable */}
      <div
        ref={buttonRef}
        className={`absolute top-0 left-0 w-14 h-14 rounded-full shadow-lg cursor-pointer select-none transition-all duration-200 ease-out ${
          isDragging ? 'scale-105' : 'scale-100'
        }`}
        style={getButtonStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="w-full h-full flex items-center justify-center">
          {isConfirmed ? (
            <Check className="h-6 w-6" />
          ) : (
            <ArrowRight className="h-6 w-6" />
          )}
        </div>
      </div>

      {/* Texto de la acción */}
      <div className="mt-3 text-center">
        <span className="text-sm font-medium text-gray-700">
          {isConfirmed ? 'Procesando...' : label}
        </span>
      </div>
    </div>
  );
}
