import { randomUUID } from "crypto";

import type { SubscriptionPlanId } from "@/lib/subscriptions/types";
import { PLAN_CARDS } from "@/lib/subscriptions/plans";

let MercadoPagoConfig: typeof import("mercadopago").MercadoPagoConfig | null =
  null;
let PreApproval: typeof import("mercadopago/resources/preapproval").default | null =
  null;
let mercadopagoPromise: Promise<typeof import("mercadopago")> | null = null;

async function loadMercadoPagoModules() {
  if (MercadoPagoConfig && PreApproval) {
    return;
  }

  if (!mercadopagoPromise) {
    mercadopagoPromise = import("mercadopago");
  }

  const mercadopago = await mercadopagoPromise;
  MercadoPagoConfig = mercadopago.MercadoPagoConfig;
  PreApproval = mercadopago.PreApproval;
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_PUBLIC_KEY);
}

export type SubscriptionCheckoutRequest = {
  planId: SubscriptionPlanId;
  payerEmail?: string | null;
  externalReference?: string;
  backUrl?: string;
};

export type SubscriptionCheckoutResponse = {
  success: boolean;
  id: string;
  initPoint: string | null;
  status: string;
  planId: SubscriptionPlanId;
  amount: number;
  currency: string;
  simulated: boolean;
  raw?: unknown;
};

export async function createSubscriptionCheckout(
  request: SubscriptionCheckoutRequest
): Promise<SubscriptionCheckoutResponse> {
  const planCard = PLAN_CARDS[request.planId];

  if (!planCard) {
    throw new Error("Plan no reconocido");
  }

  if (!isMercadoPagoConfigured()) {
    return {
      success: true,
      id: `sim-${randomUUID()}`,
      initPoint: null,
      status: "pending",
      planId: request.planId,
      amount: planCard.priceAmount,
      currency: planCard.currency,
      simulated: true,
    };
  }

  await loadMercadoPagoModules();

  if (!MercadoPagoConfig || !PreApproval) {
    throw new Error("Mercado Pago SDK no disponible");
  }

  const config = new MercadoPagoConfig!({
    accessToken: process.env.MP_ACCESS_TOKEN ?? "",
  });

  const preapprovalClient = new PreApproval!(config);

  const payload = {
    reason: planCard.summary,
    external_reference: request.externalReference ?? randomUUID(),
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: planCard.priceAmount,
      currency_id: planCard.currency,
    },
    back_url:
      request.backUrl ??
      process.env.MP_BACK_URL ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/cuenta`,
    payer_email: request.payerEmail ?? process.env.MP_FALLBACK_EMAIL ?? "",
  };

  const response = await preapprovalClient.create(payload as never);

  return {
    success: true,
    id: response.id ?? randomUUID(),
    initPoint: (response as { init_point?: string }).init_point ?? null,
    status: response.status ?? "pending",
    planId: request.planId,
    amount: planCard.priceAmount,
    currency: planCard.currency,
    simulated: false,
    raw: response,
  };
}

export async function cancelSubscriptionInMercadoPago(
  subscriptionId: string
): Promise<{ success: boolean; simulated: boolean }> {
  if (!isMercadoPagoConfigured()) {
    return { success: true, simulated: true };
  }

  await loadMercadoPagoModules();
  if (!MercadoPagoConfig || !PreApproval) {
    throw new Error("Mercado Pago SDK no disponible");
  }
  const config = new MercadoPagoConfig!({
    accessToken: process.env.MP_ACCESS_TOKEN ?? "",
  });
  const preapprovalClient = new PreApproval!(config);

  await preapprovalClient.update({
    id: subscriptionId,
    status: "cancelled",
  } as never);

  return { success: true, simulated: false };
}
