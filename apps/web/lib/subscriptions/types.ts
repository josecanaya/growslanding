export type SubscriptionPlanId = 'FREE' | 'STARTER' | 'PRO';

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = [
  'FREE',
  'STARTER',
  'PRO',
];

export type PlanFeatureKey =
  | 'chat'
  | 'obras'
  | 'tareas'
  | 'cuadrillas'
  | 'bim'
  | 'dependencias'
  | 'n8n'
  | 'reportes'
  | 'auditoria'
  | 'comparadores'
  | 'notificaciones'
  | 'calendario';

export type PlanLimitRuleId = Extract<
  PlanFeatureKey,
  'obras' | 'tareas' | 'cuadrillas' | 'notificaciones' | 'calendario'
>;

export type PlanCardDescriptor = {
  id: SubscriptionPlanId;
  name: string;
  shortName: string;
  badge?: string;
  description: string;
  priceLabel: string;
  priceAmount: number;
  currency: string;
  cadenceLabel: string;
  highlight?: string;
  benefits: string[];
  summary: string;
};

export type BooleanFeatureValue = {
  enabled: boolean;
  description?: string;
};

export type CapFeatureValue = {
  max: number | null;
  unit: string;
  description?: string;
};

export type ModeFeatureValue = {
  label: string;
  description?: string;
};

export type PlanFeatureDefinition =
  | {
      id: PlanFeatureKey;
      label: string;
      type: 'boolean';
      values: Record<SubscriptionPlanId, BooleanFeatureValue>;
      description?: string;
    }
  | {
      id: PlanFeatureKey;
      label: string;
      type: 'cap';
      values: Record<SubscriptionPlanId, CapFeatureValue>;
      description?: string;
    }
  | {
      id: PlanFeatureKey;
      label: string;
      type: 'mode';
      values: Record<SubscriptionPlanId, ModeFeatureValue>;
      description?: string;
    };

export type PlanLimitRule = {
  id: PlanLimitRuleId;
  label: string;
  feature: PlanFeatureKey;
  thresholds: Record<SubscriptionPlanId, number | null>;
  upgradeTargets: Partial<Record<SubscriptionPlanId, SubscriptionPlanId>>;
  unit: string;
  description: string;
  blockedCopy?: string;
};
