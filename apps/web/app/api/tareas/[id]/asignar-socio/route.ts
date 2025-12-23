import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — La asignación de socios debe realizarse con los nuevos servicios Supabase (MVP 1.0).
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo flujo de asignación de socios.',
    },
    { status: 410 },
  );
}
