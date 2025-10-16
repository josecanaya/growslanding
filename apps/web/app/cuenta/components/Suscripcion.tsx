"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  PLAN_FEATURES,
  type PlanFeatureDefinition,
  type PlanLimitRuleId,
  type SubscriptionPlanId,
  useAllPlanLimits,
  useCurrentPlan,
  usePlanCard,
  usePlanCards,
} from "@/lib/subscriptions";
import { usePlanUsage } from "@/lib/subscriptions/use-plan-usage";
import { useUpgradeModal } from "@/components/subscriptions/UpgradeModal";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { SUBSCRIPTION_UI_COPY } from "@/lib/subscriptions/texts";

type UsageState = ReturnType<typeof usePlanUsage>;

type LimitCardProps = {
  id: string;
  label: string;
  valueLabel: string;
  usageLabel: string;
  progressValue: number | null;
  status: "ok" | "warning" | "blocked";
  description?: string;
};

function LimitCard({
  label,
  valueLabel,
  usageLabel,
  progressValue,
  status,
  description,
}: LimitCardProps) {
  const statusColors: Record<typeof status, string> = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    blocked: "border-rose-200 bg-rose-50 text-rose-900",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 shadow-sm transition-colors",
        statusColors[status]
      )}
    >
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{valueLabel}</p>
      <p className="text-xs opacity-80">{usageLabel}</p>
      {description ? (
        <p className="mt-2 text-xs opacity-80">{description}</p>
      ) : null}
      {progressValue !== null ? (
        <div className="mt-3">
          <Progress value={progressValue} className="h-2" />
        </div>
      ) : null}
    </div>
  );
}

function FeatureCell({
  feature,
  planId,
}: {
  feature: PlanFeatureDefinition;
  planId: SubscriptionPlanId;
}) {
  if (feature.type === "boolean") {
    const value = feature.values[planId];
    return (
      <div className="flex items-center justify-center gap-1">
        {value.enabled ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-rose-500" />
        )}
        {value.description ? (
          <span className="text-xs text-slate-500">{value.description}</span>
        ) : null}
      </div>
    );
  }

  if (feature.type === "cap") {
    const value = feature.values[planId];
    if (value.max === null) {
      return (
        <div className="text-center text-sm font-semibold text-emerald-600">
          Ilimitadas
        </div>
      );
    }

    if (value.max === 0) {
      return (
        <div className="flex items-center justify-center gap-1 text-xs font-semibold text-rose-500">
          <X className="h-4 w-4" />
          Bloqueado
        </div>
      );
    }

    return (
      <div className="text-center text-sm font-semibold text-slate-900">
        Hasta {value.max} {value.unit}
      </div>
    );
  }

  if (feature.type === "mode") {
    const value = feature.values[planId];
    return (
      <div className="text-center text-sm font-semibold text-slate-900">
        {value.label}
        {value.description ? (
          <p className="mt-1 text-xs text-slate-500">{value.description}</p>
        ) : null}
      </div>
    );
  }

  return <div />;
}

