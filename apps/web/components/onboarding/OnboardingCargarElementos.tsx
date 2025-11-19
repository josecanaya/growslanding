'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { OnboardingBase, type OnboardingStep } from './OnboardingBase';

// Pasos específicos para cargar elementos
const STEPS: OnboardingStep[] = [
  {
    id: 'seleccionar-categoria',
    target: '[data-onboarding="seleccionar-categoria"]',
    title: 'Seleccionar categoría',
    description: 'Elegí la categoría del elemento que querés cargar: Fundaciones, Muros, Pisos, Cubiertas, etc. Cada categoría tiene diferentes tipos de elementos disponibles.',
    position: 'bottom',
  },
  {
    id: 'seleccionar-tipo',
    target: '[data-onboarding="seleccionar-tipo"]',
    title: 'Seleccionar tipo de elemento',
    description: 'Una vez elegida la categoría, seleccioná el tipo específico de elemento. Por ejemplo, dentro de Muros podés elegir entre Muro de ladrillo, Muro de hormigón, etc.',
    position: 'bottom',
  },
  {
    id: 'definir-cantidad',
    target: '[data-onboarding="definir-cantidad"]',
    title: 'Definir cantidad',
    description: 'Especificá la cantidad del elemento en la unidad correspondiente (m², m³, unidades, etc.). Esta información se usará para generar las tareas automáticamente.',
    position: 'top',
  },
  {
    id: 'confirmar-elemento',
    target: '[data-onboarding="confirmar-elemento"]',
    title: 'Confirmar y agregar',
    description: 'Revisá la información y confirmá para agregar el elemento. El sistema generará automáticamente las tareas relacionadas según el tipo de construcción.',
    position: 'top',
  },
  {
    id: 'ver-elementos-cargados',
    target: '[data-onboarding="ver-elementos-cargados"]',
    title: 'Ver elementos cargados',
    description: 'Acá podés ver todos los elementos que ya cargaste, editarlos o eliminarlos. Cada elemento tiene asociadas sus tareas correspondientes.',
    position: 'bottom',
  },
];

interface OnboardingCargarElementosContextType {
  isActive: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const OnboardingCargarElementosContext = createContext<OnboardingCargarElementosContextType | undefined>(undefined);

export function OnboardingCargarElementosProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      setIsActive(true);
      setCurrentStepIndex(0);
    };

    window.addEventListener('startOnboardingCargarElementos', handleStart);
    return () => window.removeEventListener('startOnboardingCargarElementos', handleStart);
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
    <OnboardingCargarElementosContext.Provider
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
    </OnboardingCargarElementosContext.Provider>
  );
}

export function useOnboardingCargarElementos() {
  const context = useContext(OnboardingCargarElementosContext);
  if (context === undefined) {
    throw new Error('useOnboardingCargarElementos must be used within OnboardingCargarElementosProvider');
  }
  return context;
}

// Función helper para activar desde fuera del contexto
export function startOnboardingCargarElementos() {
  const event = new CustomEvent('startOnboardingCargarElementos');
  window.dispatchEvent(event);
}

