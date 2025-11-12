import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, session_id } = await req.json();

    const WEBHOOK_URL =
      process.env.N8N_GAUCHO_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    console.log("GAUCHO WEBHOOK URL:", WEBHOOK_URL);

    if (!WEBHOOK_URL) {
      return NextResponse.json({
        message: "Webhook de GAUCHO no configurado.",
        buttons: [],
      });
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "grows-landing",
        sentAt: new Date().toISOString(),
        message,
        user_message: message,
        session_id: session_id || "landing-session",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GAUCHO webhook error:", response.status, errorText);
      throw new Error(`Webhook responded ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error en /api/gaucho:", error);
    return NextResponse.json(
      { message: "Error al conectar con GAUCHO.", buttons: [] },
      { status: 500 }
    );
  }
}

