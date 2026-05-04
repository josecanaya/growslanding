import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { toClientNodeId } from '@/lib/canvas/canvasSupabaseMapper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function assertObraInOrgs(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  allowedOrgIds: string[],
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (allowedOrgIds.length === 0) {
    return { ok: false, status: 403, message: 'Sin organización accesible' };
  }
  const { data: obra, error } = await (supabase as unknown as any)
    .from('obras')
    .select('id, org_id')
    .eq('id', obraId)
    .maybeSingle();

  if (error || !obra) {
    return { ok: false, status: 404, message: 'Obra no encontrada' };
  }
  const orgId = obra.org_id as string;
  if (!allowedOrgIds.includes(orgId)) {
    return { ok: false, status: 403, message: 'No autorizado para esta obra' };
  }
  return { ok: true };
}

/**
 * GET — mapa canvas_node_id (cliente cn-…) → tarea publicada (estado operativo real).
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
    const gate = await assertObraInOrgs(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const supabaseAny = supabase as any;
    const { data: rows, error } = await supabaseAny
      .from('tareas')
      .select('id, canvas_node_id, estado, published_from_canvas_at')
      .eq('obra_id', obraId)
      .not('canvas_node_id', 'is', null);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const entries = (rows ?? [])
      .map((r: { id: string; canvas_node_id: string | null; estado: string; published_from_canvas_at: string | null }) => {
        if (!r.canvas_node_id) return null;
        return {
          canvasNodeId: toClientNodeId(r.canvas_node_id),
          tareaId: r.id,
          estado: String(r.estado ?? 'pendiente'),
          publishedAt: r.published_from_canvas_at ?? null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, entries });
  } catch (e) {
    console.error('[GET tareas-publicacion]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
