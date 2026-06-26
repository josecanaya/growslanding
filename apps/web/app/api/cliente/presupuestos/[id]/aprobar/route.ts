import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { aprobarPresupuestoCliente } from '@/lib/services/cliente-aprobar-presupuesto.service';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/cliente/presupuestos/[id]/aprobar
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: presupuestoId } = await context.params;
    if (!presupuestoId) {
      return NextResponse.json({ success: false, error: 'Falta id de presupuesto' }, { status: 400 });
    }

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
    const result = await aprobarPresupuestoCliente(supabase as any, user, presupuestoId);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.httpStatus ?? 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[POST /api/cliente/presupuestos/[id]/aprobar]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
