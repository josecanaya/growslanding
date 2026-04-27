import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveAllowedOrgIds(supabaseAny: any, userId: string): Promise<string[]> {
  const [orgClienteRows, orgSocioRows] = await Promise.all([
    supabaseAny.from('organizations').select('id').eq('user_id', userId),
    supabaseAny.from('socios').select('org_id').eq('user_id', userId),
  ]);

  const orgIds = new Set<string>([
    ...((orgClienteRows.data ?? []) as Array<{ id: string }>).map((o) => o.id),
    ...((orgSocioRows.data ?? []) as Array<{ org_id: string | null }>)
      .map((s) => s.org_id)
      .filter((orgId): orgId is string => Boolean(orgId)),
  ]);

  return Array.from(orgIds);
}

/**
 * GET /api/cliente/presupuestos?org_id=uuid (opcional)
 * Presupuestos de tareas (tareas_presupuestos) visibles para la org del usuario.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await resolveAllowedOrgIds(supabaseAny, user.id);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orgIdParam = request.nextUrl.searchParams.get('org_id');
    const orgId = orgIdParam && allowedOrgIds.includes(orgIdParam) ? orgIdParam : allowedOrgIds[0];

    const { data, error } = await supabase
      .from('tareas_presupuestos')
      .select(
        `
        id,
        monto,
        estado,
        created_at,
        updated_at,
        socio_id,
        tarea_id,
        tareas!inner (
          org_id,
          title,
          obra_id,
          obras ( id, name )
        ),
        socios ( id, nombre, email )
      `,
      )
      .eq('tareas.org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/cliente/presupuestos]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((p: any) => {
      const t = p.tareas;
      const obra = t?.obras;
      const socio = p.socios;
      return {
        id: p.id,
        monto: p.monto,
        estado: p.estado,
        createdAt: p.created_at,
        tareaId: p.tarea_id,
        tareaTitulo: t?.title ?? 'Tarea',
        obraId: t?.obra_id,
        obraNombre: obra?.name ?? 'Obra',
        cuadrilla: socio?.nombre || socio?.email || '—',
      };
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('[GET /api/cliente/presupuestos]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
