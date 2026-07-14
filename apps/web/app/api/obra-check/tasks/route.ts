import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent, touchSession } from '@/lib/obra-check/db';
import { taskToRow } from '@/lib/obra-check/mappers';
import type { ObraCheckTask } from '@/lib/obra-check/types';

export const dynamic = 'force-dynamic';

const taskSchema = z.object({
  id: z.string().min(1).max(120),
  nombre: z.string().min(1).max(300),
  rubro: z.string().max(60).nullable().default(null),
  duracionDias: z.number().nonnegative().nullable().default(null),
  inicio: z.string().max(20).nullable().default(null),
  fin: z.string().max(20).nullable().default(null),
  predecesoras: z.array(z.string().max(120)).default([]),
  responsableLabel: z.string().max(200).nullable().default(null),
  blockId: z.string().max(120).nullable().default(null),
  origen: z.enum(['excel', 'csv', 'project_xml', 'chat']).default('chat'),
  filaOrigen: z.number().int().optional(),
  orden: z.number().int().optional(),
  esCritica: z.boolean().optional(),
});

const bodySchema = z.object({ tasks: z.array(taskSchema).max(500) });

/** PUT /api/obra-check/tasks — reemplaza el set completo de tareas de la sesión (full-replace). */
export async function PUT(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Tareas inválidas.', detail: (err as Error).message }, { status: 400 });
  }

  // full-replace: limpiar tareas y bloques previos de la sesión.
  await db.from('obra_check_tasks').delete().eq('session_id', session.id);
  await db.from('obra_check_blocks').delete().eq('session_id', session.id);

  if (parsed.tasks.length > 0) {
    const rows = (parsed.tasks as ObraCheckTask[]).map((t) => taskToRow(session.id, t));
    const { error } = await db.from('obra_check_tasks').insert(rows);
    if (error) {
      return NextResponse.json({ success: false, error: 'No se pudieron guardar las tareas.', detail: error.message }, { status: 500 });
    }
  }

  await touchSession(db, session.id);
  await logEvent(db, session.id, 'file_parsed', { count: parsed.tasks.length });

  return NextResponse.json({ success: true, data: { count: parsed.tasks.length } });
}
