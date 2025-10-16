"use client";

import { useMemo } from "react";
import { Eye, Play } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDevMode } from "@/lib/dev-mode-context";
import {
  useCurrentPlan,
  usePlanCard,
  usePlanCards,
  type SubscriptionPlanId,
} from "@/lib/subscriptions";
import { useUpgradeModal } from "@/components/subscriptions/UpgradeModal";

export default function DeveloperModePanel() {
  const { devModeEnabled, setDevModeEnabled } = useDevMode();
  const subscription = useCurrentPlan();
  const planCards = usePlanCards();
  const upgradeModal = useUpgradeModal();

  const currentSimulatedCard = usePlanCard(subscription.effectivePlanId);

  const planOptions = useMemo(() => {
    return planCards.map((card) => ({
      id: card.id,
      name: card.shortName,
      highlight: card.highlight ?? card.summary,
    }));
  }, [planCards]);

  const handleOverride = (planId: SubscriptionPlanId) => {
    subscription.setOverridePlan(planId);
  };

  const handlePreviewModal = (planId: SubscriptionPlanId) => {
    upgradeModal.open({
      targetPlanId: planId,
      reason: "Vista previa del modal de upgrade en modo desarrollador.",
      source: "developer-mode",
    });
  };

  return (
    <Card className="bg-[#110f1f] text-white border border-[#2a263a] rounded-3xl px-8 py-10 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Modo desarrollador</h3>
          <p className="mt-2 text-sm text-white/70">
            Visualizá todos los niveles de suscripción, verificá límites y
            probá modales sin realizar compras reales.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          Estado:
          <Switch
            checked={devModeEnabled}
            onCheckedChange={(value) => setDevModeEnabled(value)}
          />
          <span>{devModeEnabled ? "Activo" : "Inactivo"}</span>
        </label>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {planOptions.map((plan) => {
          const isActive = subscription.effectivePlanId === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 backdrop-blur transition hover:border-[#6d4be8]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/60">
                    Plan
                  </p>
                  <h4 className="mt-1 text-xl font-semibold">{plan.name}</h4>
                </div>
                {isActive ? <Badge variant="secondary">Activo</Badge> : null}
              </div>
              <p className="mt-3 text-sm text-white/70">{plan.highlight}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handleOverride(plan.id)}
                  disabled={!devModeEnabled}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Simular plan
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handlePreviewModal(plan.id)}
                  disabled={!devModeEnabled}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver modal de upgrade
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur">
        <p className="text-sm font-semibold text-white">
          Plan simulado actual: {currentSimulatedCard.name}
        </p>
        <p className="mt-1 text-xs text-white/70">
          Las validaciones visuales y límites en la UI reflejarán este plan.
          Para volver al plan real, restablecé desde el panel o desactivá el
          modo desarrollador.
        </p>
      </div>
    </Card>
  );
}
