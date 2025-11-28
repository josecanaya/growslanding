'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, ChevronUp } from 'lucide-react';

interface SwipeUpCameraButtonProps {
  onPhotoTaken?: (dataUrl: string) => void;
}

export function SwipeUpCameraButton({ onPhotoTaken }: SwipeUpCameraButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const touchStartY = useRef(0);
  const currentY = useRef(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    setIsCameraOpen(true);
    
      try {
      // Abrir cámara del dispositivo
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Cámara trasera en móvil
      });
      streamRef.current = stream;
      
      // Crear video element para mostrar preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.className = 'w-full h-full object-cover';
      
      // Crear canvas para capturar foto
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Mostrar preview en overlay
      const overlay = document.querySelector('.camera-overlay') as HTMLElement;
      if (overlay) {
        overlay.innerHTML = '';
        overlay.appendChild(video);
        
        // Botón para capturar
        const captureBtn = document.createElement('button');
        captureBtn.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg z-10';
        captureBtn.innerHTML = '<div class="w-16 h-16 bg-white rounded-full border-4 border-gray-300"></div>';
        captureBtn.onclick = () => {
          if (video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            stream.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setIsCameraOpen(false);
            if (onPhotoTaken) {
              onPhotoTaken(dataUrl);
            }
          }
        };
        overlay.appendChild(captureBtn);
        
        // Botón para cerrar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 z-10';
        closeBtn.innerHTML = '<span class="text-2xl">×</span>';
        closeBtn.onclick = () => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          setIsCameraOpen(false);
        };
        overlay.appendChild(closeBtn);
      }
    } catch (err) {
      console.error('[CAMERA] Error al abrir cámara:', err);
      // Fallback: usar input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setIsCameraOpen(false);
            if (onPhotoTaken) {
              onPhotoTaken(dataUrl);
            }
          };
          reader.readAsDataURL(file);
        } else {
          setIsCameraOpen(false);
        }
        document.body.removeChild(input);
      };
      
      input.oncancel = () => {
        setIsCameraOpen(false);
        document.body.removeChild(input);
      };
    }
  }, [onPhotoTaken]);

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
  }, [isDragging, dragY, openCamera]);

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
  }, [isDragging, dragY, openCamera]);

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
        <div className="fixed inset-0 bg-black z-50 camera-overlay flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setIsCameraOpen(false)}
              className="bg-black bg-opacity-50 text-white rounded-full p-2"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

