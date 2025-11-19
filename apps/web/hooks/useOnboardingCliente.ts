'use client';

import { useOnboardingContext } from '@/contexts/OnboardingContext';

const ONBOARDING_STEPS = [
  {
    id: 'crear-obra',
    target: '[data-onboarding="crear-obra"]',
    title: 'Crea tu primera obra',
    description: 'Empezá definiendo el proyecto. Acá podrás agregar el nombre, dirección y tipo de construcción.',
    position: 'bottom' as const,
  },
  {
    id: 'cargar-elementos',
    target: '[data-onboarding="cargar-elementos"]',
    title: 'Agregá los elementos de tu obra',
    description: 'Cargá paredes, techos, pisos y otros componentes. Cada elemento generará tareas automáticamente según el tipo de construcción. Primero seleccioná una obra y luego hacé click en "Organiza".',
    position: 'bottom' as const,
  },
  {
    id: 'organizar-tareas',
    target: '[data-onboarding="organizar-tareas"]',
    title: 'Organizá el flujo de trabajo',
    description: 'Arrastrá las tareas al lienzo para definir el orden. El sistema calculará automáticamente el camino crítico y la duración del proyecto.',
    position: 'top' as const,
  },
];

export function useOnboardingCliente() {
  const contextValue = useOnboardingContext();

  return {
    isActive: contextValue.isActive,
    currentStepIndex: contextValue.currentStepIndex,
    steps: ONBOARDING_STEPS,
    startOnboarding: contextValue.startOnboarding,
    stopOnboarding: contextValue.stopOnboarding,
    completeOnboarding: contextValue.completeOnboarding,
    setStepIndex: contextValue.setStepIndex,
  };
}

