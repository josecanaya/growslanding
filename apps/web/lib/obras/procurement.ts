import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkTask = { id: string; title: string; estado: string; avance: number | null; canvas_node_id: string | null; etapa: string | null; fecha_fin_estimada: string | null };
export type WorkQuote = { id: string; tarea_id: string | null; socio_id: string | null; monto: number; moneda: string | null; cantidad: number | null; unidad: string | null; dias_reales: number | null; estado: string | null; notas: string | null };
export type Procurement = { tasks: WorkTask[]; quotes: WorkQuote[] };

/** Page every query so totals never silently depend on the PostgREST row limit. */
async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await query(offset, offset + 499);
    if (result.error) throw new Error('No se pudo cargar el estado operativo de la obra.');
    const rows = (result.data ?? []) as T[];
    all.push(...rows);
    if (rows.length < 500) return all;
  }
}

export async function loadProcurement(db: SupabaseClient<any>, obraId: string): Promise<Procurement> {
  const tasks = await readAll<WorkTask>((from, to) => db.from('tareas')
    .select('id, title, estado, avance, canvas_node_id, etapa, fecha_fin_estimada')
    .eq('obra_id', obraId).order('id').range(from, to));
  const quotes: WorkQuote[] = [];
  for (let index = 0; index < tasks.length; index += 100) {
    const ids = tasks.slice(index, index + 100).map((task) => task.id);
    quotes.push(...await readAll<WorkQuote>((from, to) => db.from('tareas_presupuestos')
      .select('id, tarea_id, socio_id, monto, moneda, cantidad, unidad, dias_reales, estado, notas')
      .in('tarea_id', ids).order('id').range(from, to)));
  }
  return { tasks, quotes };
}

export function comparableQuotes(quotes: WorkQuote[]) {
  // Submitted prices with a known currency and matching scope can be compared.
  const groups = new Map<string, WorkQuote[]>();
  for (const quote of quotes) {
    if (!quote.tarea_id || !quote.moneda || !['enviado', 'aprobado', 'aceptado'].includes((quote.estado ?? '').toLowerCase())) continue;
    if (!Number.isFinite(Number(quote.monto)) || Number(quote.monto) <= 0) continue;
    const key = JSON.stringify([quote.tarea_id, quote.moneda.toUpperCase(), quote.cantidad, quote.unidad]);
    groups.set(key, [...(groups.get(key) ?? []), quote]);
  }
  return [...groups.values()].map((group) => ({
    taskId: group[0].tarea_id!,
    currency: group[0].moneda!.toUpperCase(),
    quantity: group[0].cantidad,
    unit: group[0].unidad,
    quotes: [...group].sort((a, b) => Number(a.monto) - Number(b.monto)),
  }));
}
