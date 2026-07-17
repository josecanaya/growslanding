import { NextResponse, type NextRequest } from 'next/server';

import { obraCheckDb } from '@/lib/obra-check/db';
import { listObraCheckPlanos, signedPlanoUrls } from '@/lib/obra-check/planos';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ token: string }> };

/**
 * GET /api/obra-check/respuesta/[token]
 * Vista pública (solo lectura) de la respuesta completa para el solicitante.
 */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return NextResponse.json({ success: false, error: 'Link inválido.' }, { status: 400 });
  }

  const db = obraCheckDb();
  const { data: resp } = await db
    .from('obra_check_form_responses')
    .select(
      'id, session_id, nombre, telefono, email, mensaje, detalle_json, created_at, invite_id, view_token',
    )
    .eq('view_token', token)
    .maybeSingle();

  if (!resp) {
    return NextResponse.json({ success: false, error: 'Esta respuesta no existe.' }, { status: 404 });
  }

  const r = resp as {
    id: string;
    session_id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    mensaje: string | null;
    detalle_json: unknown;
    created_at: string;
    invite_id: string;
  };

  const { data: session } = await db
    .from('obra_check_sessions')
    .select('empresa, tipo_obra, metros_cuadrados, email')
    .eq('id', r.session_id)
    .maybeSingle();

  const { data: invite } = await db
    .from('obra_check_invites')
    .select('tipo, block_client_id')
    .eq('id', r.invite_id)
    .maybeSingle();

  const inv = invite as { tipo: string; block_client_id: string } | null;
  let grupoNombre = 'Presupuesto';
  if (inv?.block_client_id) {
    const { data: block } = await db
      .from('obra_check_blocks')
      .select('nombre, budget_group_client_id')
      .eq('session_id', r.session_id)
      .eq('client_id', inv.block_client_id)
      .maybeSingle();
    const blk = block as { nombre: string; budget_group_client_id: string | null } | null;
    if (blk?.budget_group_client_id) {
      const { data: g } = await db
        .from('obra_check_budget_groups')
        .select('nombre')
        .eq('session_id', r.session_id)
        .eq('client_id', blk.budget_group_client_id)
        .maybeSingle();
      if (g) grupoNombre = (g as { nombre: string }).nombre;
      else grupoNombre = blk.nombre;
    } else if (blk) {
      grupoNombre = blk.nombre;
    }
  }

  const sess = session as {
    empresa: string | null;
    tipo_obra: string | null;
    metros_cuadrados: number | null;
    email: string | null;
  } | null;

  const planos = await listObraCheckPlanos(db, r.session_id);
  const planosSigned = await signedPlanoUrls(planos, 60 * 60 * 24);

  return NextResponse.json({
    success: true,
    data: {
      grupoNombre,
      tipo: inv?.tipo ?? 'pedido_presupuesto',
      metrosCuadrados: sess?.metros_cuadrados ?? null,
      tipoObra: sess?.tipo_obra ?? null,
      empresa: sess?.empresa ?? null,
      contratista: {
        nombre: r.nombre,
        telefono: r.telefono,
        email: r.email,
      },
      detalle: r.detalle_json,
      mensaje: r.mensaje,
      createdAt: r.created_at,
      planos: planosSigned,
    },
  });
}
