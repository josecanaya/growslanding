import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { readPublication, type PublicObra } from './publication';

export async function loadPublicFeed(): Promise<{ projects: PublicObra[]; unavailable: boolean }> {
  try {
    const db = createServiceSupabaseClient();
    const { data, error } = await db.from('obras')
      .select('id, publication:canvas_ui->publication')
      .eq('canvas_ui->publication->>visible', 'true')
      .order('updated_at', { ascending: false }).limit(100);
    if (error) throw error;
    const projects: PublicObra[] = [];
    for (const row of data ?? []) {
      const publication = readPublication((row as unknown as { publication: unknown }).publication);
      if (publication?.visible) projects.push({ ...publication, id: row.id });
    }
    const rounds = await (db as any).from('project_rounds').select('obra_id,version,goal,closes,conditions,fingerprint,mode').in('obra_id', projects.map(p => p.id));
    if (rounds.error) throw rounds.error;
    for (const project of projects) project.round = rounds.data?.find((r: { obra_id: string }) => r.obra_id === project.id);
    return { projects, unavailable: false };
  } catch {
    return { projects: [], unavailable: true };
  }
}

export async function loadPublicObra(id: string): Promise<PublicObra | null> {
  const { data, error } = await createServiceSupabaseClient().from('obras')
    .select('id, publication:canvas_ui->publication').eq('id', id)
    .eq('canvas_ui->publication->>visible', 'true').maybeSingle();
  if (error) throw error;
  const publication = readPublication((data as unknown as { publication: unknown } | null)?.publication);
  if (!data || !publication?.visible) return null;
  const rounds = await (createServiceSupabaseClient() as any).from('project_rounds').select('version,goal,closes,conditions,fingerprint,mode').eq('obra_id',id).order('version',{ascending:false}).limit(1);
  if (rounds.error) throw rounds.error;
  return { ...publication, id: data.id, round: rounds.data?.[0] };
}
