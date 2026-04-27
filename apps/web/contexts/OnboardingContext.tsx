'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Ctx = {
  isActive: boolean;
  currentStepIndex: number;
  setIsActive: (v: boolean) => void;
  setStepIndex: (i: number) => void;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  completeOnboarding: () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

const noop = () => {};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setStepIndex] = useState(0);

  const startOnboarding = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const stopOnboarding = useCallback(() => {
    setIsActive(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
  }, []);

  const v = useMemo(
    () => ({
      isActive,
      currentStepIndex,
      setIsActive,
      setStepIndex,
      startOnboarding,
      stopOnboarding,
      completeOnboarding,
    }),
    [isActive, currentStepIndex, startOnboarding, stopOnboarding, completeOnboarding],
  );

  return <OnboardingContext.Provider value={v}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext(): Ctx {
  const c = useContext(OnboardingContext);
  if (!c) {
    return {
      isActive: false,
      currentStepIndex: 0,
      setIsActive: noop,
      setStepIndex: noop,
      startOnboarding: noop,
      stopOnboarding: noop,
      completeOnboarding: noop,
    };
  }
  return c;
}
