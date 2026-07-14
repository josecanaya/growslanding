import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';
import { buildWaLink, buildWaMessage } from '@/lib/obra-check/waMessage';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  contactId: z.string().uuid(),
  blockId: z.string().max(120), // client_id del bloque
  tipo: z.enum(['orden_trabajo', 'pedido_presupuesto']),
  fechaLimite: z.string().max(20).nullable().optional(),
});

/** POST /api/obra-check/wa — genera el texto + link wa.me para un bloque asignado. */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Solicitud inválida.', detail: (err as Error).message }, { status: 400 });
  }

  const { data: contact } = await db
    .from('obra_check_contacts')
    .select('id, nombre, telefono')
    .eq('session_id', session.id)
    .eq('id', parsed.contactId)
    .maybeSingle();
  if (!contact) return NextResponse.json({ success: false, error: 'Contacto no encontrado.' }, { status: 404 });

  const { data: block } = await db
    .from('obra_check_blocks')
    .select('nombre')
    .eq('session_id', session.id)
    .eq('client_id', parsed.blockId)
    .maybeSingle();
  if (!block) return NextResponse.json({ success: false, error: 'Bloque no encontrado.' }, { status: 404 });

  const { data: tareas } = await db
    .from('obra_check_tasks')
    .select('nombre, orden')
    .eq('session_id', session.id)
    .eq('block_client_id', parsed.blockId)
    .order('orden', { ascending: true });

  const c = contact as { nombre: string; telefono: string | null };
  const texto = buildWaMessage({
    tipo: parsed.tipo,
    contactoNombre: c.nombre,
    bloqueNombre: (block as { nombre: string }).nombre,
    tareas: ((tareas ?? []) as { nombre: string }[]).map((t) => t.nombre),
    tipoObra: session.tipo_obra,
    fechaLimite: parsed.fechaLimite ?? null,
  });
  const waLink = buildWaLink(texto, c.telefono);

  await db.from('obra_check_wa_messages').insert({
    session_id: session.id,
    contact_id: parsed.contactId,
    block_client_id: parsed.blockId,
    tipo: parsed.tipo,
    texto,
  });
  await logEvent(db, session.id, 'wa_generated', { tipo: parsed.tipo, tieneTelefono: Boolean(c.telefono) });

  return NextResponse.json({ success: true, data: { texto, waLink } });
}
