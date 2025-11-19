'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { OnboardingBase, type OnboardingStep } from './OnboardingBase';

// Pasos específicos para crear obra
const STEPS: OnboardingStep[] = [
  {
    id: 'crear-obra',
    target: '[data-onboarding="crear-obra"]',
    title: 'Crear una nueva obra',
    description: 'Usá este botón para crear una nueva obra. Podrás definir el nombre, ubicación y tipo de construcción. Cada obra es un proyecto independiente que podrás gestionar por separado.',
    position: 'bottom',
  },
  {
    id: 'estadisticas-obras',
    target: '[data-onboarding="estadisticas-obras"]',
    title: 'Estadísticas de tus obras',
    description: 'Acá podés ver un resumen rápido: el total de obras, cuántas están activas, pausadas, finalizadas o canceladas. Te ayuda a tener una vista general del estado de todos tus proyectos.',
    position: 'bottom',
  },
  {
    id: 'card-obra',
    target: '[data-onboarding="card-obra"]',
    title: 'Tarjeta de obra',
    description: 'Cada tarjeta muestra la información principal de una obra: nombre, ubicación, estado y fecha de creación. Hacé click en cualquier parte de la tarjeta para ver el detalle completo.',
    position: 'bottom',
  },
  {
    id: 'estado-obra',
    target: '[data-onboarding="estado-obra"]',
    title: 'Estado de la obra',
    description: 'El badge de estado indica si la obra está ACTIVA (en curso), PAUSADA (temporalmente detenida), FINALIZADA (completada) o CANCELADA. Podés cambiar el estado desde el detalle de la obra.',
    position: 'right',
  },
  {
    id: 'acciones-obra',
    target: '[data-onboarding="acciones-obra"]',
    title: 'Acciones sobre la obra',
    description: 'Con estos botones podés: VER (abrir el detalle completo), EDITAR (modificar información básica) o ELIMINAR (borrar la obra permanentemente).',
    position: 'top',
  },
];

interface OnboardingCrearObraContextType {
  isActive: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const OnboardingCrearObraContext = createContext<OnboardingCrearObraContextType | undefined>(undefined);

export function OnboardingCrearObraProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      setIsActive(true);
      setCurrentStepIndex(0);
    };

    window.addEventListener('startOnboardingCrearObra', handleStart);
    return () => window.removeEventListener('startOnboardingCrearObra', handleStart);
  }, []);

  const startOnboarding = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
  }, []);

  const stopOnboarding = useCallback(() => {
    setIsActive(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStepIndex, completeOnboarding]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  return (
    <OnboardingCrearObraContext.Provider
      value={{
        isActive,
        currentStepIndex,
        startOnboarding,
        stopOnboarding,
        completeOnboarding,
        nextStep,
        previousStep,
      }}
    >
      {children}
      <OnboardingBase
        steps={STEPS}
        isActive={isActive}
        currentStepIndex={currentStepIndex}
        onClose={stopOnboarding}
        onComplete={completeOnboarding}
        onNext={nextStep}
        onPrevious={previousStep}
      />
    </OnboardingCrearObraContext.Provider>
  );
}

export function useOnboardingCrearObra() {
  const context = useContext(OnboardingCrearObraContext);
  if (context === undefined) {
    throw new Error('useOnboardingCrearObra must be used within OnboardingCrearObraProvider');
  }
  return context;
}

// Función helper para activar desde fuera del contexto
export function startOnboardingCrearObra() {
  // Esta función se usará desde componentes que no tienen acceso directo al contexto
  // Se implementará mediante un evento global o ref
  const event = new CustomEvent('startOnboardingCrearObra');
  window.dispatchEvent(event);
}

