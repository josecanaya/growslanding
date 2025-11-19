'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { OnboardingBase, type OnboardingStep } from './OnboardingBase';

// Pasos específicos para organizar tareas (CPM)
const STEPS: OnboardingStep[] = [
  {
    id: 'lienzo-tareas',
    target: '[data-onboarding="lienzo-tareas"]',
    title: 'Lienzo de tareas',
    description: 'Este es el área donde podés organizar visualmente las tareas. Arrastrá las tareas para posicionarlas y definir el orden de ejecución. Cada tarea se muestra como un nodo con su información.',
    position: 'bottom',
  },
  {
    id: 'agregar-tarea',
    target: '[data-onboarding="agregar-tarea"]',
    title: 'Agregar tareas al lienzo',
    description: 'Hacé click en el botón + para abrir el modal y seleccionar tareas disponibles. Podés agregar tareas por planta y fase, y el sistema calculará automáticamente su duración según la cantidad de elementos.',
    position: 'left',
  },
  {
    id: 'conectar-tareas',
    target: '[data-onboarding="conectar-tareas"]',
    title: 'Conectar tareas',
    description: 'Las tareas se conectan automáticamente según sus dependencias. Hacé click en una tarea para editar sus dependencias y definir qué tareas deben completarse antes.',
    position: 'top',
  },
  {
    id: 'mostrar-cpm',
    target: '[data-onboarding="mostrar-cpm"]',
    title: 'Camino crítico (CPM)',
    description: 'El sistema calcula automáticamente el camino crítico. Las tareas en rojo son críticas (sin holgura) y determinan la duración total del proyecto. Las tareas con holgura muestran cuántos días pueden retrasarse sin afectar el proyecto.',
    position: 'bottom',
  },
  {
    id: 'guardar-lienzo',
    target: '[data-onboarding="guardar-lienzo"]',
    title: 'Guardar el lienzo',
    description: 'Una vez que hayas organizado las tareas y sus dependencias, hacé click en "Guardar lienzo" para persistir los cambios. Esto guardará las posiciones, dependencias y duraciones en la base de datos.',
    position: 'bottom',
  },
  {
    id: 'controles-zoom',
    target: '[data-onboarding="controles-zoom"]',
    title: 'Controles de zoom',
    description: 'Ajustá el zoom para ver mejor el diagrama. Usá los botones + y - o la rueda del mouse con Ctrl. El botón de reset vuelve a la vista inicial.',
    position: 'bottom',
  },
  {
    id: 'ir-asignar',
    target: '[data-onboarding="tab-asignar"]',
    title: 'Asignar tareas a socios',
    description: 'Una vez organizadas las tareas, hacé click en la pestaña "Asigna" para asignar cada tarea a los socios o cuadrillas correspondientes. Esto permite distribuir el trabajo y hacer seguimiento de quién es responsable de cada tarea.',
    position: 'bottom',
  },
];

interface OnboardingOrganizarContextType {
  isActive: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const OnboardingOrganizarContext = createContext<OnboardingOrganizarContextType | undefined>(undefined);

export function OnboardingOrganizarProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const handleStart = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[OnboardingOrganizar] Evento startOnboardingOrganizar recibido');
      }
      setIsActive(true);
      setCurrentStepIndex(0);
    };

    window.addEventListener('startOnboardingOrganizar', handleStart);
    return () => window.removeEventListener('startOnboardingOrganizar', handleStart);
  }, []);

  const startOnboarding = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[OnboardingOrganizar] startOnboarding llamado');
    }
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
    <OnboardingOrganizarContext.Provider
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
    </OnboardingOrganizarContext.Provider>
  );
}

export function useOnboardingOrganizar() {
  const context = useContext(OnboardingOrganizarContext);
  if (context === undefined) {
    throw new Error('useOnboardingOrganizar must be used within OnboardingOrganizarProvider');
  }
  return context;
}

// Función helper para activar desde fuera del contexto
export function startOnboardingOrganizar() {
  const event = new CustomEvent('startOnboardingOrganizar');
  window.dispatchEvent(event);
}

