import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { supabaseRowsToPersisted } from '@/lib/canvas/canvasSupabaseMapper';
import { buildGrafoSnapshot, type GrafoSnapshot } from '@/lib/proyecto-vivo/buildGrafoSnapshot';
import type { CanvasMultinivelPersisted, ObraGraphMode } from '@/lib/types/canvasMultinivel';

type ObraGrafoRow = {
  id: string;
  org_id: string;
  name: string;
  canvas_project_kind: string | null;
  canvas_ui: unknown;
  graph_mode?: string | null;
  objetivo_texto?: string | null;
};

async function authAndLoadObra(obraId: string): Promise<
  | { ok: true; userId: string; obra: ObraGrafoRow; supabase: ReturnType<typeof createServiceSupabaseClient> }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 }),
    };
  }

  const supabase = createServiceSupabaseClient();
  const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
  if (allowedOrgIds.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'Sin organización accesible' },
        { status: 403 },
      ),
    };
  }

  const { data: obra, error } = await (supabase as unknown as { from: (t: string) => any })
    .from('obras')
    .select('id, org_id, name, canvas_project_kind, canvas_ui, graph_mode, objetivo_texto')
    .eq('id', obraId)
    .maybeSingle();
  if (error || !obra) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'Obra no encontrada' }, { status: 404 }),
    };
  }
  if (!allowedOrgIds.includes(obra.org_id as string)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, message: 'No autorizado' }, { status: 403 }),
    };
  }
  return { ok: true, userId: user.id, obra: obra as ObraGrafoRow, supabase };
}

async function loadPersisted(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obra: ObraGrafoRow,
) {
  const supabaseAny = supabase as any;
  const obraId = obra.id;
  const [nodesRes, edgesRes, groupsRes, checklistRes, tareasRes] = await Promise.all([
    supabaseAny.from('canvas_nodes').select('*').eq('obra_id', obraId),
    supabaseAny.from('canvas_edges').select('*').eq('obra_id', obraId),
    supabaseAny.from('canvas_budget_groups').select('*').eq('obra_id', obraId),
    supabaseAny.from('canvas_task_checklist_items').select('*').eq('obra_id', obraId),
    supabaseAny.from('tareas').select('id, canvas_node_id, estado').eq('obra_id', obraId),
  ]);

  const persisted = supabaseRowsToPersisted({
    obra,
    budgetGroups: (groupsRes.data ?? []) as any[],
    nodes: (nodesRes.data ?? []) as any[],
    edges: (edgesRes.data ?? []) as any[],
    checklistItems: (checklistRes.data ?? []) as any[],
  });

  const graphMode: ObraGraphMode =
    obra.graph_mode === 'proyecto_vivo' ? 'proyecto_vivo' : 'obra_plan';

  return {
    persisted,
    graphMode,
    tareas: (tareasRes.data ?? []) as any[],
  };
}

export async function loadGrafoSnapshotForRequest(
  obraId: string,
): Promise<{ ok: true; snapshot: GrafoSnapshot } | { ok: false; response: NextResponse }> {
  const gated = await authAndLoadObra(obraId);
  if (!gated.ok) return gated;
  const loaded = await loadPersisted(gated.supabase, gated.obra);
  return {
    ok: true,
    snapshot: buildGrafoSnapshot({
      obraId,
      graphMode: loaded.graphMode,
      objetivoTexto: gated.obra.objetivo_texto ?? null,
      canvas: loaded.persisted,
      tareas: loaded.tareas,
    }),
  };
}

export async function loadProyectoVivoForWrite(
  obraId: string,
): Promise<
  | {
      ok: true;
      userId: string;
      orgId: string;
      objetivoTexto: string | null;
      canvas: CanvasMultinivelPersisted;
      supabase: ReturnType<typeof createServiceSupabaseClient>;
    }
  | { ok: false; response: NextResponse }
> {
  const gated = await authAndLoadObra(obraId);
  if (!gated.ok) return gated;
  if (gated.obra.graph_mode !== 'proyecto_vivo') {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: 'El orquestador solo aplica a graph_mode=proyecto_vivo' },
        { status: 400 },
      ),
    };
  }
  const loaded = await loadPersisted(gated.supabase, gated.obra);
  return {
    ok: true,
    userId: gated.userId,
    orgId: gated.obra.org_id,
    objetivoTexto: gated.obra.objetivo_texto ?? null,
    canvas: loaded.persisted,
    supabase: gated.supabase,
  };
}

