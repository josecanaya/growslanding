import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { persistedToSupabaseRows, supabaseRowsToPersisted } from '@/lib/canvas/canvasSupabaseMapper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function assertObraInOrgs(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  allowedOrgIds: string[],
): Promise<{ ok: true; org_id: string } | { ok: false; status: number; message: string }> {
  if (allowedOrgIds.length === 0) {
    return { ok: false, status: 403, message: 'Sin organización accesible' };
  }
  const { data: obra, error } = await (supabase as unknown as any)
    .from('obras')
    .select('id, org_id, name, canvas_project_kind, canvas_ui')
    .eq('id', obraId)
    .maybeSingle();

  if (error || !obra) {
    return { ok: false, status: 404, message: 'Obra no encontrada' };
  }
  const orgId = obra.org_id as string;
  if (!allowedOrgIds.includes(orgId)) {
    return { ok: false, status: 403, message: 'No autorizado para esta obra' };
  }
  return { ok: true, org_id: orgId };
}

/**
 * GET /api/obras/[id]/canvas — canvas multinivel (nodos, aristas, checklist, grupos).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: 'Configuración servidor incompleta',
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 503 },
      );
    }

    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    const gate = await assertObraInOrgs(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ success: false, message: gate.message }, { status: gate.status });
    }

    const supabaseAny = supabase as any;

    const [obraFull, nodesRes, edgesRes, groupsRes, checklistRes] = await Promise.all([
      supabaseAny
        .from('obras')
        .select('id, name, canvas_project_kind, canvas_ui')
        .eq('id', obraId)
        .single(),
      supabaseAny.from('canvas_nodes').select('*').eq('obra_id', obraId),
      supabaseAny.from('canvas_edges').select('*').eq('obra_id', obraId),
      supabaseAny.from('canvas_budget_groups').select('*').eq('obra_id', obraId),
      supabaseAny.from('canvas_task_checklist_items').select('*').eq('obra_id', obraId),
    ]);

    if (obraFull.error) {
      return NextResponse.json(
        { success: false, message: obraFull.error.message },
        { status: 500 },
      );
    }

    const obra = obraFull.data as {
      id: string;
      name: string;
      canvas_project_kind: string | null;
      canvas_ui: unknown;
    };

    const persisted = supabaseRowsToPersisted({
      obra,
      budgetGroups: (groupsRes.data ?? []) as any[],
      nodes: (nodesRes.data ?? []) as any[],
      edges: (edgesRes.data ?? []) as any[],
      checklistItems: (checklistRes.data ?? []) as any[],
    });

    return NextResponse.json({
      success: true,
      data: {
        ...persisted,
        obra: {
          id: obra.id,
          name: obra.name,
          canvas_project_kind: obra.canvas_project_kind,
          canvas_ui: obra.canvas_ui,
        },
      },
    });
  } catch (e) {
    console.error('[GET /api/obras/[id]/canvas]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}

type PutBody = {
  obraNombre?: string;
  projectKind?: string;
  pathIds?: string[];
  nodes?: unknown[];
  edges?: unknown[];
  budgetGroups?: unknown[];
};

/**
 * PUT /api/obras/[id]/canvas — reemplazo completo del snapshot del lienzo.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const body = (await req.json()) as PutBody;
    const snapshot = composeCanvasPersisted({
      obraNombre: typeof body.obraNombre === 'string' ? body.obraNombre : 'Obra',
      nodes: Array.isArray(body.nodes) ? (body.nodes as any) : [],
      pathIds: Array.isArray(body.pathIds) ? body.pathIds : [],
      edges: Array.isArray(body.edges) ? (body.edges as any) : [],
      budgetGroups: Array.isArray(body.budgetGroups) ? (body.budgetGroups as any) : [],
      projectKind: typeof body.projectKind === 'string' ? body.projectKind : 'edificio_multifamiliar',
    });

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: 'Configuración servidor incompleta',
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 503 },
      );
    }

    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    const gate = await assertObraInOrgs(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ success: false, message: gate.message }, { status: gate.status });
    }

    const orgId = gate.org_id;
    const supabaseAny = supabase as any;

    let rows;
    try {
      rows = persistedToSupabaseRows(obraId, orgId, snapshot);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: e instanceof Error ? e.message : 'Payload inválido' },
        { status: 400 },
      );
    }

    const { error: delNodesErr } = await supabaseAny.from('canvas_nodes').delete().eq('obra_id', obraId);
    if (delNodesErr) {
      console.error('[PUT canvas] delete nodes', delNodesErr);
      return NextResponse.json({ success: false, message: delNodesErr.message }, { status: 500 });
    }

    const { error: delGroupsErr } = await supabaseAny
      .from('canvas_budget_groups')
      .delete()
      .eq('obra_id', obraId);
    if (delGroupsErr) {
      console.error('[PUT canvas] delete groups', delGroupsErr);
      return NextResponse.json({ success: false, message: delGroupsErr.message }, { status: 500 });
    }

    if (rows.budgetGroups.length > 0) {
      const { error: insBg } = await supabaseAny.from('canvas_budget_groups').insert(rows.budgetGroups);
      if (insBg) {
        console.error('[PUT canvas] insert groups', insBg);
        return NextResponse.json({ success: false, message: insBg.message }, { status: 500 });
      }
    }

    if (rows.nodes.length > 0) {
      const { error: insN } = await supabaseAny.from('canvas_nodes').insert(rows.nodes);
      if (insN) {
        console.error('[PUT canvas] insert nodes', insN);
        return NextResponse.json({ success: false, message: insN.message }, { status: 500 });
      }
    }

    if (rows.edges.length > 0) {
      const edgeRows = rows.edges.map((e) => ({
        id: e.id,
        obra_id: obraId,
        org_id: orgId,
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        type: e.type,
        is_critical: e.is_critical,
        lag_days: e.lag_days,
        metadata: {},
      }));
      const { error: insE } = await supabaseAny.from('canvas_edges').insert(edgeRows);
      if (insE) {
        console.error('[PUT canvas] insert edges', insE);
        return NextResponse.json({ success: false, message: insE.message }, { status: 500 });
      }
    }

    if (rows.checklistItems.length > 0) {
      const chkRows = rows.checklistItems.map((c) => ({
        id: c.id,
        obra_id: obraId,
        org_id: orgId,
        task_node_id: c.task_node_id,
        title: c.title,
        done: c.done,
        sort_order: c.sort_order,
      }));
      const { error: insC } = await supabaseAny.from('canvas_task_checklist_items').insert(chkRows);
      if (insC) {
        console.error('[PUT canvas] insert checklist', insC);
        return NextResponse.json({ success: false, message: insC.message }, { status: 500 });
      }
    }

    if (rows.budgetGroupTasks.length > 0) {
      const bgtRows = rows.budgetGroupTasks.map((r) => ({
        obra_id: obraId,
        org_id: orgId,
        budget_group_id: r.budget_group_id,
        task_node_id: r.task_node_id,
      }));
      const { error: insBgt } = await supabaseAny.from('canvas_budget_group_tasks').insert(bgtRows);
      if (insBgt) {
        console.error('[PUT canvas] insert budget_group_tasks', insBgt);
        return NextResponse.json({ success: false, message: insBgt.message }, { status: 500 });
      }
    }

    const { error: upObraErr } = await supabaseAny
      .from('obras')
      .update(rows.obrasPatch as any)
      .eq('id', obraId)
      .eq('org_id', orgId);
    if (upObraErr) {
      console.error('[PUT canvas] update obra', upObraErr);
      return NextResponse.json({ success: false, message: upObraErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Canvas guardado',
      data: { nodeCount: rows.nodes.length, edgeCount: rows.edges.length },
    });
  } catch (e) {
    console.error('[PUT /api/obras/[id]/canvas]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
