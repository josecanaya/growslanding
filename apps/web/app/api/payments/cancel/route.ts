import { NextRequest, NextResponse } from "next/server";

import { cancelSubscriptionInMercadoPago } from "@/lib/payments/mercadopago";

type CancelBody = {
  subscriptionId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CancelBody;
    if (!body.subscriptionId) {
      return NextResponse.json(
        {
          success: false,
          error: "subscriptionId es requerido",
        },
        { status: 400 }
      );
    }

    const result = await cancelSubscriptionInMercadoPago(
      body.subscriptionId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[payments.cancel]", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar la suscripcion",
      },
      { status: 500 }
    );
  }
}

