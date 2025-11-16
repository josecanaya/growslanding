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
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

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

  const handleSubscribe = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        toast({
          title: 'No se pudo actualizar el plan',
          description:
            'No encontramos una sesión activa. Iniciá sesión e intentá nuevamente.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('organizations')
        .update({ plan_actual: state.targetPlanId })
        .eq('owner_user_id', authData.user.id);

      if (error) {
        console.error('[UpgradeModal] Error updating plan:', error);
        toast({
          title: 'No se pudo actualizar el plan',
          description: 'Intentalo nuevamente en unos minutos.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Plan actualizado',
        description: `Plan ${state.targetPlanId} activado correctamente.`,
      });
      close();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('[UpgradeModal] Unexpected error updating plan:', error);
      toast({
        title: 'No se pudo actualizar el plan',
        description: 'Ocurrió un error inesperado. Volvé a intentar en unos minutos.',
        variant: 'destructive',
      });
    }
  }, [close, state.targetPlanId]);

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
        <DialogContent className="max-w-md rounded-2xl border border-zinc-800 bg-neutral-900 text-zinc-100 shadow-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-[#CBA135]">
              {targetPlan.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              {state.contextCopy ??
                state.reason ??
                'Descubrí las funciones disponibles en este plan para seguir escalando tu operación.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {limitDetails ? (
              <div className="rounded-xl border border-zinc-800 bg-neutral-800/70 px-4 py-3 text-sm text-zinc-200">
                <p className="font-semibold text-zinc-100">{limitDetails.label}</p>
                <p className="text-sm text-zinc-300">
                  {limitDetails.blockedCopy ??
                    'Alcanzaste el límite disponible en tu plan actual. Pasá al siguiente nivel para seguir creciendo.'}
                </p>
              </div>
            ) : null}

            {featureDetails ? (
              <div className="rounded-xl border border-zinc-800 bg-neutral-800/70 px-4 py-3 text-sm text-zinc-200">
                <p className="font-semibold text-zinc-100">
                  Funcionalidad destacada: {featureDetails.label}
                </p>
                <p className="text-sm text-zinc-300">
                  Disponible en {targetPlan.name}. Mejorá tu plan para activarla.
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-semibold text-zinc-100">
                Beneficios que desbloqueás
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                {targetPlan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#CBA135]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full bg-[#CBA135] text-black hover:bg-[#d3ad45]"
              onClick={handleSubscribe}
            >
              Activar plan
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
