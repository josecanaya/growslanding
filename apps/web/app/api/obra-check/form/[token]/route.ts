import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, logEvent } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/** GET /api/obra-check/form/[token] — datos públicos del invite (sin cookie). */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ success: false, error: 'Link inválido.' }, { status: 400 });
  }

  const db = obraCheckDb();
  const { data: invite } = await db
    .from('obra_check_invites')
    .select('id, token, session_id, block_client_id, contact_id, tipo, expires_at, responded_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ success: false, error: 'Este link no existe o expiró.' }, { status: 404 });
  }

  const inv = invite as {
    id: string;
    session_id: string;
    block_client_id: string;
    contact_id: string | null;
    tipo: string;
    expires_at: string;
    responded_at: string | null;
  };

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Este link expiró.' }, { status: 410 });
  }

  const { data: session } = await db
    .from('obra_check_sessions')
    .select('empresa, tipo_obra, email')
    .eq('id', inv.session_id)
    .maybeSingle();

  const { data: block } = await db
    .from('obra_check_blocks')
    .select('nombre, rubro')
    .eq('session_id', inv.session_id)
    .eq('client_id', inv.block_client_id)
    .maybeSingle();

  const { data: tareas } = await db
    .from('obra_check_tasks')
    .select('nombre, duracion_dias, orden')
    .eq('session_id', inv.session_id)
    .eq('block_client_id', inv.block_client_id)
    .order('orden', { ascending: true });

  let contactNombre: string | null = null;
  if (inv.contact_id) {
    const { data: contact } = await db
      .from('obra_check_contacts')
      .select('nombre')
      .eq('id', inv.contact_id)
      .maybeSingle();
    contactNombre = (contact as { nombre: string } | null)?.nombre ?? null;
  }

  const sess = session as { empresa: string | null; tipo_obra: string | null; email: string | null } | null;

  return NextResponse.json({
    success: true,
    data: {
      tipo: inv.tipo,
      alreadyResponded: Boolean(inv.responded_at),
      bloqueNombre: (block as { nombre: string } | null)?.nombre ?? 'Trabajo',
      rubro: (block as { rubro: string | null } | null)?.rubro ?? null,
      empresa: sess?.empresa ?? null,
      tipoObra: sess?.tipo_obra ?? null,
      contactoSugerido: contactNombre,
      tareas: ((tareas ?? []) as { nombre: string; duracion_dias: number | null; orden: number }[]).map((t) => ({
        nombre: t.nombre,
        duracionDias: t.duracion_dias,
      })),
    },
  });
}

const submitSchema = z.object({
  nombre: z.string().min(2).max(120),
  telefono: z.string().min(6).max(40),
  email: z.string().email().max(160).optional().or(z.literal('')),
  rubro: z.string().max(80).optional().nullable(),
  empresa: z.string().max(120).optional().nullable(),
  mensaje: z.string().max(2000).optional().nullable(),
  aceptaContacto: z.boolean().default(true),
});

/** POST /api/obra-check/form/[token] — el contratista deja sus datos (lead). */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ success: false, error: 'Link inválido.' }, { status: 400 });
  }

  let body;
  try {
    body = submitSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Datos inválidos.', detail: (err as Error).message }, { status: 400 });
  }

  const db = obraCheckDb();
  const { data: invite } = await db
    .from('obra_check_invites')
    .select('id, session_id, block_client_id, contact_id, expires_at, responded_at')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ success: false, error: 'Este link no existe.' }, { status: 404 });
  }

  const inv = invite as {
    id: string;
    session_id: string;
    block_client_id: string;
    contact_id: string | null;
    expires_at: string;
    responded_at: string | null;
  };

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Este link expiró.' }, { status: 410 });
  }

  const telefono = body.telefono.replace(/[^\d+]/g, '');
  if (telefono.length < 6) {
    return NextResponse.json({ success: false, error: 'Teléfono inválido.' }, { status: 400 });
  }

  const { error: respErr } = await db.from('obra_check_form_responses').insert({
    invite_id: inv.id,
    session_id: inv.session_id,
    nombre: body.nombre.trim(),
    telefono,
    email: body.email?.trim() || null,
    rubro: body.rubro?.trim() || null,
    empresa: body.empresa?.trim() || null,
    mensaje: body.mensaje?.trim() || null,
    acepta_contacto: body.aceptaContacto,
  });

  if (respErr) {
    return NextResponse.json({ success: false, error: 'No se pudo guardar.', detail: respErr.message }, { status: 500 });
  }

  // Actualizar o crear contacto de la sesión con el teléfono real (el dato que buscamos).
  if (inv.contact_id) {
    await db
      .from('obra_check_contacts')
      .update({
        nombre: body.nombre.trim(),
        telefono,
        rubro: body.rubro?.trim() || null,
      })
      .eq('id', inv.contact_id)
      .eq('session_id', inv.session_id);
  } else {
    const { data: created } = await db
      .from('obra_check_contacts')
      .insert({
        session_id: inv.session_id,
        nombre: body.nombre.trim(),
        telefono,
        rubro: body.rubro?.trim() || null,
      })
      .select('id')
      .single();
    if (created) {
      await db
        .from('obra_check_blocks')
        .update({ contact_id: (created as { id: string }).id })
        .eq('session_id', inv.session_id)
        .eq('client_id', inv.block_client_id);
      await db.from('obra_check_invites').update({ contact_id: (created as { id: string }).id }).eq('id', inv.id);
    }
  }

  await db.from('obra_check_invites').update({ responded_at: new Date().toISOString() }).eq('id', inv.id);
  await logEvent(db, inv.session_id, 'form_response', {
    inviteId: inv.id,
    blockId: inv.block_client_id,
    telefono: true,
  });

  // Link de confirmación para que el contratista se escriba a sí mismo / reenvíe (opcional UX).
  const confirmText = [
    `Listo ✓ Registré mis datos para el trabajo.`,
    `Nombre: ${body.nombre.trim()}`,
    `WhatsApp: ${telefono}`,
    body.mensaje?.trim() ? `Nota: ${body.mensaje.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const confirmWaLink = `https://wa.me/?text=${encodeURIComponent(confirmText)}`;

  return NextResponse.json({
    success: true,
    data: {
      ok: true,
      confirmWaLink,
    },
  });
}
