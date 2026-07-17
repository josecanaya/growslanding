import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb } from '@/lib/obra-check/db';
import { listObraCheckPlanos, signedPlanoUrls } from '@/lib/obra-check/planos';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /api/obra-check/inbox/[token]
 * Bandeja permanente del arquitecto: todas las respuestas de la sesión.
 * Vive en una URL; el contratista no reenvía nada.
 */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ success: false, error: 'Link inválido.' }, { status: 400 });
  }

  const db = obraCheckDb();
  const { data: session } = await db
    .from('obra_check_sessions')
    .select('id, email, empresa, tipo_obra, inbox_token')
    .eq('inbox_token', token)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ success: false, error: 'Bandeja no encontrada.' }, { status: 404 });
  }

  const sess = session as {
    id: string;
    email: string | null;
    empresa: string | null;
    tipo_obra: string | null;
  };

  const { data: responses } = await db
    .from('obra_check_form_responses')
    .select(
      'id, nombre, telefono, email, mensaje, detalle_json, created_at, invite_id, view_token',
    )
    .eq('session_id', sess.id)
    .order('created_at', { ascending: false });

  const inviteIds = [
    ...new Set(((responses ?? []) as { invite_id: string }[]).map((r) => r.invite_id)),
  ];
  let inviteMeta: Record<string, { tipo: string; blockId: string }> = {};
  if (inviteIds.length > 0) {
    const { data: invites } = await db
      .from('obra_check_invites')
      .select('id, tipo, block_client_id')
      .in('id', inviteIds);
    inviteMeta = Object.fromEntries(
      ((invites ?? []) as { id: string; tipo: string; block_client_id: string }[]).map((i) => [
        i.id,
        { tipo: i.tipo, blockId: i.block_client_id },
      ]),
    );
  }

  const blockIds = [...new Set(Object.values(inviteMeta).map((m) => m.blockId))];
  const groupNameByBlock = new Map<string, string>();
  if (blockIds.length > 0) {
    const { data: blocks } = await db
      .from('obra_check_blocks')
      .select('client_id, nombre, budget_group_client_id')
      .eq('session_id', sess.id)
      .in('client_id', blockIds);
    for (const b of (blocks ?? []) as {
      client_id: string;
      nombre: string;
      budget_group_client_id: string | null;
    }[]) {
      if (b.budget_group_client_id) {
        const { data: g } = await db
          .from('obra_check_budget_groups')
          .select('nombre')
          .eq('session_id', sess.id)
          .eq('client_id', b.budget_group_client_id)
          .maybeSingle();
        groupNameByBlock.set(
          b.client_id,
          (g as { nombre: string } | null)?.nombre ?? b.nombre,
        );
      } else {
        groupNameByBlock.set(b.client_id, b.nombre);
      }
    }
  }

  const planos = await listObraCheckPlanos(db, sess.id);
  const planosSigned = await signedPlanoUrls(planos, 60 * 60 * 12);

  const items = ((responses ?? []) as Array<{
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    mensaje: string | null;
    detalle_json: unknown;
    created_at: string;
    invite_id: string;
    view_token: string | null;
  }>).map((r) => {
    const meta = inviteMeta[r.invite_id];
    return {
      id: r.id,
      contratista: r.nombre,
      telefono: r.telefono,
      email: r.email,
      mensaje: r.mensaje,
      detalle: r.detalle_json,
      createdAt: r.created_at,
      viewToken: r.view_token,
      tipo: meta?.tipo ?? 'pedido_presupuesto',
      grupoNombre: meta ? groupNameByBlock.get(meta.blockId) ?? 'Presupuesto' : 'Presupuesto',
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      email: sess.email,
      empresa: sess.empresa,
      tipoObra: sess.tipo_obra,
      planos: planosSigned,
      respuestas: items,
    },
  });
}

const unlockSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/obra-check/inbox/[token]/unlock — no usado con token; bandeja abierta por token.
 * POST /api/obra-check/inbox/unlock — busca bandejas por email (ver route hermana).
 */
export async function POST() {
  return NextResponse.json({ success: false, error: 'Usá /api/obra-check/inbox/unlock' }, { status: 400 });
}
