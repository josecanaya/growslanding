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
    await aplicarAvanceVerificado(db, projects);
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
  const project = { ...publication, id: data.id };
  await aplicarAvanceVerificado(createServiceSupabaseClient(), [project]);
  return project;
}

const ETAPAS: Record<string, string> = { reprogramada: 'Obra reprogramada', en_cierre: 'En proceso de cierre', cerrada: 'Obra cerrada' };
/**
 * En obras que usan el circuito, el avance del feed es el avance físico VERIFICADO (avances aceptados con
 * evidencia, ponderados por costo), no un número cargado a mano. Si la lectura falla se conserva lo publicado.
 */
async function aplicarAvanceVerificado(db: ReturnType<typeof createServiceSupabaseClient>, projects: PublicObra[]) {
  if (!projects.length) return;
  try {
    const ids = projects.map((p) => p.id);
    const anyDb = db as any;
    const [tareas, estados] = await Promise.all([
      anyDb.from('tareas').select('obra_id, avance, costo_presupuestado').eq('source', 'circuito').in('obra_id', ids).limit(5000),
      anyDb.from('obra_circuito').select('obra_id, estado').in('obra_id', ids),
    ]);
    if (tareas.error || estados.error) return;
    for (const project of projects) {
      const propias = (tareas.data as { obra_id: string; avance: number | null; costo_presupuestado: number | null }[]).filter((t) => t.obra_id === project.id);
      if (!propias.length) continue;
      const peso = (t: { costo_presupuestado: number | null }) => Number(t.costo_presupuestado ?? 0) || 1;
      const total = propias.reduce((s, t) => s + peso(t), 0);
      project.progress = Math.round(propias.reduce((s, t) => s + peso(t) * Number(t.avance ?? 0), 0) / total);
      const estado = (estados.data as { obra_id: string; estado: string }[]).find((e) => e.obra_id === project.id)?.estado;
      if (estado && ETAPAS[estado]) project.stage = ETAPAS[estado];
      else if (project.progress > 0) project.stage = project.progress >= 100 ? 'Obra terminada' : 'En ejecución · avance verificado';
    }
  } catch { /* se conserva la publicación tal como está */ }
}
