import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { aprobarPresupuestoCliente } from '@/lib/services/cliente-aprobar-presupuesto.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  presupuesto_ids: z.array(z.string().uuid()).min(1).max(200),
});

/**
 * POST /api/cliente/presupuestos/aprobar-paquete
 * Aprueba en lote los presupuestos de un paquete (mismo socio / obra).
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'presupuesto_ids inválido' },
        { status: 400 },
      );
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
    const supabaseAny = supabase as any;

    const ids = [...new Set(parsed.data.presupuesto_ids)];
    const aprobados: string[] = [];
    const omitidos: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      const result = await aprobarPresupuestoCliente(supabaseAny, user, id);
      if (result.ok) {
        aprobados.push(id);
      } else {
        omitidos.push({ id, error: result.error });
      }
    }

    if (aprobados.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: omitidos[0]?.error ?? 'No se pudo aprobar ningún presupuesto',
          omitidos,
        },
        { status: omitidos[0] ? 400 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      aprobados: aprobados.length,
      omitidos,
    });
  } catch (e) {
    console.error('[POST /api/cliente/presupuestos/aprobar-paquete]', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
