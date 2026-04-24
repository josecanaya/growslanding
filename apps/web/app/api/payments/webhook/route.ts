import { NextRequest, NextResponse } from "next/server";
import { EscrowService } from "@/lib/services/escrow.service";

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.MP_WEBHOOK_SECRET ?? '';
  if (configuredSecret) {
    const incomingSecret =
      request.headers.get('x-webhook-secret') ??
      request.headers.get('x-mp-webhook-secret') ??
      '';
    if (incomingSecret !== configuredSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }
  }

  try {
    const event = await request.json();
    console.info("[payments.webhook] evento recibido", {
      type: event.type,
      action: event.action,
      id: event.data?.id,
    });

    // MercadoPago envía diferentes tipos de eventos
    // Tipo: "payment" para pagos únicos (tareas/escrow)
    // Tipo: "preapproval" para suscripciones

    if (event.type === "payment") {
      // Es un pago de tarea (escrow)
      await handleTaskPaymentWebhook(event);
    } else if (event.type === "preapproval") {
      // Es una suscripción - mantener lógica existente
      console.info("[payments.webhook] Evento de suscripción recibido", event);
      // TODO: Implementar manejo de suscripciones si es necesario
    } else {
      console.warn("[payments.webhook] Tipo de evento no reconocido:", event.type);
    }
  } catch (error) {
    console.error("[payments.webhook] Error procesando evento:", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Maneja webhooks de pagos de tareas (escrow)
 */
async function handleTaskPaymentWebhook(event: any) {
  try {
    const paymentId = event.data?.id;
    const action = event.action; // "payment.created", "payment.updated", etc.

    if (!paymentId) {
      console.warn("[payments.webhook] No hay payment_id en el evento");
      return;
    }

    console.info("[payments.webhook] Procesando pago de tarea:", {
      paymentId,
      action,
    });

    // Obtener información del pago desde MercadoPago
    const { getPaymentInfo } = await import("@/lib/payments/mercadopago");
    const paymentInfo = await getPaymentInfo(String(paymentId));

    if (!paymentInfo) {
      console.warn("[payments.webhook] No se pudo obtener información del pago:", paymentId);
      return;
    }

    // Obtener metadata de la preferencia para identificar si es una tarea
    const rawPayment = paymentInfo.raw as any;
    const metadata = rawPayment?.metadata || rawPayment?.preference_id ? await getPreferenceMetadata(rawPayment.preference_id) : null;

    // Verificar si es un pago de tarea basado en metadata o external_reference
    const externalRef = rawPayment?.external_reference || "";
    const isTaskPayment = metadata?.tipo === "tarea" || externalRef.startsWith("tarea-");

    if (!isTaskPayment) {
      console.info("[payments.webhook] Pago no es de tipo tarea, ignorando");
      return;
    }

    // Extraer tareaId desde metadata o external_reference
    const tareaId = metadata?.tareaId || externalRef.replace("tarea-", "");

    if (!tareaId) {
      console.warn("[payments.webhook] No se pudo determinar tareaId del pago");
      return;
    }

    // Si el pago está aprobado, marcar como retenido en escrow
    if (paymentInfo.status === "approved" && action === "payment.updated") {
      console.info("[payments.webhook] Pago aprobado, marcando escrow como retenido");

      await EscrowService.marcarPagoAprobadoDesdeWebhook({
        paymentId: String(paymentId),
        preferenceId: rawPayment?.preference_id,
        status: paymentInfo.status,
        rawPayload: rawPayment,
      });
    }
  } catch (error) {
    console.error("[payments.webhook] Error manejando pago de tarea:", error);
  }
}

/**
 * Obtiene metadata de una preferencia de MercadoPago
 */
async function getPreferenceMetadata(preferenceId: string): Promise<any> {
  try {
    // En producción, aquí deberías obtener la preferencia desde MP o desde nuestra BD
    // Por ahora, intentamos obtenerla desde escrow_transacciones
    const { createServiceSupabaseClient } = await import("@/lib/supabase-server");
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data } = await supabaseAny
      .from("escrow_transacciones")
      .select("metadata")
      .eq("mp_preference_id", preferenceId)
      .maybeSingle();

    return data?.metadata || null;
  } catch (error) {
    console.error("[payments.webhook] Error obteniendo metadata:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

