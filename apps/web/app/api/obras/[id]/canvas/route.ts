import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { listCanvasPlanningOrgIds, readCanvasSnapshot, saveCanvasSnapshot, canvasPersistenceError } from '@/lib/canvas/canvasPersistenceServer';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { persistedToSupabaseRows, supabaseRowsToPersisted } from '@/lib/canvas/canvasSupabaseMapper';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function context(obraId: string) {
  const cookieStore = await cookies();
  const auth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 }) };
  const client = createServiceSupabaseClient();
  const ids = await listCanvasPlanningOrgIds(client, user.id, user.email);
  const obra = await (client as any).from('obras').select('org_id').eq('id', obraId).maybeSingle();
  if (obra.error) throw obra.error;
  if (!obra.data || !ids.includes(obra.data.org_id)) return { response: NextResponse.json({ success: false, message: 'No autorizado para esta obra' }, { status: 403 }) };
  return { client, orgId: obra.data.org_id as string };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gate = await context(id);
    if (gate.response) return gate.response;
    const { data, error } = await readCanvasSnapshot(gate.client!, id, gate.orgId!);
    if (error) { const e = canvasPersistenceError(error); return NextResponse.json({ success: false, message: e.message }, { status: e.status }); }
    const persisted = supabaseRowsToPersisted(data);
    return NextResponse.json({ success: true, data: { ...persisted, revision: data.revision, obraProductKind: null, obra: data.obra } });
  } catch (e) {
    console.error('[GET canvas]', e);
    return NextResponse.json({ success: false, message: 'No se pudo leer la obra completa.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gate = await context(id);
    if (gate.response) return gate.response;
    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ success: false, message: 'JSON inválido' }, { status: 400 }); }
    if (!body || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0 ||
        typeof body.obraNombre !== 'string' || typeof body.projectKind !== 'string' ||
        !Array.isArray(body.nodes) || !Array.isArray(body.edges) || !Array.isArray(body.budgetGroups) || !Array.isArray(body.pathIds)) {
      return NextResponse.json({ success: false, message: 'Falta el canvas completo o su revisión. Recargá la obra.' }, { status: 400 });
    }
    let rows;
    try { rows = persistedToSupabaseRows(id, gate.orgId!, composeCanvasPersisted(body)); }
    catch { return NextResponse.json({ success: false, message: 'El canvas contiene nodos o conexiones inválidos.' }, { status: 400 }); }
    const { data, error } = await saveCanvasSnapshot(gate.client!, id, gate.orgId!, body.expectedRevision, rows);
    if (error) { console.error('[PUT canvas RPC]', error); const e = canvasPersistenceError(error); return NextResponse.json({ success: false, message: e.message }, { status: e.status }); }
    return NextResponse.json({ success: true, message: 'Canvas guardado', data });
  } catch (e) {
    console.error('[PUT canvas]', e);
    return NextResponse.json({ success: false, message: 'No se pudo guardar la obra. Los cambios locales se conservan.' }, { status: 500 });
  }
}
