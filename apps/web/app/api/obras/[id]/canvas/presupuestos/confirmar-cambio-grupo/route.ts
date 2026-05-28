import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import { PermisoService } from '@/lib/services/permiso.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function gateObra(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  allowedOrgIds: string[],
): Promise<{ ok: true; org_id: string } | { ok: false; status: number; message: string }> {
  if (allowedOrgIds.length === 0) {
    return { ok: false, status: 403, message: 'Sin organización accesible' };
  }
  const { data: obra, error } = await (supabase as any)
    .from('obras')
    .select('id, org_id')
    .eq('id', obraId)
    .maybeSingle();
  if (error || !obra) {
    return { ok: false, status: 404, message: 'Obra no encontrada' };
  }
  const org_id = obra.org_id as string;
  if (!allowedOrgIds.includes(org_id)) {
    return { ok: false, status: 403, message: 'No autorizado para esta obra' };
  }
  return { ok: true, org_id };
}

type Body = {
  budgetGroupId?: string;
};

/**
 * Paso 2 de doble verificación: el socio confirma que acepta revisar el cambio solicitado.
 * Tras confirmar, el cliente puede re-enviar el paquete con las modificaciones.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const budgetGroupIdRaw = typeof body.budgetGroupId === 'string' ? body.budgetGroupId.trim() : '';

    if (!budgetGroupIdRaw) {
      return NextResponse.json({ ok: false, error: 'Falta budgetGroupId.' }, { status: 400 });
    }

    let dbGroupId: string;
    try {
      dbGroupId = toDbUuidFromCanvasId(budgetGroupIdRaw);
    } catch {
      return NextResponse.json({ ok: false, error: 'Grupo inválido' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    const gate = await gateObra(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const socioId = await PermisoService.obtenerSocioIdPorUsuario(user.id, gate.org_id);
    if (!socioId) {
      return NextResponse.json({ ok: false, error: 'Solo socios pueden confirmar cambios.' }, { status: 403 });
    }

    const supabaseAny = supabase as any;
    const { data: groupRow, error: gErr } = await supabaseAny
      .from('canvas_budget_groups')
      .select('id, scheduled_socio_id, change_window_status')
      .eq('id', dbGroupId)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (gErr || !groupRow) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    if (groupRow.scheduled_socio_id && groupRow.scheduled_socio_id !== socioId) {
      return NextResponse.json(
        { ok: false, error: 'Este paquete no está asignado a tu perfil de socio.' },
        { status: 403 },
      );
    }

    const cw = String(groupRow.change_window_status ?? 'cerrada').toLowerCase();
    if (cw !== 'abierta_cliente') {
      return NextResponse.json(
        {
          ok: false,
          error: 'No hay una solicitud de cambio pendiente de confirmación.',
          errorCode: 'CAMBIO_NO_PENDIENTE',
        },
        { status: 409 },
      );
    }

    const { error: upErr } = await supabaseAny
      .from('canvas_budget_groups')
      .update({ change_window_status: 'confirmada_socio' })
      .eq('id', dbGroupId)
      .eq('obra_id', obraId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      budgetGroupId: toClientBudgetGroupId(dbGroupId),
      changeWindowStatus: 'confirmada_socio',
    });
  } catch (e) {
    console.error('[POST confirmar-cambio-grupo]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
