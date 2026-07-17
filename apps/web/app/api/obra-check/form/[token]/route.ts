import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

import { obraCheckDb, logEvent } from '@/lib/obra-check/db';
import { notifyRequesterFormResponse } from '@/lib/obra-check/notify-requester';
import { listObraCheckPlanos, signedPlanoUrls } from '@/lib/obra-check/planos';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

function appOrigin(request: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

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
    .select('empresa, tipo_obra, email, metros_cuadrados')
    .eq('id', inv.session_id)
    .maybeSingle();

  const { data: block } = await db
    .from('obra_check_blocks')
    .select('nombre, rubro, budget_group_client_id')
    .eq('session_id', inv.session_id)
    .eq('client_id', inv.block_client_id)
    .maybeSingle();

  const blk = block as {
    nombre: string;
    rubro: string | null;
    budget_group_client_id: string | null;
  } | null;

  let blockIds = [inv.block_client_id];
  let bloqueNombre = blk?.nombre ?? 'Trabajo';
  let rubro = blk?.rubro ?? null;

  if (blk?.budget_group_client_id) {
    const { data: groupRow } = await db
      .from('obra_check_budget_groups')
      .select('nombre')
      .eq('session_id', inv.session_id)
      .eq('client_id', blk.budget_group_client_id)
      .maybeSingle();
    if (groupRow) bloqueNombre = (groupRow as { nombre: string }).nombre;

    const { data: groupBlocks } = await db
      .from('obra_check_blocks')
      .select('client_id')
      .eq('session_id', inv.session_id)
      .eq('budget_group_client_id', blk.budget_group_client_id);
    const ids = ((groupBlocks ?? []) as { client_id: string }[]).map((b) => b.client_id);
    if (ids.length > 0) blockIds = ids;
  }

  const { data: tareas } = await db
    .from('obra_check_tasks')
    .select('nombre, duracion_dias, orden, unidad, cantidad, client_id')
    .eq('session_id', inv.session_id)
    .in('block_client_id', blockIds)
    .order('orden', { ascending: true });

  const sess = session as {
    empresa: string | null;
    tipo_obra: string | null;
    email: string | null;
    metros_cuadrados: number | null;
  } | null;

  const planos = await listObraCheckPlanos(db, inv.session_id);
  const planosSigned = await signedPlanoUrls(planos, 60 * 60 * 24 * 7);

  return NextResponse.json({
    success: true,
    data: {
      tipo: inv.tipo,
      alreadyResponded: Boolean(inv.responded_at),
      bloqueNombre,
      rubro,
      empresa: sess?.empresa ?? null,
      tipoObra: sess?.tipo_obra ?? null,
      metrosCuadrados: sess?.metros_cuadrados ?? null,
      planos: planosSigned,
      tareas: ((tareas ?? []) as {
        nombre: string;
        duracion_dias: number | null;
        orden: number;
        unidad: string | null;
        cantidad: number | null;
        client_id: string;
      }[]).map((t) => ({
        id: t.client_id,
        nombre: t.nombre,
        duracionDias: t.duracion_dias,
        unidad: t.unidad ?? 'm2',
        cantidad: t.cantidad == null ? null : Number(t.cantidad),
      })),
    },
  });
}

const taskDetalleSchema = z.object({
  nombre: z.string(),
  included: z.boolean(),
  taskId: z.string().nullable().optional(),
  unidad: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  dias: z.number().nullable().optional(),
  precio: z.number().nullable().optional(),
  inicio: z.string().nullable().optional(),
  fin: z.string().nullable().optional(),
});

