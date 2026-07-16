import { NextResponse, type NextRequest } from 'next/server';

import { obraCheckDb, getSessionFromCookie, logEvent, touchSession } from '@/lib/obra-check/db';
import { rowToTask, type ObraCheckTaskRow } from '@/lib/obra-check/mappers';
import { ordenarTareas } from '@/lib/obra-check/ordenar';

export const dynamic = 'force-dynamic';

/**
 * POST /api/obra-check/ordenar — corre CPM + sugerencia de bloques sobre las tareas de la sesión,
 * persiste orden/es_critica/bloques y devuelve el resultado completo.
 */
export async function POST(_request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data: taskRows, error: loadErr } = await db
    .from('obra_check_tasks')
    .select(
      'client_id, block_client_id, nombre, fase, rubro, duracion_dias, inicio, fin, predecesoras, responsable_label, orden, es_critica, origen, fila_origen',
    )
    .eq('session_id', session.id);

  if (loadErr) {
    return NextResponse.json({ success: false, error: 'No se pudieron leer las tareas.', detail: loadErr.message }, { status: 500 });
  }

  const tasks = (taskRows ?? []).map((r) => rowToTask(r as ObraCheckTaskRow));
  const result = ordenarTareas(tasks);

  // Persistir bloques (reemplazo completo).
  await db.from('obra_check_blocks').delete().eq('session_id', session.id);
  if (result.blocks.length > 0) {
    await db.from('obra_check_blocks').insert(
      result.blocks.map((b) => ({
        session_id: session.id,
        client_id: b.id,
        nombre: b.nombre,
        rubro: b.rubro,
        fase: b.fase ?? null,
        orden: b.orden,
      })),
    );
  }

  // Persistir orden/es_critica/bloque/fase por tarea.
  for (const t of result.tasks) {
    await db
      .from('obra_check_tasks')
      .update({
        orden: t.orden ?? 0,
        es_critica: t.esCritica ?? null,
        block_client_id: t.blockId,
        fase: t.fase ?? null,
      })
      .eq('session_id', session.id)
      .eq('client_id', t.id);
  }

  await touchSession(db, session.id);
  await logEvent(db, session.id, 'blocks_suggested', {
    blocks: result.blocks.length,
    criticas: result.cpm.tareasCriticas,
    warnings: result.warnings.map((w) => w.kind),
  });

  return NextResponse.json({ success: true, data: result });
}
