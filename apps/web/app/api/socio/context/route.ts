import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { inferOrgIdForSocio } from '@/lib/socios/inferOrgIdForSocio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/context
 * Perfil de socio para la sesión actual (evita RLS del cliente: usa service role tras auth).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user?.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const row = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });

    if (!row) {
      return NextResponse.json(
        { ok: false, socio: null, message: 'No encontramos tu perfil de socio vinculado a esta cuenta.' },
        { status: 404 },
      );
    }

    const inferred =
      row.org_id == null || row.org_id === '' ? await inferOrgIdForSocio(supabase, row.id) : null;
    const effective_org_id = row.org_id || inferred;

    const { data: perfilExtra } = await (supabase as any)
      .from('socios')
      .select('especialidad, telefono')
      .eq('id', row.id)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      socio: {
        id: row.id,
        org_id: row.org_id,
        effective_org_id: effective_org_id ?? null,
        email: row.email,
        nombre: row.nombre,
        especialidad: (perfilExtra?.especialidad as string | null) ?? null,
        telefono: (perfilExtra?.telefono as string | null) ?? null,
      },
    });
  } catch (e) {
    console.error('[GET /api/socio/context]', e);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
