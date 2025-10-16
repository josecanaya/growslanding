import { useMemo } from 'react';

import { useSubscription } from './subscription-context';
import {
  PLAN_CARDS,
  PLAN_FEATURES,
  PLAN_LIMIT_RULES,
} from './plans';
import type {
  PlanFeatureKey,
  PlanLimitRuleId,
  SubscriptionPlanId,
} from './types';

export function useCurrentPlan() {
  const subscription = useSubscription();

  const card = PLAN_CARDS[subscription.effectivePlanId];

  return {
    ...subscription,
    planCard: card,
  };
}

export function usePlanCard(planId: SubscriptionPlanId) {
  return PLAN_CARDS[planId];
}

export function usePlanCards() {
  const cards = useMemo(
    () => Object.values(PLAN_CARDS),
    [],
  );
  return cards;
}

export function usePlanFeature(featureId: PlanFeatureKey) {
  const { effectivePlanId } = useSubscription();

  const feature = PLAN_FEATURES.find((item) => item.id === featureId);

  return useMemo(() => {
    if (!feature) {
      return null;
    }

    return {
      feature,
      value: feature.values[effectivePlanId],
      type: feature.type,
    };
  }, [effectivePlanId, feature]);
}

export function usePlanLimit(limitId: PlanLimitRuleId) {
  const { effectivePlanId } = useSubscription();
  const rule = PLAN_LIMIT_RULES[limitId];

  return useMemo(() => {
    if (!rule) {
      return null;
    }

    return {
      rule,
      threshold: rule.thresholds[effectivePlanId],
      upgradeTarget: rule.upgradeTargets[effectivePlanId] ?? null,
    };
  }, [effectivePlanId, rule]);
}

export function useAllPlanLimits() {
  const { effectivePlanId } = useSubscription();

  return useMemo(() => {
    return Object.values(PLAN_LIMIT_RULES).map((rule) => ({
      rule,
      threshold: rule.thresholds[effectivePlanId],
      upgradeTarget: rule.upgradeTargets[effectivePlanId] ?? null,
    }));
  }, [effectivePlanId]);
}

export function usePlanLimitGuard(limitId: PlanLimitRuleId) {
  const limit = usePlanLimit(limitId);
  const { effectivePlanId } = useSubscription();

  return useMemo(() => {
    if (!limit) {
      return {
        isBlocked: false,
        threshold: null as number | null,
        upgradeTarget: null as SubscriptionPlanId | null,
        shouldBlock: (_current: number, _delta = 1) => false,
      };
    }

    const threshold = limit.threshold;
    const upgradeTarget = limit.upgradeTarget;

    const shouldBlock = (currentCount: number, delta = 1) => {
      if (threshold === null) {
        return false;
      }
      if (threshold === 0) {
        return true;
      }
      return currentCount + delta > threshold;
    };

    const isBlocked = threshold === 0;

    return {
      isBlocked,
      threshold,
      upgradeTarget,
      planId: effectivePlanId,
      shouldBlock,
      rule: limit.rule,
    };
  }, [limit, effectivePlanId]);
}
