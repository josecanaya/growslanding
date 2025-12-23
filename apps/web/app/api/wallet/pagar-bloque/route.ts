import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { WalletMvpService } from '@/lib/services/wallet-mvp.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { PermisoService } from '@/lib/services/permiso.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subtareaId = body?.subtareaId as string | undefined;
    const metodoPago = body?.metodoPago === 'ONLINE' ? 'ONLINE' : 'EFECTIVO';

    if (!subtareaId) {
      return NextResponse.json(
        { message: 'subtareaId requerido' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, tareas:tareas(org_id)')
      .eq('id', subtareaId)
      .maybeSingle();

    if (!subtarea?.tareas?.org_id) {
      return NextResponse.json(
        { message: 'Subtarea o tarea asociada no encontrada' },
        { status: 404 },
      );
    }

    const rol = await PermisoService.obtenerRolEnOrganizacion(
      user.id,
      subtarea.tareas.org_id,
    );

    if (rol !== 'CLIENTE') {
      return NextResponse.json(
        { message: 'Solo el cliente puede registrar pagos manuales' },
        { status: 403 },
      );
    }

    await WalletMvpService.registrarPagoPorBloque(subtareaId, metodoPago);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WALLET_PAGAR_BLOQUE] Error:', error);
    return NextResponse.json(
      {
        message: 'No se pudo registrar el pago del bloque',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    );
  }
}

