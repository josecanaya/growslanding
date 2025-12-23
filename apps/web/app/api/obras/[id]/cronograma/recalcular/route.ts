import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — No usar. Reemplazado por servicios Supabase.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint legacy. Utilizar el nuevo servicio de cronograma basado en Supabase.',
    },
    { status: 410 },
  );
}
