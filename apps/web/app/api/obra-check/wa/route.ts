import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';
import { buildWaFormMessage, buildWaLink, newInviteToken } from '@/lib/obra-check/waMessage';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  contactId: z.string().uuid(),
  blockId: z.string().max(120),
  budgetGroupId: z.string().max(120).optional(),
  groupName: z.string().max(200).optional(),
  tipo: z.enum(['orden_trabajo', 'pedido_presupuesto']),
  fechaLimite: z.string().max(20).nullable().optional(),
});

function appOrigin(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

/** POST /api/obra-check/wa — crea invite + mensaje WA con link al formulario (no lista de tareas). */
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
    .select('nombre, budget_group_client_id')
    .eq('session_id', session.id)
    .eq('client_id', parsed.blockId)
    .maybeSingle();
  if (!block) return NextResponse.json({ success: false, error: 'Bloque no encontrado.' }, { status: 404 });

  const blk = block as { nombre: string; budget_group_client_id: string | null };
  const groupId = parsed.budgetGroupId ?? blk.budget_group_client_id;

  // Alcance = todos los paquetes del grupo de presupuesto (paquete de trabajos entero).
  let blockClientIds = [parsed.blockId];
  let displayName = parsed.groupName?.trim() || blk.nombre;
  if (groupId) {
    const { data: groupRow } = await db
      .from('obra_check_budget_groups')
      .select('nombre')
      .eq('session_id', session.id)
      .eq('client_id', groupId)
      .maybeSingle();
    if (groupRow && !parsed.groupName?.trim()) {
      displayName = (groupRow as { nombre: string }).nombre;
    }
    const { data: groupBlocks } = await db
      .from('obra_check_blocks')
      .select('client_id')
      .eq('session_id', session.id)
      .eq('budget_group_client_id', groupId);
    const ids = ((groupBlocks ?? []) as { client_id: string }[]).map((b) => b.client_id);
    if (ids.length > 0) blockClientIds = ids;
  }

  const { count } = await db
    .from('obra_check_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .in('block_client_id', blockClientIds);

  const token = newInviteToken();
  const { error: inviteErr } = await db.from('obra_check_invites').insert({
    token,
    session_id: session.id,
    block_client_id: parsed.blockId,
    contact_id: parsed.contactId,
    tipo: parsed.tipo,
  });
  if (inviteErr) {
    return NextResponse.json({ success: false, error: 'No se pudo crear el formulario.', detail: inviteErr.message }, { status: 500 });
  }

  const formUrl = `${appOrigin(request)}/obra-check/f/${token}`;
  const c = contact as { nombre: string; telefono: string | null };

  const { data: sessionM2 } = await db
    .from('obra_check_sessions')
    .select('metros_cuadrados')
    .eq('id', session.id)
    .maybeSingle();

  const texto = buildWaFormMessage({
    tipo: parsed.tipo,
    contactoNombre: c.nombre,
    bloqueNombre: displayName,
    formUrl,
    tipoObra: session.tipo_obra,
    nTareas: count ?? 0,
    metrosCuadrados: (sessionM2 as { metros_cuadrados: number | null } | null)?.metros_cuadrados ?? null,
  });
  const waLink = buildWaLink(texto, c.telefono);

  await db.from('obra_check_wa_messages').insert({
    session_id: session.id,
    contact_id: parsed.contactId,
    block_client_id: parsed.blockId,
    tipo: parsed.tipo,
    texto,
  });
  await logEvent(db, session.id, 'wa_generated', {
    tipo: parsed.tipo,
    tieneTelefono: Boolean(c.telefono),
    formUrl: true,
  });

  return NextResponse.json({
    success: true,
    data: { texto, waLink, formUrl, inviteToken: token },
  });
}
