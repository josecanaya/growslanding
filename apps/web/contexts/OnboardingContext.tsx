'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
  setStepIndex: (index: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const setStepIndex = useCallback((index: number) => {
    setCurrentStepIndex(index);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        startOnboarding,
        stopOnboarding,
        completeOnboarding,
        setStepIndex,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}

