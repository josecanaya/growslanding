'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PLAN_FEATURES, PLAN_LIMIT_RULES } from '@/lib/subscriptions/plans';
import {
  type PlanFeatureKey,
  type PlanLimitRuleId,
  type SubscriptionPlanId,
} from '@/lib/subscriptions/types';
import { usePlanCard } from '@/lib/subscriptions/hooks';

type UpgradeModalRequest = {
  targetPlanId: SubscriptionPlanId;
  featureId?: PlanFeatureKey;
  limitId?: PlanLimitRuleId;
  reason?: string;
  source?: string;
  contextCopy?: string;
};

type UpgradeModalContextValue = {
  open: (request: UpgradeModalRequest) => void;
  close: () => void;
  isOpen: boolean;
};

const UpgradeModalContext = createContext<UpgradeModalContextValue | null>(
  null,
);

type UpgradeModalState = UpgradeModalRequest & {
  open: boolean;
};

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UpgradeModalState>({
    open: false,
    targetPlanId: 'STARTER',
  });
  const router = useRouter();

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const open = useCallback((request: UpgradeModalRequest) => {
    setState({
      ...request,
      open: true,
    });
  }, []);

  const targetPlan = usePlanCard(state.targetPlanId);
  const limitDetails = state.limitId ? PLAN_LIMIT_RULES[state.limitId] : null;
  const featureDetails = state.featureId
    ? PLAN_FEATURES.find((feature) => feature.id === state.featureId)
    : null;

  const contextValue = useMemo<UpgradeModalContextValue>(
    () => ({
      open,
      close,
      isOpen: state.open,
    }),
    [open, close, state.open],
  );

  const handleSubscribe = useCallback(() => {
    const query = new URLSearchParams();
    query.set('plan', state.targetPlanId);
    if (state.source) {
      query.set('from', state.source);
    }
    close();
    router.push(`/cuenta?${query.toString()}`);
  }, [close, router, state.targetPlanId, state.source]);

  const handleViewPlans = useCallback(() => {
    const query = new URLSearchParams();
    query.set('plan', state.targetPlanId);
    query.set('view', 'planes');
    close();
    router.push(`/cuenta?${query.toString()}`);
  }, [close, router, state.targetPlanId]);

  return (
    <UpgradeModalContext.Provider value={contextValue}>
      {children}
      <Dialog open={state.open} onOpenChange={(next) => (!next ? close() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{targetPlan.name}</DialogTitle>
            <DialogDescription>
              {state.contextCopy ??
                state.reason ??
                'Descubrí las funciones disponibles en este plan para seguir escalando tu operación.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {limitDetails ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  {limitDetails.label}
                </p>
                <p>
                  {limitDetails.blockedCopy ??
                    'Alcanzaste el límite disponible en tu plan actual. Pasá al siguiente nivel para seguir creciendo.'}
                </p>
              </div>
            ) : null}

            {featureDetails ? (
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Funcionalidad destacada: {featureDetails.label}
                </p>
                <p className="text-sm text-slate-600">
                  Disponible en {targetPlan.name}. Mejorá tu plan para activarla.
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Beneficios que desbloqueás
              </p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {targetPlan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col items-stretch gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full"
              onClick={handleSubscribe}
            >
              Suscribirme
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleViewPlans}
            >
              Ver todos los planes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error(
      'useUpgradeModal debe usarse dentro de UpgradeModalProvider',
    );
  }
  return context;
}
