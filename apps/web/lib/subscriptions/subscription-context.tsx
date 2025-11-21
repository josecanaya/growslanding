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

const DEFAULT_PLAN: SubscriptionPlanId = 'FREE';

function isValidPlan(value: unknown): value is SubscriptionPlanId {
  return typeof value === 'string' && SUBSCRIPTION_PLAN_ORDER.includes(value as never);
}

const noopSetOverride = (() => undefined) as Dispatch<
  SetStateAction<SubscriptionPlanId | null>
>;

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [planId, setPlanId] = useState<SubscriptionPlanId>(DEFAULT_PLAN);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar desde storage y sincronizar con API
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // 1) Estado inicial desde localStorage (fallback inmediato)
    const storedPlan = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (isValidPlan(storedPlan)) {
      setPlanId(storedPlan);
    }
    const simulatedFlag =
      window.localStorage.getItem(`${PLAN_STORAGE_KEY}.simulated`) === 'true';
    setIsSimulated(simulatedFlag);
    setIsLoading(false);

    // 2) Sincronizar con la API en segundo plano (solo si hay sesión)
    const abortController = new AbortController();
    const fetchPlan = async () => {
      try {
        // Verificar si hay una sesión activa antes de hacer la petición
        // Esto evita errores 401 innecesarios cuando el usuario no está autenticado
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No hay sesión, usar plan por defecto sin hacer petición
          setPlanId(DEFAULT_PLAN);
          return;
        }

        const response = await fetch('/api/subscription/plan', {
          signal: abortController.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Usuario no autenticado, usar plan por defecto
            setPlanId(DEFAULT_PLAN);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data: { planId?: unknown } = await response.json();
        if (isValidPlan(data.planId)) {
          setPlanId(data.planId);
        } else {
          setPlanId(DEFAULT_PLAN);
          return;
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // Solo loguear errores que no sean de aborto o 401 (que son esperados)
          const errorMessage = (error as Error).message || '';
          if (!errorMessage.includes('401') && !errorMessage.includes('Unauthorized')) {
            console.error('[SubscriptionProvider] Error fetching plan from API:', error);
          }
        }
        setPlanId(DEFAULT_PLAN);
      }
    };

    void fetchPlan();

    return () => {
      abortController.abort();
    };
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

  const effectivePlanId = planId;
  const effectiveSimulated = isSimulated;

  const setPlan = (nextPlan: SubscriptionPlanId, options?: { simulated?: boolean }) => {
    setPlanId(nextPlan);
    if (options?.simulated !== undefined) {
      setIsSimulated(options.simulated);
    } else {
      setIsSimulated(false);
    }
  };

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      planId,
      effectivePlanId,
      overridePlanId: null,
      isSimulated: effectiveSimulated,
      isLoading,
      setPlan,
      setOverridePlan: noopSetOverride,
      clearOverride: () => undefined,
    }),
    [
      planId,
      effectivePlanId,
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

