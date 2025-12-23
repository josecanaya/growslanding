import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — Este endpoint dependía de servicios Prisma legacy. Usar los nuevos flujos de presupuestos.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo flujo de presupuestos integrado al esquema Supabase.',
    },
    { status: 410 },
  );
}