const submitSchema = z
  .object({
    telefono: z.string().max(40).optional().or(z.literal('')),
    email: z.string().email().max(160).optional().or(z.literal('')),
    detalle: z.array(taskDetalleSchema).min(1),
    aceptaContacto: z.boolean().default(true),
  })
  .refine((d) => {
    const tel = (d.telefono ?? '').replace(/[^\d+]/g, '');
    const mail = (d.email ?? '').trim();
    return tel.length >= 6 || mail.length > 0;
  }, { message: 'Indicá teléfono o email.' })
  .refine((d) => d.detalle.some((t) => t.included), { message: 'Marcá al menos una tarea.' });

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
    .select('id, session_id, block_client_id, contact_id, tipo, expires_at, responded_at')
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
    tipo: string;
    expires_at: string;
    responded_at: string | null;
  };

  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Este link expiró.' }, { status: 410 });
  }

  const telefono = (body.telefono ?? '').replace(/[^\d+]/g, '') || null;
  const email = body.email?.trim() || null;

  if (!telefono && !email) {
    return NextResponse.json({ success: false, error: 'Indicá teléfono o email.' }, { status: 400 });
  }

  const included = body.detalle.filter((t) => t.included);
  const mensaje =
    inv.tipo === 'pedido_presupuesto'
      ? included
          .map((t) => {
            const parts = [t.nombre];
            if (t.dias != null) parts.push(`${t.dias}d`);
            if (t.precio != null) parts.push(`$${t.precio}`);
            return parts.join(' · ');
          })
          .join(' | ')
      : included
          .map((t) => `${t.nombre}${t.inicio && t.fin ? ` (${t.inicio} → ${t.fin})` : ''}`)
          .join(' | ');

  const displayName = telefono ? `Contratista ${telefono.slice(-4)}` : email!.split('@')[0];
  const viewToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, 8);

  const { data: inserted, error: respErr } = await db
    .from('obra_check_form_responses')
    .insert({
      invite_id: inv.id,
      session_id: inv.session_id,
      nombre: displayName,
      telefono,
      email,
      rubro: null,
      empresa: null,
      mensaje: mensaje || null,
      detalle_json: body.detalle,
      acepta_contacto: body.aceptaContacto,
      view_token: viewToken,
    })
    .select('id, view_token')
    .single();

  if (respErr || !inserted) {
    return NextResponse.json({ success: false, error: 'No se pudo guardar.', detail: respErr?.message }, { status: 500 });
  }

  const responseId = (inserted as { id: string }).id;

  if (inv.contact_id && telefono) {
    await db
      .from('obra_check_contacts')
      .update({ telefono, nombre: displayName })
      .eq('id', inv.contact_id)
      .eq('session_id', inv.session_id);
  } else if (telefono) {
    const { data: created } = await db
      .from('obra_check_contacts')
      .insert({
        session_id: inv.session_id,
        nombre: displayName,
        telefono,
        rubro: null,
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
    telefono: Boolean(telefono),
    email: Boolean(email),
    tasksIncluded: included.length,
  });

  const { data: sessionRow } = await db
    .from('obra_check_sessions')
    .select('email, empresa, tipo_obra, metros_cuadrados, inbox_token')
    .eq('id', inv.session_id)
    .maybeSingle();
  const sess = sessionRow as {
    email: string | null;
    empresa: string | null;
    tipo_obra: string | null;
    metros_cuadrados: number | null;
    inbox_token: string | null;
  } | null;

  let grupoNombre = 'Presupuesto';
  const { data: blockRow } = await db
    .from('obra_check_blocks')
    .select('nombre, budget_group_client_id')
    .eq('session_id', inv.session_id)
    .eq('client_id', inv.block_client_id)
    .maybeSingle();
  const blk = blockRow as { nombre: string; budget_group_client_id: string | null } | null;
  if (blk?.budget_group_client_id) {
    const { data: g } = await db
      .from('obra_check_budget_groups')
      .select('nombre')
      .eq('session_id', inv.session_id)
      .eq('client_id', blk.budget_group_client_id)
      .maybeSingle();
    grupoNombre = (g as { nombre: string } | null)?.nombre ?? blk.nombre;
  } else if (blk) {
    grupoNombre = blk.nombre;
  }

  const origin = appOrigin(request);
  const viewUrl = `${origin}/obra-check/r/${viewToken}`;
  const inboxUrl = sess?.inbox_token ? `${origin}/obra-check/inbox/${sess.inbox_token}` : viewUrl;

  let emailedRequester = false;
  if (sess?.email) {
    const notify = await notifyRequesterFormResponse(db, inv.session_id, responseId, {
      sessionEmail: sess.email,
      empresa: sess.empresa,
      tipoObra: sess.tipo_obra,
      metrosCuadrados: sess.metros_cuadrados,
      grupoNombre,
      contratistaNombre: displayName,
      contratistaTelefono: telefono,
      contratistaEmail: email,
      tipo: inv.tipo,
      detalle: body.detalle,
      viewUrl,
      inboxUrl,
    });
    emailedRequester = notify.emailed;
  }

  return NextResponse.json({
    success: true,
    data: { ok: true, emailedRequester, viewUrl, inboxUrl },
  });
}
