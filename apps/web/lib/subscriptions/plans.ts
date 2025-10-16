import {
  type PlanFeatureKey,
  type SubscriptionPlanId,
  SUBSCRIPTION_PLAN_ORDER,
} from './types';
import {
  PLAN_CARDS,
  PLAN_FEATURES,
  PLAN_LIMIT_RULES,
} from './texts';

export { PLAN_CARDS, PLAN_FEATURES, PLAN_LIMIT_RULES } from './texts';

export function getPlanCard(planId: SubscriptionPlanId) {
  return PLAN_CARDS[planId];
}

export function getPlanOrder(planId: SubscriptionPlanId): number {
  return SUBSCRIPTION_PLAN_ORDER.indexOf(planId);
}

export function getNextPlan(
  planId: SubscriptionPlanId,
  feature: PlanFeatureKey,
): SubscriptionPlanId | null {
  const limitRuleEntry = Object.values(PLAN_LIMIT_RULES).find(
    (rule) => rule.feature === feature,
  );
  if (!limitRuleEntry) {
    return null;
  }
  return limitRuleEntry.upgradeTargets[planId] ?? null;
}
