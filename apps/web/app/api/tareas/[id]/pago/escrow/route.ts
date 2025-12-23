import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { EscrowService } from '@/lib/services/escrow.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/tareas/[id]/pago/escrow
 * Obtiene el estado de escrow de una tarea
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tareaId } = await params;

    // Autenticación
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
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener estado de escrow
    const escrow = await EscrowService.obtenerEstadoEscrowTarea(tareaId);

    if (!escrow) {
      return NextResponse.json({
        success: true,
        data: {
          tieneEscrow: false,
          estado: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        tieneEscrow: true,
        estado: escrow.estado,
        montoTotal: escrow.monto_total,
        montoComision: escrow.monto_comision,
        montoSocio: escrow.monto_socio,
        moneda: escrow.moneda,
        fechaDeposito: escrow.fecha_deposito,
        fechaLiberacion: escrow.fecha_liberacion,
        mpPreferenceId: escrow.mp_preference_id,
        mpPaymentId: escrow.mp_payment_id,
        mpStatus: escrow.mp_status,
      },
    });
  } catch (error) {
    console.error('[TAREA_ESCROW] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener estado de escrow',
      },
      { status: 500 }
    );
  }
}












