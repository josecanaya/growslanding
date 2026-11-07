import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listCanvasPlanningOrgIds } from '@/lib/canvas/canvasPersistenceServer';
import { toClientBudgetGroupId } from '@/lib/canvas/canvasSupabaseMapper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


/**
 * GET /api/cliente/presupuestos?org_id=uuid (opcional)
 * Presupuestos de tareas (tareas_presupuestos) visibles para la org del usuario.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await listCanvasPlanningOrgIds(supabaseAny, user.id, user.email);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orgIdParam = request.nextUrl.searchParams.get('org_id');
    if (orgIdParam && !allowedOrgIds.includes(orgIdParam)) {
      return NextResponse.json({ success: false, error: 'Organización no accesible' }, { status: 403 });
    }
    let orgId = orgIdParam ?? allowedOrgIds[0];
    const obraScope = request.nextUrl.searchParams.get('obra');
    if (obraScope) {
      const obra = await supabase.from('obras').select('org_id').eq('id', obraScope).maybeSingle();
      if (obra.error || !obra.data || !allowedOrgIds.includes(obra.data.org_id)) {
        return NextResponse.json({ success: false, error: 'No podés revisar los presupuestos de esta obra.' }, { status: 403 });
      }
      orgId = obra.data.org_id;
    }

    // Sin embed `socios`: en muchas BDs no hay FK tareas_presupuestos.socio_id → socios y PostgREST falla.
    const { data, error } = await supabase
      .from('tareas_presupuestos')
      .select(
        `
        id,
        monto,
        estado,
        created_at,
        updated_at,
        socio_id,
        tarea_id,
        tareas!inner (
          org_id,
          title,
          obra_id,
          canvas_node_id,
          obras ( id, name )
        )
      `,
      )
      .eq('tareas.org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/cliente/presupuestos]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const presupRows = data ?? [];
    const socioIds = [
      ...new Set(
        presupRows
          .map((p: { socio_id?: string | null }) => p.socio_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const socioMap = new Map<string, { nombre: string | null; email: string | null }>();
    const SOCIO_CHUNK = 100;
    for (let i = 0; i < socioIds.length; i += SOCIO_CHUNK) {
      const chunk = socioIds.slice(i, i + SOCIO_CHUNK);
      const { data: sociosRows, error: sociosErr } = await supabase
        .from('socios')
        .select('id, nombre, email')
        .in('id', chunk);
      if (sociosErr) {
        console.error('[GET /api/cliente/presupuestos] socios:', sociosErr);
      } else {
        for (const s of sociosRows ?? []) {
          socioMap.set((s as { id: string }).id, {
            nombre: (s as { nombre?: string | null }).nombre ?? null,
            email: (s as { email?: string | null }).email ?? null,
          });
        }
      }
    }

    const obraIds = [
      ...new Set(
        presupRows
          .map((p: { tareas?: { obra_id?: string | null } | null }) => p.tareas?.obra_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const budgetGroupNameByDbId = new Map<string, string>();
    if (obraIds.length > 0) {
      const { data: bgRows, error: bgErr } = await supabaseAny
        .from('canvas_budget_groups')
        .select('id, name, obra_id')
        .in('obra_id', obraIds);
      if (bgErr) {
        console.error('[GET /api/cliente/presupuestos] canvas_budget_groups:', bgErr);
      } else {
        for (const g of bgRows ?? []) {
          const id = (g as { id: string }).id;
          budgetGroupNameByDbId.set(id, (g as { name: string }).name);
        }
      }
    }

    const nodeBudgetGroupByDbId = new Map<string, string | null>();
    const canvasNodeIds = [
      ...new Set(
        presupRows
          .map((p: { tareas?: { canvas_node_id?: string | null } | null }) => p.tareas?.canvas_node_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (canvasNodeIds.length > 0) {
      const IN_CHUNK = 80;
      for (let i = 0; i < canvasNodeIds.length; i += IN_CHUNK) {
        const chunk = canvasNodeIds.slice(i, i + IN_CHUNK);
        const { data: nodeRows, error: nodeErr } = await supabaseAny
          .from('canvas_nodes')
          .select('id, budget_group_id')
          .in('id', chunk);
        if (nodeErr) {
          console.error('[GET /api/cliente/presupuestos] canvas_nodes:', nodeErr);
        } else {
          for (const n of nodeRows ?? []) {
            const row = n as { id: string; budget_group_id?: string | null };
            nodeBudgetGroupByDbId.set(row.id, row.budget_group_id ?? null);
          }
        }
      }
    }

    const rows = presupRows.filter((p: any) => !obraScope || p.tareas?.obra_id === obraScope).map((p: any) => {
      const t = p.tareas;
      const obra = t?.obras;
      const socio = p.socio_id ? socioMap.get(p.socio_id) : undefined;
      const canvasNodeId = t?.canvas_node_id ?? null;
      let budgetGroupId: string | null = null;
      let budgetGroupName: string | null = null;
      if (canvasNodeId) {
        const bgDb = nodeBudgetGroupByDbId.get(canvasNodeId);
        if (bgDb) {
          budgetGroupId = toClientBudgetGroupId(bgDb);
          budgetGroupName = budgetGroupNameByDbId.get(bgDb) ?? 'Paquete de trabajo';
        }
      }
      return {
        id: p.id,
        monto: p.monto,
        estado: p.estado,
        createdAt: p.created_at,
        tareaId: p.tarea_id,
        socioId: p.socio_id ?? null,
        tareaTitulo: t?.title ?? 'Tarea',
        obraId: t?.obra_id ?? null,
        obraNombre: obra?.name ?? 'Obra',
        cuadrilla: socio?.nombre || socio?.email || '—',
        canvasNodeId,
        budgetGroupId,
        budgetGroupName,
      };
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('[GET /api/cliente/presupuestos]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