export default function Suscripcion() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const upgradeModal = useUpgradeModal();
  const subscription = useCurrentPlan();
  const planCards = usePlanCards();
  const limits = useAllPlanLimits();
  const usageObras = usePlanUsage("obras");
  const usageTareas = usePlanUsage("tareas");
  const usageCuadrillas = usePlanUsage("cuadrillas");
  const usageNotificaciones = usePlanUsage("notificaciones");
  const usageCalendario = usePlanUsage("calendario");
  const usageByLimit: Record<PlanLimitRuleId, UsageState> = {
    obras: usageObras,
    tareas: usageTareas,
    cuadrillas: usageCuadrillas,
    notificaciones: usageNotificaciones,
    calendario: usageCalendario,
  };
  const currentUser = useCurrentUser();

  const [selectedPlanId, setSelectedPlanId] =
    useState<SubscriptionPlanId>(subscription.effectivePlanId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preselectedPlan = useMemo(() => {
    const queryPlan = searchParams?.get("plan");
    if (!queryPlan) {
      return null;
    }
    const normalized = queryPlan.toUpperCase();
    if (
      normalized === "FREE" ||
      normalized === "STARTER" ||
      normalized === "PRO"
    ) {
      return normalized as SubscriptionPlanId;
    }
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (preselectedPlan && preselectedPlan !== selectedPlanId) {
      setSelectedPlanId(preselectedPlan);
    }
  }, [preselectedPlan, selectedPlanId]);

  const selectedPlanCard = usePlanCard(selectedPlanId);

  const limitCards = limits.map(({ rule, threshold }) => {
    const usageState = usageByLimit[rule.id];
    const used = usageState?.usage ?? 0;
    const limitIsBlocked = threshold === 0;
    const limitLabel =
      threshold === null
        ? SUBSCRIPTION_UI_COPY.usageUnlimited
        : `${threshold} ${rule.unit}`;

    const status: LimitCardProps["status"] = limitIsBlocked
      ? "blocked"
      : threshold !== null && used >= threshold
      ? "warning"
      : "ok";

    const usageLabel = usageState?.isLoading
      ? SUBSCRIPTION_UI_COPY.usageLoading
      : usageState?.error
      ? SUBSCRIPTION_UI_COPY.usageFallback
      : SUBSCRIPTION_UI_COPY.usageLabel(used, limitLabel);

    const progressValue =
      threshold && threshold > 0
        ? Math.min(100, Math.round((used / threshold) * 100))
        : null;

    return {
      id: rule.id,
      label: rule.label,
      valueLabel: limitIsBlocked ? "No disponible" : limitLabel,
      usageLabel,
      progressValue,
      status,
      description: rule.description,
    };
  });

  const handleSubscribe = async (planId: SubscriptionPlanId) => {
    if (planId === subscription.planId && !subscription.overridePlanId) {
      toast({
        title: SUBSCRIPTION_UI_COPY.simulationToastTitle,
        description: SUBSCRIPTION_UI_COPY.simulationToastMessage,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          payerEmail: currentUser?.email ?? null,
          externalReference: currentUser?.orgId ?? undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.error ?? "No pudimos actualizar tu suscripcion en este momento."
        );
      }

      subscription.setPlan(planId);
      subscription.clearOverride();
      setSelectedPlanId(planId);
      toast({
        title: SUBSCRIPTION_UI_COPY.successToastTitle,
        description: SUBSCRIPTION_UI_COPY.successToastMessage(planId),
      });
    } catch (error) {
      toast({
        title: SUBSCRIPTION_UI_COPY.errorToastTitle,
        description:
          error instanceof Error
            ? error.message
            : "Intentalo nuevamente en unos minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanPreview = (planId: SubscriptionPlanId) => {
    setSelectedPlanId(planId);
    if (subscription.effectivePlanId === planId) {
      return;
    }

    upgradeModal.open({
      targetPlanId: planId,
      reason: SUBSCRIPTION_UI_COPY.planPreviewReason,
      source: "cuenta",
    });
  };

  return (
    <div className="space-y-10">
      <Card className="rounded-3xl border border-[#e3dff2] bg-white/90 px-8 py-10 shadow-sm dark:border-[#2a263a] dark:bg-[#1c1a2b]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6d4be8]">
              {SUBSCRIPTION_UI_COPY.currentPlanLabel}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-3xl font-bold text-[#1d1b29] dark:text-[#f5f3fc]">
                {subscription.planCard.name}
              </h2>
              <Badge variant="secondary">{subscription.planCard.priceLabel}</Badge>
            </div>
            <p className="mt-3 max-w-xl text-sm text-[#5b5570] dark:text-[#c2bddb]">
              {subscription.planCard.summary}
            </p>
            {subscription.isSimulated ? (
              <p className="mt-2 text-xs font-semibold text-amber-500">
                {SUBSCRIPTION_UI_COPY.simulatedNotice}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => upgradeModal.open({ targetPlanId: "STARTER" })}
            >
              {SUBSCRIPTION_UI_COPY.viewPlans}
            </Button>
            <Button onClick={() => upgradeModal.open({ targetPlanId: "PRO" })}>
              {SUBSCRIPTION_UI_COPY.quickUpgrade}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {limitCards.map((limit) => (
            <LimitCard key={limit.id} {...limit} />
          ))}
        </div>
      </Card>

      <Card className="rounded-3xl border border-[#e3dff2] bg-[#f7f6fb] px-8 py-10 shadow-sm dark:border-[#2a263a] dark:bg-[#1f1b33]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">
              {SUBSCRIPTION_UI_COPY.availablePlansHeading}
            </h3>
            <p className="mt-2 text-sm text-[#5b5570] dark:text-[#c2bddb]">
              {SUBSCRIPTION_UI_COPY.availablePlansDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-[#5b5570] dark:text-[#c2bddb]">
              {SUBSCRIPTION_UI_COPY.planSelectedLabel}
            </span>
            <Badge>{selectedPlanCard.shortName}</Badge>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {planCards.map((card) => {
            const isCurrent =
              subscription.effectivePlanId === card.id &&
              !subscription.overridePlanId;
            const isSelected = selectedPlanId === card.id;
            return (
              <div
                key={card.id}
                className={cn(
                  "flex h-full flex-col rounded-3xl border px-6 py-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
                  isSelected
                    ? "border-[#6d4be8] bg-white dark:bg-[#2a263a]"
                    : "border-transparent bg-white/70 dark:bg-[#25203b]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">
                      {card.name}
                    </h4>
                    <p className="text-sm text-[#6d4be8]">{card.priceLabel}</p>
                  </div>
                  {card.badge ? (
                    <Badge variant="secondary">{card.badge}</Badge>
                  ) : null}
                </div>

                <p className="mt-4 text-sm text-[#5b5570] dark:text-[#c2bddb]">
                  {card.description}
                </p>

                <ul className="mt-5 flex-1 space-y-2 text-sm text-[#5b5570] dark:text-[#c2bddb]">
                  {card.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#6d4be8]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent || isSubmitting}
                    onClick={() =>
                      isCurrent ? undefined : handleSubscribe(card.id)
                    }
                  >
                    {isCurrent
                      ? SUBSCRIPTION_UI_COPY.currentPlanButton
                      : SUBSCRIPTION_UI_COPY.subscribeButton}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handlePlanPreview(card.id)}
                  >
                    {SUBSCRIPTION_UI_COPY.viewDetailsButton}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="rounded-3xl border border-[#e3dff2] bg-white/90 px-6 py-8 shadow-sm dark:border-[#2a263a] dark:bg-[#1c1a2b]">
        <h3 className="text-2xl font-semibold text-[#1d1b29] dark:text-[#f5f3fc]">
          {SUBSCRIPTION_UI_COPY.comparisonHeading}
        </h3>
        <p className="mt-2 text-sm text-[#5b5570] dark:text-[#c2bddb]">
          {SUBSCRIPTION_UI_COPY.comparisonDescription}
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#5b5570] dark:text-[#c2bddb]">
                <th className="w-56 border-b border-[#e3dff2] py-3 text-sm font-semibold">
                  Funcionalidad
                </th>
                {planCards.map((card) => (
                  <th
                    key={`head-${card.id}`}
                    className="border-b border-[#e3dff2] py-3 text-center text-sm font-semibold"
                  >
                    {card.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((feature) => (
                <tr key={feature.id} className="border-b border-[#f0ecff]">
                  <td className="py-4 align-top">
                    <p className="text-sm font-medium text-[#1d1b29] dark:text-[#f5f3fc]">
                      {feature.label}
                    </p>
                    {feature.description ? (
                      <p className="mt-1 text-xs text-[#5b5570] dark:text-[#c2bddb]">
                        {feature.description}
                      </p>
                    ) : null}
                  </td>
                  {planCards.map((card) => (
                    <td
                      key={`${feature.id}-${card.id}`}
                      className="py-4 text-center align-top"
                    >
                      <FeatureCell feature={feature} planId={card.id} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
