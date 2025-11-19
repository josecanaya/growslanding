'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  target: string; // selector CSS
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingBaseProps {
  steps: OnboardingStep[];
  isActive: boolean;
  currentStepIndex: number;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function OnboardingBase({
  steps,
  isActive,
  currentStepIndex,
  onClose,
  onComplete,
  onNext,
  onPrevious,
}: OnboardingBaseProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [isTargetVisible, setIsTargetVisible] = useState(false);
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = steps[currentStepIndex];

  // Función para encontrar el target y calcular su posición
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    // Buscar todos los elementos que coincidan con el selector
    const allMatches = document.querySelectorAll(currentStep.target);
    let targetElement: HTMLElement | null = null;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OnboardingBase] Buscando: ${currentStep.target}, encontrados: ${allMatches.length}`);
    }
    
    if (allMatches.length > 0) {
      // Si hay múltiples elementos, buscar el primero visible
      for (let i = 0; i < allMatches.length; i++) {
        const element = allMatches[i] as HTMLElement;
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                          rect.top < window.innerHeight && 
                          rect.left < window.innerWidth &&
                          rect.bottom > 0 && 
                          rect.right > 0;
        if (isVisible) {
          targetElement = element;
          break;
        }
      }
      // Si ninguno es visible, tomar el primero de todos modos
      if (!targetElement && allMatches.length > 0) {
        targetElement = allMatches[0] as HTMLElement;
      }
    }
    
    if (!targetElement) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[OnboardingBase] Elemento no encontrado: ${currentStep.target} (paso: ${currentStep.id})`);
      }
      setIsTargetVisible(false);
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }

    setIsTargetVisible(true);
    const rect = targetElement.getBoundingClientRect();
    setTargetRect(rect);

    // Hacer scroll al elemento si está parcialmente fuera de la vista
    if (rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTimeout(() => {
        const newRect = targetElement!.getBoundingClientRect();
        setTargetRect(newRect);
      }, 300);
    }

    // Calcular posición del tooltip según la posición preferida
    const preferredPosition = currentStep.position || 'bottom';
    const tooltipGap = 20;
    const tooltipWidth = 400;
    const tooltipHeight = 220;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Función para verificar si una posición tapa el elemento
    const wouldOverlap = (tooltipTop: number, tooltipLeft: number) => {
      const tooltipRight = tooltipLeft + tooltipWidth;
      const tooltipBottom = tooltipTop + tooltipHeight;
      
      // Verificar si el tooltip se superpone con el elemento objetivo
      return !(
        tooltipRight < rect.left ||
        tooltipLeft > rect.right ||
        tooltipBottom < rect.top ||
        tooltipTop > rect.bottom
      );
    };

    // Intentar posiciones en orden de preferencia
    let top = 0;
    let left = 0;
    let finalPosition = preferredPosition;

    // Calcular posición inicial según preferencia
    const calculatePosition = (pos: 'top' | 'bottom' | 'left' | 'right') => {
      switch (pos) {
        case 'top':
          return {
            top: rect.top - tooltipHeight - tooltipGap,
            left: rect.left + rect.width / 2 - tooltipWidth / 2,
          };
        case 'bottom':
          return {
            top: rect.bottom + tooltipGap,
            left: rect.left + rect.width / 2 - tooltipWidth / 2,
          };
        case 'left':
          return {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            left: rect.left - tooltipWidth - tooltipGap - 20, // Más espacio a la izquierda
          };
        case 'right':
          return {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            left: rect.right + tooltipGap,
          };
      }
    };

    // Intentar posición preferida
    let pos = calculatePosition(preferredPosition);
    top = pos.top;
    left = pos.left;

    // Si tapa el elemento, intentar otras posiciones
    if (wouldOverlap(top, left)) {
      const alternatives: Array<'top' | 'bottom' | 'left' | 'right'> = 
        preferredPosition === 'top' ? ['bottom', 'left', 'right'] :
        preferredPosition === 'bottom' ? ['top', 'left', 'right'] :
        preferredPosition === 'left' ? ['right', 'top', 'bottom'] :
        ['left', 'top', 'bottom'];

      for (const altPos of alternatives) {
        pos = calculatePosition(altPos);
        if (!wouldOverlap(pos.top, pos.left)) {
          top = pos.top;
          left = pos.left;
          finalPosition = altPos;
          break;
        }
      }
    }

    // Ajuste especial: si está en 'right' y el elemento es pequeño (como un botón), mover más a la izquierda
    if (finalPosition === 'right' && rect.width < 100) {
      // Intentar posicionar a la izquierda del elemento si hay espacio
      const leftPosition = rect.left - tooltipWidth - tooltipGap - 20;
      if (leftPosition > 20 && !wouldOverlap(top, leftPosition)) {
        left = leftPosition;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        finalPosition = 'left';
      } else {
        // Si no cabe a la izquierda, al menos alejarlo más del botón
        left = rect.right + tooltipGap + 50; // Más espacio del botón
      }
    }
    
    // Ajuste especial: si está en 'left', asegurar que esté bien posicionado
    if (finalPosition === 'left') {
      // Asegurar que no esté demasiado cerca del borde izquierdo
      if (left < 20) {
        left = 20;
      }
      // Asegurar que esté verticalmente centrado con el elemento
      top = Math.max(20, Math.min(
        rect.top + rect.height / 2 - tooltipHeight / 2,
        viewportHeight - tooltipHeight - 20
      ));
    }

    // Ajustar si se sale de la pantalla (sin tapar el elemento)
    if (left < 20) {
      // Si está a la izquierda, mover a la derecha del elemento si hay espacio
      if (rect.right + tooltipGap + tooltipWidth < viewportWidth - 20) {
        left = rect.right + tooltipGap;
        finalPosition = 'right';
      } else {
        left = 20;
      }
    }
    if (left + tooltipWidth > viewportWidth - 20) {
      // Si está a la derecha, mover a la izquierda del elemento si hay espacio
      if (rect.left - tooltipGap - tooltipWidth > 20) {
        left = rect.left - tooltipWidth - tooltipGap;
        finalPosition = 'left';
      } else {
        left = viewportWidth - tooltipWidth - 20;
      }
    }
    if (top < 20) {
      // Si está arriba, mover abajo del elemento si hay espacio
      if (rect.bottom + tooltipGap + tooltipHeight < viewportHeight - 20) {
        top = rect.bottom + tooltipGap;
        finalPosition = 'bottom';
      } else {
        top = 20;
      }
    }
    if (top + tooltipHeight > viewportHeight - 20) {
      // Si está abajo, mover arriba del elemento si hay espacio
      if (rect.top - tooltipGap - tooltipHeight > 20) {
        top = rect.top - tooltipHeight - tooltipGap;
        finalPosition = 'top';
      } else {
        top = viewportHeight - tooltipHeight - 20;
      }
    }

    // Verificar una última vez que no tape el elemento después de los ajustes
    if (wouldOverlap(top, left)) {
      // Si aún tapa, mover a un lado seguro
      if (rect.right + tooltipGap + tooltipWidth < viewportWidth - 20) {
        left = rect.right + tooltipGap;
        top = Math.max(20, Math.min(rect.top, viewportHeight - tooltipHeight - 20));
        finalPosition = 'right';
      } else if (rect.left - tooltipGap - tooltipWidth > 20) {
        left = rect.left - tooltipWidth - tooltipGap;
        top = Math.max(20, Math.min(rect.top, viewportHeight - tooltipHeight - 20));
        finalPosition = 'left';
      }
    }

    setTooltipPosition({ top, left });
    setTooltipArrowPosition(finalPosition);
  }, [currentStep]);

  // Verificar periódicamente si el target existe y actualizar posición
  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      setTooltipPosition(null);
      setIsTargetVisible(false);
      return;
    }

    const timeout = setTimeout(() => {
      updateTargetPosition();
    }, 300);

    checkIntervalRef.current = setInterval(() => {
      updateTargetPosition();
    }, 500);

    const handleScroll = () => updateTargetPosition();
    const handleResize = () => updateTargetPosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, currentStepIndex, updateTargetPosition]);

  if (!isActive || !currentStep) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OnboardingBase] No renderizando - isActive: ${isActive}, currentStep: ${currentStep?.id}`);
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[OnboardingBase] Renderizando - paso: ${currentStep.id}, index: ${currentStepIndex}`);
  }

  // Calcular el clip-path para el spotlight
  const spotlightStyle = targetRect
    ? {
        clipPath: `polygon(
          0% 0%,
          0% 100%,
          ${targetRect.left}px 100%,
          ${targetRect.left}px ${targetRect.top}px,
          ${targetRect.right}px ${targetRect.top}px,
          ${targetRect.right}px ${targetRect.bottom}px,
          ${targetRect.left}px ${targetRect.bottom}px,
          ${targetRect.left}px 100%,
          100% 100%,
          100% 0%
        )`,
      }
    : {};

  return (
    <>
      {/* Overlay oscuro */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 z-[9990] transition-opacity duration-300"
        style={spotlightStyle}
      />

      {/* Spotlight highlight en el target */}
      {targetRect && isTargetVisible && (
        <div
          className="fixed z-[9991] pointer-events-none transition-all duration-300"
          style={{
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            borderRadius: '8px',
            border: '3px solid #F59E0B',
            boxShadow: '0 0 0 4px rgba(245, 158, 11, 0.2), 0 0 20px rgba(245, 158, 11, 0.4)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPosition && isTargetVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-6 max-w-md transition-all duration-300"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {/* Flecha apuntando al target */}
          {targetRect && tooltipArrowPosition === 'bottom' && (
            <div
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200"
            />
          )}
          {targetRect && tooltipArrowPosition === 'top' && (
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"
            />
          )}
          {targetRect && tooltipArrowPosition === 'right' && (
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-200"
            />
          )}
          {targetRect && tooltipArrowPosition === 'left' && (
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 w-4 h-4 bg-white rotate-45 border-r border-t border-gray-200"
            />
          )}

          {/* Contenido del tooltip */}
          <div className="relative">
            {/* Indicador de progreso */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-gray-500">
                Paso {currentStepIndex + 1} de {steps.length}
              </span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">{currentStep.title}</h3>

            {/* Descripción */}
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{currentStep.description}</p>

            {/* Botones */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <button
                    onClick={onPrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 inline mr-1" />
                    Anterior
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Saltar tutorial
                </button>

                {currentStepIndex < steps.length - 1 ? (
                  <button
                    onClick={onNext}
                    className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={onComplete}
                    className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    Finalizar
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2), 0 0 20px rgba(245, 158, 11, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3), 0 0 30px rgba(245, 158, 11, 0.6);
            transform: scale(1.02);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

