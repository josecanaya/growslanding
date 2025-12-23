import { randomUUID } from "crypto";

import type { SubscriptionPlanId } from "@/lib/subscriptions/types";
import { PLAN_CARDS } from "@/lib/subscriptions/plans";

let MercadoPagoConfig: typeof import("mercadopago").MercadoPagoConfig | null =
  null;
let PreApproval: any = null;
let Preference: any = null;
let Payment: any = null;
let mercadopagoPromise: Promise<typeof import("mercadopago")> | null = null;

async function loadMercadoPagoModules() {
  if (MercadoPagoConfig && PreApproval && Preference && Payment) {
    return;
  }

  if (!mercadopagoPromise) {
    mercadopagoPromise = import("mercadopago");
  }

  const mercadopago = await mercadopagoPromise;
  MercadoPagoConfig = mercadopago.MercadoPagoConfig;
  PreApproval = mercadopago.PreApproval;
  Preference = mercadopago.Preference;
  Payment = mercadopago.Payment;
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

// ===========================================
// FUNCIONES PARA ESCROW DE TAREAS
// ===========================================

export type TaskEscrowPreferenceInput = {
  tareaId: string;
  socioId: string;
  orgId: string;
  clienteId?: string;
  montoTotal: number;
  moneda: string;
  descripcion: string;
};

export type TaskEscrowPreferenceOutput = {
  preferenceId: string;
  checkoutUrl: string;
  sandboxCheckoutUrl?: string;
  raw?: any;
};

/**
 * Crea una preferencia de pago única para una tarea (escrow)
 * Usa Preference de MercadoPago (no PreApproval, que es para suscripciones)
 */
export async function createTaskEscrowPreference(
  input: TaskEscrowPreferenceInput
): Promise<TaskEscrowPreferenceOutput> {
  if (!isMercadoPagoConfigured()) {
    // Modo simulado para desarrollo
    return {
      preferenceId: `sim-pref-${randomUUID()}`,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pago-simulado`,
    };
  }

  await loadMercadoPagoModules();

  if (!MercadoPagoConfig || !Preference) {
    throw new Error("Mercado Pago SDK no disponible");
  }

  const config = new MercadoPagoConfig!({
    accessToken: process.env.MP_ACCESS_TOKEN ?? "",
  });

  const preferenceClient = new Preference!(config);

  // Construir URL de retorno
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const backUrl = `${baseUrl}/cliente/tareas?escrow_success=true`;
  const webhookUrl = `${baseUrl}/api/payments/webhook`;

  const payload = {
    items: [
      {
        title: input.descripcion,
        quantity: 1,
        unit_price: input.montoTotal,
        currency_id: input.moneda,
      },
    ],
    external_reference: `tarea-${input.tareaId}`,
    metadata: {
      tipo: 'tarea',
      tareaId: input.tareaId,
      socioId: input.socioId,
      orgId: input.orgId,
      clienteId: input.clienteId || null,
    },
    back_urls: {
      success: backUrl,
      failure: `${baseUrl}/cliente/tareas?escrow_error=true`,
      pending: `${baseUrl}/cliente/tareas?escrow_pending=true`,
    },
    auto_return: 'approved',
    notification_url: webhookUrl,
    statement_descriptor: 'GROWS Tarea',
  };

  const response = await preferenceClient.create(payload as never);

  const initPoint = (response as any).init_point || null;
  const sandboxInitPoint = (response as any).sandbox_init_point || null;
  const preferenceId = (response as any).id || randomUUID();

  return {
    preferenceId: String(preferenceId),
    checkoutUrl: initPoint || sandboxInitPoint || '',
    sandboxCheckoutUrl: sandboxInitPoint || undefined,
    raw: response,
  };
}

/**
 * Obtiene información de un pago de MercadoPago
 * Útil para verificar estados desde el webhook
 */
export async function getPaymentInfo(
  paymentId: string
): Promise<{ status: string; raw?: any } | null> {
  if (!isMercadoPagoConfigured()) {
    return { status: 'approved', raw: { simulated: true } };
  }

  await loadMercadoPagoModules();

  if (!MercadoPagoConfig || !Payment) {
    throw new Error("Mercado Pago SDK no disponible");
  }

  const config = new MercadoPagoConfig!({
    accessToken: process.env.MP_ACCESS_TOKEN ?? "",
  });

  const paymentClient = new Payment!(config);

  try {
    const payment = await paymentClient.get({ id: paymentId } as never);
    const status = (payment as any).status || 'unknown';
    return {
      status: String(status),
      raw: payment,
    };
  } catch (error) {
    console.error('[MP] Error obteniendo información de pago:', error);
    return null;
  }
}
