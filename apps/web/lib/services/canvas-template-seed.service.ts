import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { buildCanvasFromTaskTemplate } from '@/lib/canvas/buildCanvasFromTaskTemplate';
import { getOfficialTemplateBySlug } from '@/lib/canvas/officialCanvasTemplates';
import { persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';

type SupabaseService = ReturnType<typeof createServiceSupabaseClient>;

/**
 * Si el canvas de la obra no tiene nodos, materializa el template en canvas_nodes / canvas_edges.
 */
export async function seedCanvasFromTemplateIfEmpty(params: {
  supabase: SupabaseService;
  obraId: string;
  orgId: string;
  templateSlug: string;
  obraNombre: string;
}): Promise<{ seeded: boolean; reason?: string }> {
  const { supabase, obraId, orgId, templateSlug, obraNombre } = params;
  const db = supabase as unknown as {
    from: (table: string) => {
      select: (
        columns: string,
        opts?: { count: 'exact'; head: boolean },
      ) => {
        eq: (
          col: string,
          val: string,
        ) => Promise<{ count: number | null; error: { message?: string } | null }>;
      };
      insert: (rows: unknown[] | unknown) => Promise<{ error: { message?: string } | null }>;
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message?: string } | null }>;
      };
    };
  };

  const { count, error: countErr } = await db
    .from('canvas_nodes')
    .select('id', { count: 'exact', head: true })
    .eq('obra_id', obraId);

  if (countErr) {
    return { seeded: false, reason: 'count_error' };
  }
  if ((count ?? 0) > 0) {
    return { seeded: false, reason: 'already_has_nodes' };
  }

  const template = getOfficialTemplateBySlug(templateSlug);
  if (!template) {
    return { seeded: false, reason: 'template_not_found' };
  }

  const persisted = buildCanvasFromTaskTemplate(template, obraNombre);
  const rows = persistedToSupabaseRows(obraId, orgId, persisted);

  if (rows.nodes.length > 0) {
    const { error: insN } = await db.from('canvas_nodes').insert(rows.nodes);
    if (insN) {
      console.error('[seedCanvasFromTemplate] insert nodes', insN);
      return { seeded: false, reason: 'insert_nodes_failed' };
    }
  }

  if (rows.edges.length > 0) {
    const edgeRows = rows.edges.map((e) => ({
      id: e.id,
      obra_id: obraId,
      org_id: orgId,
      source_node_id: e.source_node_id,
      target_node_id: e.target_node_id,
      type: e.type ?? 'FINISH_TO_START',
      is_critical: e.is_critical ?? false,
      lag_days: e.lag_days ?? 0,
      metadata: {},
    }));
    const { error: insE } = await db.from('canvas_edges').insert(edgeRows);
    if (insE) {
      console.error('[seedCanvasFromTemplate] insert edges', insE);
      return { seeded: false, reason: 'insert_edges_failed' };
    }
  }

  const { error: upObra } = await db.from('obras').update(rows.obrasPatch).eq('id', obraId);
  if (upObra) {
    console.warn('[seedCanvasFromTemplate] update obra', upObra);
  }

  return { seeded: true };
}

export async function trySeedCanvasForObra(
  supabase: SupabaseService,
  obraId: string,
  orgId: string,
): Promise<void> {
  const db = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: {
              name?: string;
              canvas_template_slug?: string | null;
            } | null;
            error: unknown;
          }>;
        };
      };
    };
  };

  const { data: obra } = await db
    .from('obras')
    .select('name, canvas_template_slug')
    .eq('id', obraId)
    .maybeSingle();

  if (!obra) return;

  const slug = obra.canvas_template_slug ?? null;
  if (!slug) return;

  const nombre = obra.name ?? 'Obra';
  await seedCanvasFromTemplateIfEmpty({
    supabase,
    obraId,
    orgId,
    templateSlug: slug,
    obraNombre: nombre,
  });
}
