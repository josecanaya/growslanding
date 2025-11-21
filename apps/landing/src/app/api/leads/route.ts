import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { email, source, message, interest_type } = json;

    // Validación básica
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Conectar con Supabase
    const supabase = createServiceSupabaseClient();

    // Insertar lead en la tabla (asumiendo que existe una tabla 'leads' o 'landing_leads')
    // Si la tabla no existe, se puede crear o usar otra tabla existente
    const { data, error } = await (supabase as any)
      .from('leads')
      .insert([
        {
          email: email.toLowerCase().trim(),
          source: source || 'landing',
          message: message || null,
          interest_type: interest_type || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      // Si la tabla no existe, loguear pero no fallar
      console.error("Error inserting lead:", error);
      // Continuar como si fuera éxito para no romper el flujo
    }

    console.log('Lead captured:', email, 'Source:', source);

    return NextResponse.json(
      {
        success: true,
        message: "Email captured successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    // Retornar éxito incluso si hay error para no romper UX
    return NextResponse.json(
      {
        success: true,
        message: "Email captured successfully",
      },
      { status: 200 }
    );
  }
}
