import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  nombre: z.string().min(1).max(200),
  rubro: z.string().max(60).nullable().optional(),
  telefono: z.string().max(40).nullable().optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  telefono: z.string().max(40).nullable(),
});

/** GET /api/obra-check/contacts — lista los contactos de la sesión. */
export async function GET() {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data, error } = await db
    .from('obra_check_contacts')
    .select('id, nombre, rubro, telefono')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

/** POST /api/obra-check/contacts — crea un contacto (contratista/responsable). */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Contacto inválido.', detail: (err as Error).message }, { status: 400 });
  }

  const { data, error } = await db
    .from('obra_check_contacts')
    .insert({
      session_id: session.id,
      nombre: parsed.nombre,
      rubro: parsed.rubro ?? null,
      telefono: parsed.telefono ?? null,
    })
    .select('id, nombre, rubro, telefono')
    .single();

  if (error || !data) return NextResponse.json({ success: false, error: 'No se pudo crear el contacto.' }, { status: 500 });

  await logEvent(db, session.id, 'contact_added', { rubro: parsed.rubro, tieneTelefono: Boolean(parsed.telefono) });
  return NextResponse.json({ success: true, data });
}

/** PATCH /api/obra-check/contacts — actualiza el WhatsApp de un contacto (para el envío directo). */
export async function PATCH(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Contacto inválido.', detail: (err as Error).message }, { status: 400 });
  }

  const telefono = parsed.telefono?.trim() || null;

  const { data, error } = await db
    .from('obra_check_contacts')
    .update({ telefono })
    .eq('session_id', session.id)
    .eq('id', parsed.id)
    .select('id, nombre, rubro, telefono')
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, error: 'No se pudo actualizar el contacto.' }, { status: 500 });
  if (!data) return NextResponse.json({ success: false, error: 'Contacto no encontrado.' }, { status: 404 });

  await logEvent(db, session.id, 'contact_updated', { tieneTelefono: Boolean(telefono) });
  return NextResponse.json({ success: true, data });
}
