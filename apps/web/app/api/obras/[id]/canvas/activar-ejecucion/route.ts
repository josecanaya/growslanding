import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { PermisoService } from '@/lib/services/permiso.service';
import { toDbUuidFromCanvasId } from '@/lib/canvas/canvasSupabaseMapper';
import { activarEjecucionTransformacion } from '@/lib/proyecto-vivo/activarEjecucionTransformacion';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  canvasNodeId: z.string().min(1),
});

async function assertObraProyectoVivo(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  obraId: string,
  allowedOrgIds: string[],
) {
  if (allowedOrgIds.length === 0) {
    return { ok: false as const, status: 403, message: 'Sin organización accesible' };
  }
  const { data: obra, error } = await (supabase as any)
    .from('obras')
    .select('id, org_id, graph_mode')
    .eq('id', obraId)
    .maybeSingle();
  if (error || !obra) {
    return { ok: false as const, status: 404, message: 'Obra no encontrada' };
  }
  if (!allowedOrgIds.includes(obra.org_id as string)) {
    return { ok: false as const, status: 403, message: 'No autorizado' };
  }
  if (obra.graph_mode !== 'proyecto_vivo') {
    return {
      ok: false as const,
      status: 400,
      message: 'activar-ejecucion solo aplica a obras graph_mode=proyecto_vivo',
    };
  }
  return { ok: true as const, org_id: obra.org_id as string };
}

async function puedePublicar(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  user: { id: string; email?: string | null },
  orgId: string,
): Promise<boolean> {
  const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
  if (rol === 'CLIENTE') return true;
  if (!user.email) return false;
  const { data } = await (supabase as any)
    .from('leader_invites')
    .select('id')
    .eq('org_id', orgId)
    .eq('email', user.email)
    .eq('status', 'accepted')
    .maybeSingle();
  return Boolean(data);
}

/**
 * POST /api/obras/[id]/canvas/activar-ejecucion
 * Publica una transformación de ejecución al circuito operativo (tareas + precedencias).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'canvasNodeId requerido', details: parsed.error.format() },
        { status: 400 },
      );
    }

    let dbNodeId: string;
    try {
      dbNodeId = toDbUuidFromCanvasId(parsed.data.canvasNodeId);
    } catch {
      return NextResponse.json({ ok: false, error: 'canvasNodeId inválido' }, { status: 400 });
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
    const gate = await assertObraProyectoVivo(supabase, obraId, allowedOrgIds);
    if (!gate.ok) {
      return NextResponse.json({ ok: false, error: gate.message }, { status: gate.status });
    }

    const can = await puedePublicar(supabase, user, gate.org_id);
    if (!can) {
      return NextResponse.json(
        { ok: false, error: 'No tenés permiso para activar ejecución en esta organización.' },
        { status: 403 },
      );
    }

    const result = await activarEjecucionTransformacion({
      supabase,
      obraId,
      obraOrgId: gate.org_id,
      actorId: user.id,
      canvasNodeId: dbNodeId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[POST activar-ejecucion]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
