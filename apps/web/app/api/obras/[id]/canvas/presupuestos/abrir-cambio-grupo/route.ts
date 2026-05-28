import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';

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
  changeNotes?: string;
};

/**
 * Abre ventana de cambio post-aprobación (paso 1: cliente).
 * Requiere doble verificación: luego el socio debe confirmar antes de re-enviar el paquete.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const body = (await req.json().catch(() => ({}))) as Body;
    const budgetGroupIdRaw = typeof body.budgetGroupId === 'string' ? body.budgetGroupId.trim() : '';
    const changeNotes = typeof body.changeNotes === 'string' ? body.changeNotes.trim() : '';

    if (!budgetGroupIdRaw) {
      return NextResponse.json({ ok: false, error: 'Falta budgetGroupId.' }, { status: 400 });
    }
    if (!changeNotes) {
      return NextResponse.json(
        { ok: false, error: 'Describí qué querés cambiar del paquete aprobado.' },
        { status: 400 },
      );
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

    const supabaseAny = supabase as any;
    const { data: groupRow, error: gErr } = await supabaseAny
      .from('canvas_budget_groups')
      .select('id, status, change_window_status, scheduled_socio_id')
      .eq('id', dbGroupId)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (gErr || !groupRow) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    const status = String(groupRow.status ?? '').toLowerCase();
    if (status !== 'aprobado' && status !== 'aprobado_parcial') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Solo podés solicitar cambios en paquetes ya aprobados.',
          errorCode: 'PAQUETE_NO_APROBADO',
        },
        { status: 409 },
      );
    }

    const cw = String(groupRow.change_window_status ?? 'cerrada').toLowerCase();
    if (cw === 'abierta_cliente') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Ya hay una solicitud de cambio abierta para este paquete.',
          errorCode: 'CAMBIO_YA_ABIERTO',
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const { error: upErr } = await supabaseAny
      .from('canvas_budget_groups')
      .update({
        change_window_status: 'abierta_cliente',
        change_window_opened_at: now,
        change_window_notes: changeNotes,
      })
      .eq('id', dbGroupId)
      .eq('obra_id', obraId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    const socioId = groupRow.scheduled_socio_id as string | null;
    if (socioId) {
      await supabaseAny.from('notificaciones').insert({
        org_id: gate.org_id,
        obra_id: obraId,
        tarea_id: null,
        remitente_id: user.id,
        destinatario_id: socioId,
        socio_id: socioId,
        tipo: 'paquete_cambio_solicitado',
        titulo: 'Cambio solicitado en paquete aprobado',
        mensaje: changeNotes,
        leida: false,
        created_at: now,
      });
    }

    return NextResponse.json({
      ok: true,
      budgetGroupId: toClientBudgetGroupId(dbGroupId),
      changeWindowStatus: 'abierta_cliente',
    });
  } catch (e) {
    console.error('[POST abrir-cambio-grupo]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
