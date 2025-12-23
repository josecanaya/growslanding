import { NextResponse } from 'next/server';

// 🚫 DEPRECATED — No usar. Reemplazado por /api/tareas/[id]/transition (FSM oficial).
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint legacy. Utilizar /api/tareas/[id]/transition con la nueva FSM.',
    },
    { status: 410 },
  );
}
