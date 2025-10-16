'use client';

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { SubscriptionPlanId } from './types';
import { SUBSCRIPTION_PLAN_ORDER } from './types';

type SubscriptionContextValue = {
  planId: SubscriptionPlanId;
  effectivePlanId: SubscriptionPlanId;
  overridePlanId: SubscriptionPlanId | null;
  isSimulated: boolean;
  isLoading: boolean;
  setPlan: (
    planId: SubscriptionPlanId,
    options?: { simulated?: boolean },
  ) => void;
  setOverridePlan: Dispatch<SetStateAction<SubscriptionPlanId | null>>;
  clearOverride: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const PLAN_STORAGE_KEY = 'grows.subscription.plan';
const OVERRIDE_STORAGE_KEY = 'grows.subscription.override';

const DEFAULT_PLAN: SubscriptionPlanId = 'FREE';

function isValidPlan(value: unknown): value is SubscriptionPlanId {
  return typeof value === 'string' && SUBSCRIPTION_PLAN_ORDER.includes(value as never);
}

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [planId, setPlanId] = useState<SubscriptionPlanId>(DEFAULT_PLAN);
  const [overridePlanId, setOverridePlanId] = useState<SubscriptionPlanId | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar desde storage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedPlan = window.localStorage.getItem(PLAN_STORAGE_KEY);
    const storedOverride = window.localStorage.getItem(OVERRIDE_STORAGE_KEY);

    if (isValidPlan(storedPlan)) {
      setPlanId(storedPlan);
    }

    if (isValidPlan(storedOverride)) {
      setOverridePlanId(storedOverride);
    }

    const simulatedFlag =
      window.localStorage.getItem(`${PLAN_STORAGE_KEY}.simulated`) === 'true';
    setIsSimulated(simulatedFlag);
    setIsLoading(false);
  }, []);

  // Persistir plan principal
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) {
      return;
    }

    window.localStorage.setItem(PLAN_STORAGE_KEY, planId);
  }, [planId, isLoading]);

  // Persistir flag de simulación
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) {
      return;
    }
    window.localStorage.setItem(
      `${PLAN_STORAGE_KEY}.simulated`,
      isSimulated ? 'true' : 'false',
    );
  }, [isSimulated, isLoading]);

  // Persistir override
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) {
      return;
    }

    if (overridePlanId) {
      window.localStorage.setItem(OVERRIDE_STORAGE_KEY, overridePlanId);
    } else {
      window.localStorage.removeItem(OVERRIDE_STORAGE_KEY);
    }
  }, [overridePlanId, isLoading]);

  const effectivePlanId = overridePlanId ?? planId;
  const effectiveSimulated = isSimulated || Boolean(overridePlanId);

  const setPlan = (nextPlan: SubscriptionPlanId, options?: { simulated?: boolean }) => {
    setPlanId(nextPlan);
    if (options?.simulated !== undefined) {
      setIsSimulated(options.simulated);
    } else {
      setIsSimulated(false);
    }
  };

  const clearOverride = () => {
    setOverridePlanId(null);
  };

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      planId,
      effectivePlanId,
      overridePlanId,
      isSimulated: effectiveSimulated,
      isLoading,
      setPlan,
      setOverridePlan: setOverridePlanId,
      clearOverride,
    }),
    [
      planId,
      effectivePlanId,
      overridePlanId,
      effectiveSimulated,
      isLoading,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  }
  return context;
}

