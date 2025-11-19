import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/types/supabase.gen";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();
    
    const { data, error } = await supabase
      .from('obras')
      .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra, latitud, longitud, plantas, terreno, superficies')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error en GET /api/obras/[id]:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
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
    // 1) Validar sesión
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    // 2) Parsear body
    const body = await request.json();
    const { id } = await params;

    // 3) Preparar datos para actualizar en Supabase
    const updateData: any = {};

    if (body.nombre !== undefined) {
      updateData.name = body.nombre;
    }
    if (body.localizacion !== undefined) {
      updateData.address = body.localizacion || null;
    }
    if (body.propietario !== undefined) {
      updateData.propietario = body.propietario || null;
    }
    if (body.tipo_obra !== undefined) {
      updateData.tipo_obra = body.tipo_obra || null;
    }
    if (body.latitud !== undefined) {
      updateData.latitud = body.latitud || null;
    }
    if (body.longitud !== undefined) {
      updateData.longitud = body.longitud || null;
    }
    if (body.plantas !== undefined) {
      updateData.plantas = body.plantas || null;
    }
    if (body.terreno !== undefined) {
      updateData.terreno = body.terreno || null;
    }
    if (body.superficies !== undefined) {
      updateData.superficies = body.superficies || null;
    }
    if (body.estado !== undefined) {
      updateData.estado = body.estado;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 },
      );
    }

    // 4) Actualizar en Supabase
    const supabase = createServiceSupabaseClient();
    const { data: obra, error } = await supabase
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra, latitud, longitud, plantas, terreno, superficies')
      .single();

    if (error) {
      console.error("Error en PATCH /api/obras/[id]:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

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
