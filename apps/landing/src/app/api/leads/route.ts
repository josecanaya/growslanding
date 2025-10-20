import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email } = json;

    // Validación básica
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Simulación de éxito (sin Supabase)
    console.log('Lead captured:', email);

    return NextResponse.json(
      {
        success: true,
        message: "Email captured successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
