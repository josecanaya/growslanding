import { NextRequest, NextResponse } from "next/server";

const MOCK_USAGE: Record<string, number> = {
  obras: 2,
  tareas: 3,
  cuadrillas: 1,
  notificaciones: 0,
  calendario: 0,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  const key = params.key.toLowerCase();
  if (!(key in MOCK_USAGE)) {
    return NextResponse.json(
      { success: false, error: "Uso no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    count: MOCK_USAGE[key],
  });
}
