import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObraAccessError, requireObraAccess } from '@/lib/obra-access';
import { readCanvasSnapshot, saveCanvasSnapshot, canvasPersistenceError } from '@/lib/canvas/canvasPersistenceServer';
import { emptyPublication, publicationSchema, readPublication } from '@/lib/obras/publication';

export const dynamic = 'force-dynamic';
const schema = z.object({ revision: z.number().int().nonnegative(), publication: publicationSchema });
const failure = (error: unknown) => NextResponse.json(
  { error: error instanceof ObraAccessError ? error.message : 'No se pudo actualizar la publicación.' },
  { status: error instanceof ObraAccessError ? error.status : 503 },
);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, orgId } = await requireObraAccess(id, true);
    const result = await readCanvasSnapshot(supabase, id, orgId);
    if (result.error || !result.data) throw new ObraAccessError(503, 'No se pudo leer la obra.');
    return NextResponse.json({
      publication: readPublication(result.data.obra.canvas_ui?.publication) ?? emptyPublication(result.data.obra.name),
      revision: result.data.revision,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, orgId } = await requireObraAccess(id, true);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ObraAccessError(400, 'Revisá los datos de la publicación.');
    const snapshot = await readCanvasSnapshot(supabase, id, orgId);
    if (snapshot.error || !snapshot.data) throw new ObraAccessError(503, 'No se pudo leer la obra.');
    const current = snapshot.data;
    if (current.revision !== parsed.data.revision) throw new ObraAccessError(409, 'La obra cambió. Recargá la publicación antes de guardar.');
    // The existing atomic snapshot RPC locks the obra and compares revision.
    // Only the reviewed public fields are exposed by the feed.
    const publication = { ...parsed.data.publication, publishedAt: new Date().toISOString() };
    const saved = await saveCanvasSnapshot(supabase, id, orgId, current.revision, {
      obrasPatch: { name: current.obra.name, canvas_project_kind: current.obra.canvas_project_kind, canvas_ui: { publication } },
      nodes: current.nodes, edges: current.edges, budgetGroups: current.budgetGroups,
      checklistItems: current.checklistItems, budgetGroupTasks: current.budgetGroupTasks,
    });
    if (saved.error) {
      const mapped = canvasPersistenceError(saved.error);
      throw new ObraAccessError(mapped.status, mapped.message);
    }
    return NextResponse.json({ publication, revision: current.revision + 1 });
  } catch (error) { return failure(error); }
}
