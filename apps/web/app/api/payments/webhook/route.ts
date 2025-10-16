import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    console.info("[payments.webhook] evento recibido", event);
  } catch (error) {
    console.error("[payments.webhook] no se pudo leer el evento", error);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get("challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

