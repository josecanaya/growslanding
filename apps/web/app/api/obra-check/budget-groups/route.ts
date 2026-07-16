import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, logEvent, touchSession } from '@/lib/obra-check/db';

export const dynamic = 'force-dynamic';

const groupSchema = z.object({
  id: z.string().min(1).max(120),
  nombre: z.string().min(1).max(200),
  blockIds: z.array(z.string().max(120)).default([]),
  orden: z.number().int().optional(),
});

const bodySchema = z.object({
  groups: z.array(groupSchema).max(100),
});

/** PUT /api/obra-check/budget-groups — reemplaza grupos y asigna paquetes (blocks). */
export async function PUT(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Grupos inválidos.', detail: (err as Error).message }, { status: 400 });
  }

  await db.from('obra_check_budget_groups').delete().eq('session_id', session.id);

  // Limpiar asignación previa de grupos en bloques.
  await db
    .from('obra_check_blocks')
    .update({ budget_group_client_id: null })
    .eq('session_id', session.id);

  if (parsed.groups.length > 0) {
    const { error } = await db.from('obra_check_budget_groups').insert(
      parsed.groups.map((g, i) => ({
        session_id: session.id,
        client_id: g.id,
        nombre: g.nombre.trim(),
        orden: g.orden ?? i,
      })),
    );
    if (error) {
      return NextResponse.json(
        { success: false, error: 'No se pudieron guardar los grupos.', detail: error.message },
        { status: 500 },
      );
    }

    for (const g of parsed.groups) {
      if (g.blockIds.length === 0) continue;
      await db
        .from('obra_check_blocks')
        .update({ budget_group_client_id: g.id })
        .eq('session_id', session.id)
        .in('client_id', g.blockIds);
    }
  }

  await touchSession(db, session.id);
  await logEvent(db, session.id, 'budget_groups_saved', { count: parsed.groups.length });

  return NextResponse.json({ success: true, data: { count: parsed.groups.length } });
}

/** GET /api/obra-check/budget-groups — lista grupos + blockIds de la sesión. */
export async function GET() {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data: groups, error } = await db
    .from('obra_check_budget_groups')
    .select('client_id, nombre, orden')
    .eq('session_id', session.id)
    .order('orden', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { data: blocks } = await db
    .from('obra_check_blocks')
    .select('client_id, budget_group_client_id')
    .eq('session_id', session.id);

  const blockIdsByGroup = new Map<string, string[]>();
  for (const b of (blocks ?? []) as { client_id: string; budget_group_client_id: string | null }[]) {
    if (!b.budget_group_client_id) continue;
    const arr = blockIdsByGroup.get(b.budget_group_client_id) ?? [];
    arr.push(b.client_id);
    blockIdsByGroup.set(b.budget_group_client_id, arr);
  }

  const result = ((groups ?? []) as { client_id: string; nombre: string; orden: number }[]).map((g) => ({
    id: g.client_id,
    nombre: g.nombre,
    blockIds: blockIdsByGroup.get(g.client_id) ?? [],
  }));

  return NextResponse.json({ success: true, data: result });
}
