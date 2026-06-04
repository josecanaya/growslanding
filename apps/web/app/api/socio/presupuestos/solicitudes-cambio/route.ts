import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/presupuestos/solicitudes-cambio?presupuesto_id=uuid
 * Estado de solicitudes de cambio del socio (última por presupuesto).
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const presupuestoId = request.nextUrl.searchParams.get('presupuesto_id');
    if (!presupuestoId) {
      return NextResponse.json({ message: 'presupuesto_id requerido' }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const socio = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });
    if (!socio) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from('presupuesto_solicitudes_cambio')
      .select('id, estado, monto_actual, monto_propuesto, motivo, created_at, updated_at')
      .eq('presupuesto_id', presupuestoId)
      .eq('socio_id', socio.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const ultima = (data ?? [])[0] ?? null;
    return NextResponse.json({ solicitudes: data ?? [], ultima });
  } catch (e) {
    console.error('[GET socio solicitudes-cambio]', e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
