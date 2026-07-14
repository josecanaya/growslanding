import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({
    contactId: z.string().uuid(),
    blockId: z.string().max(120).optional(), // client_id del bloque
    taskClientIds: z.array(z.string().max(120)).optional(),
  })
  .refine((b) => b.blockId || (b.taskClientIds && b.taskClientIds.length > 0), {
    message: 'Se requiere blockId o taskClientIds.',
  });

/** POST /api/obra-check/asignar — asigna un contacto a un bloque (y sus tareas) o a tareas sueltas. */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Asignación inválida.', detail: (err as Error).message }, { status: 400 });
  }

  // Validar que el contacto pertenece a la sesión.
  const { data: contact } = await db
    .from('obra_check_contacts')
    .select('id, nombre')
    .eq('session_id', session.id)
    .eq('id', parsed.contactId)
    .maybeSingle();
  if (!contact) return NextResponse.json({ success: false, error: 'Contacto no encontrado en la sesión.' }, { status: 404 });

  const nombre = (contact as { nombre: string }).nombre;

  if (parsed.blockId) {
    await db
      .from('obra_check_blocks')
      .update({ contact_id: parsed.contactId })
      .eq('session_id', session.id)
      .eq('client_id', parsed.blockId);
    await db
      .from('obra_check_tasks')
      .update({ contact_id: parsed.contactId, responsable_label: nombre })
      .eq('session_id', session.id)
      .eq('block_client_id', parsed.blockId);
  }

  if (parsed.taskClientIds && parsed.taskClientIds.length > 0) {
    await db
      .from('obra_check_tasks')
      .update({ contact_id: parsed.contactId, responsable_label: nombre })
      .eq('session_id', session.id)
      .in('client_id', parsed.taskClientIds);
  }

  return NextResponse.json({ success: true, data: { ok: true } });
}
