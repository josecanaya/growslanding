import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObraAccessError, requireObraAccess } from '@/lib/obra-access';
import { preparePlan, studioSchema } from '@/lib/proyectista/plan';

export const dynamic = 'force-dynamic';
const requestSchema = z.object({ requestId: z.string().uuid(), data: studioSchema });
function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo operar el estudio.' }, { status: error instanceof ObraAccessError ? error.status : 503 });
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireObraAccess(id, true);
    const db = supabase as any;
    const version = new URL(_request.url).searchParams.get('version');
    if (version) {
      if (!/^[1-9][0-9]{0,3}$/.test(version)) throw new ObraAccessError(400,'Versión inválida.');
      const result = await db.from('project_rounds').select('version,snapshot,fingerprint').eq('obra_id',id).eq('version',Number(version)).maybeSingle();
      if (result.error) throw new Error('No se pudo leer el expediente.');
      if (!result.data) throw new ObraAccessError(404,'Versión inexistente.');
      return NextResponse.json(result.data,{headers:{'Cache-Control':'no-store','Content-Disposition':`attachment; filename="expediente-${id}-v${version}.json"`}});
    }
    const results = await Promise.all([
      db.from('obras').select('id,name,canvas_ui').eq('id', id).single(),
      db.from('canvas_nodes').select('id,title,type,metadata,capital_amount,planned_duration_days').eq('obra_id',id).order('sort_order'),
      db.from('canvas_edges').select('source_node_id,target_node_id').eq('obra_id',id),
      db.from('canvas_budget_groups').select('id,name,status').eq('obra_id',id),
      db.from('project_rounds').select('id,version,goal,closes,conditions,fingerprint,created_at,mode').eq('obra_id',id).order('version'),
      db.from('project_change_notes').select('id,title,reason,amount,days,status,created_at').eq('obra_id',id).order('created_at'),
    ]);
    if (results.some((result) => result.error)) throw new Error('No se pudo cargar el estudio completo.');
    return NextResponse.json({ obra: { id, name: results[0].data.name }, profile: results[0].data.canvas_ui?.studio ?? null, tasks: results[1].data, edges: results[2].data, groups: results[3].data, rounds: results[4].data, changes: results[5].data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch(error) { return failure(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireObraAccess(id, true);
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ObraAccessError(400,'Revisá los campos de la solicitud.');
    let data: Record<string, unknown> = parsed.data.data;
    if (data.action === 'import') {
      try { data = { ...data, tasks: preparePlan(parsed.data.data.action === 'import' ? parsed.data.data.tasks : []) }; }
      catch(error) { throw new ObraAccessError(400,error instanceof Error ? error.message : 'Plan inválido.'); }
    }
    const { data: result, error } = await (supabase as any).rpc('project_studio_action', { p_obra: id, p_actor: user.id, p_request: parsed.data.requestId, p_data: data });
    if (error) throw new ObraAccessError(error.code === '42501' ? 403 : error.code === '23514' || error.code === '40001' ? 409 : error.code === '22023' ? 400 : 503, error.code === 'PGRST202' ? 'El estudio está pendiente de habilitación en el servidor.' : error.message);
    return NextResponse.json(result);
  } catch(error) { return failure(error); }
}
