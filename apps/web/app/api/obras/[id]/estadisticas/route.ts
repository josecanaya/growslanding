import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — Las estadísticas de obras se recalcularán con el nuevo backend Supabase.
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo módulo de reportes cuando esté disponible.',
    },
    { status: 410 },
  );
}
