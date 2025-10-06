import { NextRequest, NextResponse } from "next/server";
import { ObraService } from "../../../../lib/services";
import { ActualizarObraSchema } from "../../../../lib/schemas";

const DEMO_ORG_ID = "demo-org";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const obra = await ObraService.obtenerObraPorId(id, DEMO_ORG_ID);

    return NextResponse.json({
      success: true,
      data: obra,
    });
  } catch (error) {
    console.error("Error en GET /api/obras/[id]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validatedData = ActualizarObraSchema.parse(body);
    const { id } = await params;

    const obra = await ObraService.actualizarObra(id, validatedData, DEMO_ORG_ID);

    return NextResponse.json({
      success: true,
      data: obra,
    });
  } catch (error) {
    console.error("Error en PATCH /api/obras/[id]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const obra = await ObraService.eliminarObra(id, DEMO_ORG_ID);

    return NextResponse.json({
      success: true,
      data: obra,
    });
  } catch (error) {
    console.error("Error en DELETE /api/obras/[id]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    );
  }
}
