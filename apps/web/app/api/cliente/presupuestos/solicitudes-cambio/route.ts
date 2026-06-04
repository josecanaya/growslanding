import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import {
  listSolicitudesCambioPendientes,
  resolveClienteOwnerOrgIds,
} from '@/lib/services/presupuesto-solicitud-cambio.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/cliente/presupuestos/solicitudes-cambio?org_id=uuid
 * Solicitudes pendientes de revisión de monto (presupuesto ya aprobado).
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ownerOrgIds = await resolveClienteOwnerOrgIds(supabaseAny, user.id);

    if (ownerOrgIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orgIdParam = request.nextUrl.searchParams.get('org_id');
    const orgFilter =
      orgIdParam && ownerOrgIds.includes(orgIdParam) ? [orgIdParam] : ownerOrgIds;

    const data = await listSolicitudesCambioPendientes(supabaseAny, orgFilter);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('[GET solicitudes-cambio]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
