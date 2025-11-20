'use client';

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';

interface OnboardingContextValue {
  isActive: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
  setStepIndex: Dispatch<SetStateAction<number>>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setStepIndex] = useState(0);

  const startOnboarding = useCallback(() => {
    setIsActive(true);
    setStepIndex(0);
  }, []);

  const stopOnboarding = useCallback(() => {
    setIsActive(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
  }, []);

  const value: OnboardingContextValue = {
    isActive,
    currentStepIndex,
    startOnboarding,
    stopOnboarding,
    completeOnboarding,
    setStepIndex,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    // Retornar valores por defecto si el contexto no está disponible
    return {
      isActive: false,
      currentStepIndex: 0,
      startOnboarding: () => {},
      stopOnboarding: () => {},
      completeOnboarding: () => {},
      setStepIndex: () => {},
    };
  }
  return context;
}

