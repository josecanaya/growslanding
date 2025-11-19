'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  target: string; // selector CSS
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingClienteProps {
  steps: OnboardingStep[];
  isActive: boolean;
  currentStepIndex?: number;
  onClose: () => void;
  onComplete?: () => void;
  onStepChange?: (index: number) => void;
}

export function OnboardingCliente({
  steps,
  isActive,
  currentStepIndex: externalStepIndex,
  onClose,
  onComplete,
  onStepChange,
}: OnboardingClienteProps) {
  const pathname = usePathname();
  const [internalStepIndex, setInternalStepIndex] = useState(externalStepIndex ?? 0);
  const currentStepIndex = externalStepIndex !== undefined ? externalStepIndex : internalStepIndex;
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [isTargetVisible, setIsTargetVisible] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notFoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = steps[currentStepIndex];

  // Función para encontrar el target y calcular su posición
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    // Buscar el elemento target
    let targetElement = document.querySelector(currentStep.target);
    
    // Si no se encuentra, intentar buscar variantes del selector
    if (!targetElement && currentStep.id === 'crear-obra') {
      // Para el paso de crear obra, buscar en múltiples lugares
      targetElement = document.querySelector('[data-onboarding="crear-obra"]');
    }
    
    if (!targetElement) {
      setIsTargetVisible(false);
      setTargetRect(null);
      setTooltipPosition(null);
      // Debug: log cuando no se encuentra el elemento
      if (process.env.NODE_ENV === 'development') {
        console.log(`[OnboardingCliente] Elemento no encontrado: ${currentStep.target} (paso: ${currentStep.id})`);
      }
      // Mostrar modal de error solo después de varios intentos fallidos
      if (notFoundTimeoutRef.current) {
        clearTimeout(notFoundTimeoutRef.current);
      }
      notFoundTimeoutRef.current = setTimeout(() => {
        setShowNotFoundModal(true);
      }, 3000); // Esperar 3 segundos antes de mostrar el error
      return;
    }

    // Si encontramos el elemento, ocultar el modal de error
    if (notFoundTimeoutRef.current) {
      clearTimeout(notFoundTimeoutRef.current);
      notFoundTimeoutRef.current = null;
    }
    setShowNotFoundModal(false);

    // Verificar que el elemento sea visible (permitir elementos parcialmente visibles)
    const rect = targetElement.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0 && 
                      rect.top < window.innerHeight && 
                      rect.left < window.innerWidth &&
                      rect.bottom > 0 && 
                      rect.right > 0;

    if (!isVisible) {
      setIsTargetVisible(false);
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }

    setIsTargetVisible(true);
    setTargetRect(rect);

    // Hacer scroll al elemento si está parcialmente fuera de la vista
    if (rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      // Recalcular después del scroll
      setTimeout(() => {
        const newRect = targetElement.getBoundingClientRect();
        setTargetRect(newRect);
      }, 300);
    }

    // Calcular posición del tooltip según la posición preferida
    const position = currentStep.position || 'bottom';
    const tooltipGap = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - tooltipGap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + tooltipGap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - tooltipGap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + tooltipGap;
        break;
    }

    // Ajustar si se sale de la pantalla
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) {
      left = viewportWidth - tooltipWidth - 20;
    }
    if (top < 20) top = 20;
    if (top + tooltipHeight > viewportHeight - 20) {
      top = viewportHeight - tooltipHeight - 20;
    }

    setTooltipPosition({ top, left });
  }, [currentStep]);

  // Resetear step index cuando se desactiva
  useEffect(() => {
    if (!isActive && externalStepIndex === undefined) {
      setInternalStepIndex(0);
    }
  }, [isActive, externalStepIndex]);

  // Forzar actualización del target cuando cambia la ruta
  useEffect(() => {
    if (isActive) {
      // Resetear estado cuando cambia la ruta
      setIsTargetVisible(false);
      setTargetRect(null);
      setTooltipPosition(null);
      setShowNotFoundModal(false);
      
      // Limpiar timeout anterior
      if (notFoundTimeoutRef.current) {
        clearTimeout(notFoundTimeoutRef.current);
        notFoundTimeoutRef.current = null;
      }
      
      // Múltiples intentos con delays crecientes para dar tiempo al DOM
      const timeouts = [
        setTimeout(() => updateTargetPosition(), 300),
        setTimeout(() => updateTargetPosition(), 800),
        setTimeout(() => updateTargetPosition(), 1500),
        setTimeout(() => updateTargetPosition(), 2500),
      ];
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
        if (notFoundTimeoutRef.current) {
          clearTimeout(notFoundTimeoutRef.current);
        }
      };
    }
  }, [pathname, isActive, updateTargetPosition]);

    // Verificar periódicamente si el target existe y actualizar posición
  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      setTooltipPosition(null);
      setIsTargetVisible(false);
      return;
    }

    // Pequeño delay para que el DOM se actualice después de navegación
    const timeout = setTimeout(() => {
      updateTargetPosition();
    }, 300);

    // Verificar cada 500ms si el target cambió de posición o apareció
    // Aumentar la frecuencia cuando el target no es visible
    checkIntervalRef.current = setInterval(() => {
      updateTargetPosition();
    }, isTargetVisible ? 500 : 200);

    // También escuchar scroll y resize
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

  const handleNext = () => {
    try {
      if (currentStepIndex < steps.length - 1) {
        const newIndex = currentStepIndex + 1;
        if (onStepChange) {
          onStepChange(newIndex);
        } else {
          setInternalStepIndex(newIndex);
        }
        // Resetear posición del target al cambiar de paso
        setTimeout(() => {
          updateTargetPosition();
        }, 100);
      } else {
        handleComplete();
      }
    } catch (error) {
      console.error('[OnboardingCliente] Error en handleNext:', error);
    }
  };

  const handlePrevious = () => {
    try {
      if (currentStepIndex > 0) {
        const newIndex = currentStepIndex - 1;
        if (onStepChange) {
          onStepChange(newIndex);
        } else {
          setInternalStepIndex(newIndex);
        }
        // Resetear posición del target al cambiar de paso
        setTimeout(() => {
          updateTargetPosition();
        }, 100);
      }
    } catch (error) {
      console.error('[OnboardingCliente] Error en handlePrevious:', error);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isActive || !currentStep) return null;

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
          {currentStep.position === 'bottom' && targetRect && (
            <div
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-200"
            />
          )}
          {currentStep.position === 'top' && targetRect && (
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"
            />
          )}
          {currentStep.position === 'right' && targetRect && (
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-200"
            />
          )}
          {currentStep.position === 'left' && targetRect && (
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
                    onClick={handlePrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 inline mr-1" />
                    Anterior
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Saltar tutorial
                </button>

                {currentStepIndex < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
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

      {/* Mensaje si el target no existe después de varios intentos */}
      {showNotFoundModal && !isTargetVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Elemento no encontrado
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              El elemento del tutorial no está visible en este momento. Asegurate de estar en la sección correcta o continuá al siguiente paso.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Saltar tutorial
              </button>
              <button
                onClick={() => {
                  setShowNotFoundModal(false);
                  handleNext();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Siguiente paso
              </button>
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

