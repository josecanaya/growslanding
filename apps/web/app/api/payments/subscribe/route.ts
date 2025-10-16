import { NextRequest, NextResponse } from "next/server";

import type { SubscriptionPlanId } from "@/lib/subscriptions/types";
import { createSubscriptionCheckout } from "@/lib/payments/mercadopago";

type SubscribeBody = {
  planId?: SubscriptionPlanId;
  payerEmail?: string | null;
  externalReference?: string;
  backUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const planId = body.planId;

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: "planId es requerido",
        },
        { status: 400 }
      );
    }

    const checkout = await createSubscriptionCheckout({
      planId,
      payerEmail: body.payerEmail ?? null,
      externalReference: body.externalReference,
      backUrl: body.backUrl,
    });

    return NextResponse.json({
      success: true,
      data: checkout,
    });
  } catch (error) {
    console.error("[payments.subscribe]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la suscripcion",
      },
      { status: 500 }
    );
  }
}

