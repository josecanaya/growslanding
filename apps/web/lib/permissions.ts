import { useSubscription } from '@/lib/subscriptions';
import { useUpgradeModal } from '@/components/subscriptions/UpgradeModal';
import type { PlanFeatureKey, SubscriptionPlanId } from '@/lib/subscriptions/types';

/**
 * Define qué planes pueden usar cada feature.
 * NOTE: Section-based gating removed. Only limit-based gating remains.
 * Sections (chat, calendario, notificaciones, cuadrillas) are now available to all plans.
 */
const FEATURE_RULES: Record<string, string[]> = {
  obras: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
  validacion: ['STARTER', 'PRO', 'ENTERPRISE'],
  // Removed: chat, calendario, notificaciones, cuadrillas - now available to all plans
};

/** Verifica si un plan tiene acceso a una funcionalidad */
export const canUseFeature = (planId: string, feature: string) => {
  return FEATURE_RULES[feature]?.includes(planId) ?? false;
};

const PLAN_FEATURE_KEYS: PlanFeatureKey[] = [
  'chat',
  'obras',
  'tareas',
  'cuadrillas',
  'bim',
  'dependencias',
  'n8n',
  'reportes',
  'auditoria',
  'comparadores',
  'notificaciones',
  'calendario',
];

const isPlanFeatureKey = (feature: string): feature is PlanFeatureKey => {
  return PLAN_FEATURE_KEYS.includes(feature as PlanFeatureKey);
};

/**
 * Hook que centraliza permisos y upgrade modal.
 */
export const usePlanGate = () => {
  const { planId } = useSubscription();
  const upgradeModal = useUpgradeModal();

  const verifyAccess = (feature: string, targetPlanId?: SubscriptionPlanId) => {
    if (!canUseFeature(planId, feature)) {
      upgradeModal.open({
        targetPlanId: targetPlanId ?? 'STARTER',
        featureId: isPlanFeatureKey(feature) ? feature : undefined,
        reason: `Tu plan (${planId}) no permite usar esta función.`,
        contextCopy: 'Actualizá a Starter o superior para desbloquearla.',
      });
      return false;
    }
    return true;
  };

  return { verifyAccess };
};

