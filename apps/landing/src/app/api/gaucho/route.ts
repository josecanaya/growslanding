import { NextResponse } from "next/server";

/**
 * Proxy entre el chat de la landing y el agente GAUCHO en n8n.
 * Recibe { message, session_id } y reenvía al webhook de n8n.
 */
export async function POST(req: Request) {
  try {
    const { message, session_id } = await req.json();

    // Reemplazá esta URL con tu webhook público de n8n:
    const N8N_WEBHOOK = "https://josecanaya.app.n8n.cloud/workflow/KCBgyLOVz4GmHZ6A";

    const response = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_message: message,
        session_id: session_id || "landing-session",
      }),
    });

    const data = await response.json();

    const result = {
      message:
        data?.message ||
        data?.display_message ||
        data?.response ||
        "No se recibió respuesta de GAUCHO.",
      buttons: data?.buttons || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en /api/gaucho:", error);
    return NextResponse.json(
      { message: "Error al conectar con GAUCHO.", buttons: [] },
      { status: 500 }
    );
  }
}

