import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { buildObraInsertRow, stripMissingColumnFromInsert } from '@/lib/obras/obraInsertPayload';
import { buildSeedIdeaCanvasSnapshot } from '@/lib/proyecto-vivo/seedIdeaCanvas';
import { persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';
import type { ObraGraphMode } from '@/lib/types/canvasMultinivel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  org_id: z.string().uuid(),
  nombre: z.string().min(2).max(200).optional(),
  objetivo_texto: z.string().max(4000).optional(),
});

/**
 * POST /api/obras/desde-idea
 * Crea obra en modo proyecto_vivo + seed canvas (nodo estado Idea).
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { org_id, nombre, objetivo_texto } = parsed.data;
    const allowedOrgIds = await listAccessibleOrgIds(
      createServiceSupabaseClient(),
      user.id,
      user.email,
    );
    if (!allowedOrgIds.includes(org_id)) {
      return NextResponse.json({ success: false, message: 'Organización no accesible' }, { status: 403 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const obraNombre = (nombre?.trim() || 'Nuevo proyecto').slice(0, 200);

    let insertRow = {
      ...buildObraInsertRow({
        org_id,
        name: obraNombre,
        estado: 'activa',
        tipo_obra: 'proyecto_vivo',
      }),
      graph_mode: 'proyecto_vivo' as ObraGraphMode,
      objetivo_texto: objetivo_texto?.trim() || null,
    };

    let obra: { id: string; org_id: string; name: string } | null = null;
    let insertErr: { message?: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const result = await supabaseAny
        .from('obras')
        .insert([insertRow])
        .select('id, org_id, name, graph_mode')
        .single();
      if (!result.error) {
        obra = result.data;
        break;
      }
      insertErr = result.error;
      const stripped = stripMissingColumnFromInsert(insertRow as any, String(result.error.message ?? ''));
      if (!stripped) break;
      insertRow = { ...stripped, graph_mode: 'proyecto_vivo', objetivo_texto: objetivo_texto?.trim() || null };
    }

    if (!obra) {
      return NextResponse.json(
        { success: false, message: insertErr?.message ?? 'No se pudo crear el proyecto' },
        { status: 500 },
      );
    }

    const snapshot = buildSeedIdeaCanvasSnapshot(obra.name);
    const rows = persistedToSupabaseRows(obra.id, obra.org_id, snapshot);

    const { error: patchObraErr } = await supabaseAny
      .from('obras')
      .update({
        name: rows.obrasPatch.name,
        canvas_project_kind: rows.obrasPatch.canvas_project_kind,
        canvas_ui: rows.obrasPatch.canvas_ui,
      })
      .eq('id', obra.id);
    if (patchObraErr) {
      console.warn('[desde-idea] patch obra canvas meta', patchObraErr.message);
    }

    if (rows.nodes.length > 0) {
      const { error: insNodesErr } = await supabaseAny.from('canvas_nodes').insert(rows.nodes);
      if (insNodesErr) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Proyecto creado pero falló el seed del grafo. ¿Aplicaste la migración proyecto_vivo?',
            details: insNodesErr.message,
            obraId: obra.id,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        obra: { id: obra.id, name: obra.name, graph_mode: 'proyecto_vivo' },
        redirectTo: `/cliente/tareas/${obra.id}/editor`,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error('[POST /api/obras/desde-idea]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
