import { NextResponse } from 'next/server';

import { obraCheckDb, getSessionFromCookie } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

/** GET /api/obra-check/leads — respuestas de formularios de la sesión (contactos capturados). */
export async function GET() {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data, error } = await db
    .from('obra_check_form_responses')
    .select('id, nombre, telefono, email, rubro, empresa, mensaje, created_at, invite_id')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const inviteIds = [...new Set(((data ?? []) as { invite_id: string }[]).map((r) => r.invite_id))];
  let blockByInvite: Record<string, string> = {};
  if (inviteIds.length > 0) {
    const { data: invites } = await db
      .from('obra_check_invites')
      .select('id, block_client_id')
      .in('id', inviteIds);
    blockByInvite = Object.fromEntries(
      ((invites ?? []) as { id: string; block_client_id: string }[]).map((i) => [i.id, i.block_client_id]),
    );
  }

  const leads = ((data ?? []) as Array<{
    id: string;
    nombre: string;
    telefono: string;
    email: string | null;
    rubro: string | null;
    empresa: string | null;
    mensaje: string | null;
    created_at: string;
    invite_id: string;
  }>).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono,
    email: r.email,
    rubro: r.rubro,
    empresa: r.empresa,
    mensaje: r.mensaje,
    createdAt: r.created_at,
    blockId: blockByInvite[r.invite_id] ?? null,
  }));

  return NextResponse.json({ success: true, data: leads });
}
