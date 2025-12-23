import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — La gestión de evidencias ahora se realiza desde servicios Supabase. Endpoint removido.
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Consulta evidencias desde los nuevos servicios/tabs.',
    },
    { status: 410 },
  );
}

// 🚫 DEPRECATED — La gestión de evidencias ahora se realiza desde servicios Supabase. Endpoint removido.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint deprecated. Usa el nuevo flujo de evidencias del MVP.',
    },
    { status: 410 },
  );
}
