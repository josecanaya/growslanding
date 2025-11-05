'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);

  const threshold = 0.85; // 85% del ancho para confirmar

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isConfirmed) return;
    
    setIsDragging(true);
    startXRef.current = e.clientX;
    
    const initialOffset = containerRef.current 
      ? e.clientX - containerRef.current.getBoundingClientRect().left 
      : 0;
    setDragOffset(initialOffset);
  }, [disabled, isConfirmed]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled || isConfirmed) return;
    
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX;
    const offset = currentX - containerRect.left;
    const maxOffset = containerRect.width * threshold;
    
    setDragOffset(Math.min(Math.max(0, offset), maxOffset));
  }, [isDragging, disabled, isConfirmed, threshold]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled || isConfirmed) return;
    
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const thresholdPx = containerWidth * threshold;
    
    if (dragOffset >= thresholdPx) {
      setIsConfirmed(true);
      setTimeout(() => {
        onConfirm();
        setIsConfirmed(false);
        setDragOffset(0);
      }, 300);
    } else {
      // Reset suave
      setDragOffset(0);
    }
    
    setIsDragging(false);
  }, [isDragging, disabled, isConfirmed, dragOffset, threshold, onConfirm]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch events para móviles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isConfirmed) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    
    if (containerRef.current) {
      const initialOffset = touch.clientX - containerRef.current.getBoundingClientRect().left;
      setDragOffset(initialOffset);
    }
  }, [disabled, isConfirmed]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || disabled || isConfirmed) return;
    
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentX = touch.clientX;
    const offset = currentX - containerRect.left;
    const maxOffset = containerRect.width * threshold;
    
    setDragOffset(Math.min(Math.max(0, offset), maxOffset));
  }, [isDragging, disabled, isConfirmed, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled || isConfirmed) return;
    
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const thresholdPx = containerWidth * threshold;
    
    if (dragOffset >= thresholdPx) {
      setIsConfirmed(true);
      setTimeout(() => {
        onConfirm();
        setIsConfirmed(false);
        setDragOffset(0);
      }, 300);
    } else {
      setDragOffset(0);
    }
    
    setIsDragging(false);
  }, [isDragging, disabled, isConfirmed, dragOffset, threshold, onConfirm]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
  const thresholdPx = containerWidth * threshold;
  const progress = containerWidth > 0 ? Math.min(dragOffset / thresholdPx, 1) : 0;

  const getVariantStyles = () => {
    if (variant === 'finish') {
      return {
        backgroundColor: isConfirmed ? '#2ecc71' : '#f4e27e',
        borderColor: isConfirmed ? '#27ae60' : '#e6d168',
      };
    }
    return {
      backgroundColor: isConfirmed ? '#3498db' : '#1B263B',
      borderColor: isConfirmed ? '#2980b9' : '#162033',
    };
  };

  const variantStyles = getVariantStyles();

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium" style={{ color: '#1B263B' }}>
        {label}
      </div>
      
      <div
        ref={containerRef}
        className="relative w-full h-14 rounded-lg overflow-hidden cursor-pointer select-none"
        style={{
          backgroundColor: '#f5f7fa',
          border: '2px solid #dce3ea',
          transition: isDragging ? 'none' : 'all 0.3s ease',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Barra de progreso de fondo */}
        <div
          className="absolute inset-0 transition-all duration-200 ease-out"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: variantStyles.backgroundColor,
            opacity: 0.15,
          }}
        />
        
        {/* Slider */}
        <div
          ref={sliderRef}
          className="absolute top-0 left-0 h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translateX(${dragOffset}px)`,
            width: '60px',
            backgroundColor: variantStyles.backgroundColor,
            border: `2px solid ${variantStyles.borderColor}`,
            borderRadius: '8px',
            boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.1)',
            cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
            zIndex: 2,
          }}
        >
          {isConfirmed ? (
            <Check className="h-5 w-5 text-white" />
          ) : (
            <ArrowRight className="h-5 w-5 text-white" />
          )}
        </div>
        
        {/* Texto de confirmación */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
          style={{
            opacity: progress > 0.5 ? 1 : 0.3,
            color: progress > 0.5 ? variantStyles.borderColor : '#9aa3af',
            fontWeight: progress > 0.5 ? 600 : 400,
            fontSize: '14px',
            zIndex: 1,
          }}
        >
          {progress >= 1 ? '¡Confirmado!' : confirmLabel}
        </div>
      </div>
    </div>
  );
}

