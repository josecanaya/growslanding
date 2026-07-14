import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { postularSocioABolsaPliego } from '@/lib/services/bolsa-pliego-postular.service';
import { toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';
import {
  resolveTaskNodeIdsForBudgetGroup,
  resolveTareaIdsForTaskNodes,
} from '@/lib/canvas/budgetGroupTasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Body = { obraId?: string; budgetGroupId?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const obraId = typeof body.obraId === 'string' ? body.obraId.trim() : '';
    const budgetGroupId =
      typeof body.budgetGroupId === 'string' ? body.budgetGroupId.trim() : '';

    if (!obraId || !budgetGroupId) {
      return NextResponse.json({ ok: false, error: 'Faltan obraId o budgetGroupId.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const socioRow = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });
    const socioId = socioRow?.id ?? null;
    if (!socioId) {
      return NextResponse.json({ ok: false, error: 'Perfil de socio no encontrado.' }, { status: 404 });
    }

    const result = await postularSocioABolsaPliego(supabase as any, {
      obraId,
      budgetGroupIdClient: budgetGroupId,
      socioId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      obraId: result.obraId,
      budgetGroupId: result.budgetGroupId,
      solicitudesCreadas: result.solicitudesCreadas,
      solicitudesYaExistentes: result.solicitudesYaExistentes,
    });
  } catch (e) {
    console.error('[POST bolsa-pliegos/postular]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}

/** Lista pliegos en bolsa abiertos que el socio aún no tiene en su bandeja. */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const socioRow = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });
    const socioId = socioRow?.id ?? null;
    if (!socioId) {
      return NextResponse.json({ ok: true, pliegos: [] });
    }

    const supabaseAny = supabase as any;
    const { data: groups, error } = await supabaseAny
      .from('canvas_budget_groups')
      .select('id, obra_id, name, status, bolsa_publicada, mensaje_socio_borrador')
      .eq('bolsa_publicada', true)
      .in('status', ['enviado', 'enviado_parcial']);

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('bolsa_publicada') || msg.includes('schema cache')) {
        return NextResponse.json({ ok: true, pliegos: [] });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const obraIds = [...new Set((groups ?? []).map((g: { obra_id: string }) => g.obra_id))];
    const obraMeta = new Map<string, { name: string | null; address: string | null }>();
    if (obraIds.length > 0) {
      const { data: obras } = await supabaseAny
        .from('obras')
        .select('id, name, address')
        .in('id', obraIds);
      for (const o of obras ?? []) {
        obraMeta.set(o.id, { name: o.name, address: o.address });
      }
    }

    const pliegos: Array<{
      obra_id: string;
      obra_name: string;
      budget_group_id: string;
      pliego_nombre: string;
      cantidad_tareas: number;
      ya_postulado: boolean;
    }> = [];

    for (const g of groups ?? []) {
      const obraId = (g as { obra_id: string }).obra_id;
      const dbId = (g as { id: string }).id;
      const clientBgId = toClientBudgetGroupId(dbId);

      const { taskNodeIds } = await resolveTaskNodeIdsForBudgetGroup(supabaseAny, obraId, dbId);
      const { tareaIds } = await resolveTareaIdsForTaskNodes(supabaseAny, obraId, taskNodeIds);

      let yaPostulado = false;
      if (tareaIds.length > 0) {
        const { data: mine } = await supabaseAny
          .from('tareas_presupuestos')
          .select('id')
          .eq('socio_id', socioId)
          .in('tarea_id', tareaIds.slice(0, 100))
          .limit(1);
        yaPostulado = (mine ?? []).length > 0;
      }

      const meta = obraMeta.get(obraId);
      pliegos.push({
        obra_id: obraId,
        obra_name: meta?.name?.trim() || 'Obra',
        budget_group_id: clientBgId,
        pliego_nombre: (g as { name?: string }).name?.trim() || 'Paquete de trabajo',
        cantidad_tareas: taskNodeIds.length,
        ya_postulado: yaPostulado,
      });
    }

    return NextResponse.json({ ok: true, pliegos: pliegos.filter((p) => !p.ya_postulado) });
  } catch (e) {
    console.error('[GET bolsa-pliegos]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
