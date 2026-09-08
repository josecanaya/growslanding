import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/types/supabase.gen";
import { listAccessibleOrgIds } from "@/lib/orgs";

/**
 * Sesion + organizaciones accesibles. Todas las rutas de esta carpeta usan
 * `service_role` (bypassea RLS), asi que el filtro por org es la unica defensa.
 */
async function gateObraPorOrg(obraId: string): Promise<
  | { ok: true; userId: string; orgId: string; supabase: ReturnType<typeof createServiceSupabaseClient> }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 }),
    };
  }

  const supabase = createServiceSupabaseClient();
  const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
  if (allowedOrgIds.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Sin organizacion accesible' }, { status: 403 }),
    };
  }

  const { data: obra } = await (supabase as any)
    .from('obras')
    .select('id, org_id')
    .eq('id', obraId)
    .maybeSingle();

  if (!obra) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Obra no encontrada' }, { status: 404 }),
    };
  }
  if (!allowedOrgIds.includes(obra.org_id as string)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'No autorizado para esta obra' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, orgId: obra.org_id as string, supabase };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gate = await gateObraPorOrg(id);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.supabase
      .from('obras')
      .select('id, org_id, name, address, estado, created_at, propietario, tipo_obra, latitud, longitud, plantas, terreno, superficies')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error en GET /api/obras/[id]:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 },
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
    // 1) Validar sesión + pertenencia de la obra a una org accesible
    const { id } = await params;
    const gate = await gateObraPorOrg(id);
    if (!gate.ok) return gate.response;

    // 2) Parsear body
    const body = await request.json();

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
    const { data: obra, error } = await gate.supabase
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
    // 1-2) Validar sesión + pertenencia de la obra a una org accesible
    const { id } = await params;
    const gate = await gateObraPorOrg(id);
    if (!gate.ok) return gate.response;

    // 3) Eliminar obra
    const { error: deleteError } = await gate.supabase
      .from('obras')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Error en DELETE /api/obras/[id]:", deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Error en DELETE /api/obras/[id]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    );
  }
}
