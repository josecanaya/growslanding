import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — Este endpoint dependía de Prisma. Los presupuestos deben gestionarse con los servicios Supabase del MVP.
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo flujo de presupuestos.',
    },
    { status: 410 },
  );
}

// 🚫 DEPRECATED — Este endpoint dependía de Prisma. Los presupuestos deben gestionarse con los servicios Supabase del MVP.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo flujo de presupuestos.',
    },
    { status: 410 },
  );
}
