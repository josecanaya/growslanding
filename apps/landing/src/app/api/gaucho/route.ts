import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, session_id } = await req.json();

    const WEBHOOK_URL =
      process.env.N8N_GAUCHO_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    console.log("Fierro webhook URL:", WEBHOOK_URL);

    if (!WEBHOOK_URL) {
      return NextResponse.json(
        {
          message: "Webhook de Fierro no configurado.",
          buttons: [],
        },
        { status: 500 }
      );
    }

    const payload = {
      sessionId: session_id || `landing-${Date.now()}`,
      action: "sendMessage",
      chatInput: typeof message === "string" ? message : JSON.stringify(message ?? ""),
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fierro webhook error:", response.status, errorText);
      throw new Error(`Webhook respondió ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/gaucho:", error);
    return NextResponse.json(
      { message: "Error al conectar con Fierro.", buttons: [] },
      { status: 500 }
    );
  }
}

