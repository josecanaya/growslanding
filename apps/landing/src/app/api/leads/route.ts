import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const LeadSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parse = LeadSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { email, token } = parse.data;

    // Verify Cloudflare Turnstile token
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const bypass =
      process.env.TURNSTILE_BYPASS === "true" ||
      process.env.NODE_ENV !== "production";
    if (!secret && !bypass) {
      return NextResponse.json(
        { error: "Turnstile not configured" },
        { status: 500 }
      );
    }
    if (secret) {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ secret, response: token }),
        }
      );
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return NextResponse.json(
          { error: "Turnstile verification failed" },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("leads").insert({ email });
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

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
