import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toDbUuidFromCanvasId, toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import { isMissingOptionalBudgetGroupSocioColumnsError } from '@/lib/canvas/budgetGroupColumnCompat';

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

type PatchBody = {
  name?: string;
  scheduledSocioId?: string | null;
  mensajeSocioBorrador?: string | null;
  status?: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> },
) {
  try {
    const { id: obraId, groupId: groupIdParam } = await params;
    let dbGroupId: string;
    try {
      dbGroupId = toDbUuidFromCanvasId(groupIdParam);
    } catch {
      return NextResponse.json({ ok: false, error: 'Grupo inválido' }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as PatchBody;

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : 'Configuración incompleta' },
        { status: 503 },
      );
    }

    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    const gate = await gateObra(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const supabaseAny = supabase as any;
    const { data: row, error: readErr } = await supabaseAny
      .from('canvas_budget_groups')
      .select('id, obra_id, name')
      .eq('id', dbGroupId)
      .eq('obra_id', obraId)
      .maybeSingle();

    if (readErr || !row) {
      return NextResponse.json({ ok: false, error: 'Grupo no encontrado' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const n = body.name.trim();
      patch.name = n || row.name || 'Grupo de presupuesto';
    }
    if ('scheduledSocioId' in body) {
      patch.scheduled_socio_id = body.scheduledSocioId ?? null;
    }
    if ('mensajeSocioBorrador' in body) {
      patch.mensaje_socio_borrador = body.mensajeSocioBorrador ?? null;
    }
    if (typeof body.status === 'string' && body.status.trim()) {
      patch.status = body.status.trim();
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true, budgetGroupId: toClientBudgetGroupId(dbGroupId) });
    }

    let upErr = (
      await supabaseAny.from('canvas_budget_groups').update(patch).eq('id', dbGroupId).eq('obra_id', obraId)
    ).error;

    if (upErr && isMissingOptionalBudgetGroupSocioColumnsError(upErr)) {
      const fallback = { ...patch };
      delete fallback.scheduled_socio_id;
      delete fallback.mensaje_socio_borrador;
      if (Object.keys(fallback).length > 0) {
        upErr = (
          await supabaseAny
            .from('canvas_budget_groups')
            .update(fallback)
            .eq('id', dbGroupId)
            .eq('obra_id', obraId)
        ).error;
      } else {
        upErr = null;
      }
    }

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, budgetGroupId: toClientBudgetGroupId(dbGroupId) });
  } catch (e) {
    console.error('[PATCH grupos-presupuesto]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
