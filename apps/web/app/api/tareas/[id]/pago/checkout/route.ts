import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { EscrowService } from '@/lib/services/escrow.service';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const checkoutSchema = z.object({
  montoTotal: z.number().positive('El monto debe ser positivo'),
  moneda: z.string().optional().default('ARS'),
  adelantoPorcentaje: z.number().min(0).max(100).optional(),
});

/**
 * POST /api/tareas/[id]/pago/checkout
 * Crea un link de pago (checkout) para una tarea específica
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tareaId } = await params;
    const body = await request.json();
    
    // Validar body
    const validated = checkoutSchema.parse(body);
    
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

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener información de la tarea y validar permisos
    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select(`
        id,
        obra_id,
        org_id,
        title,
        obra:obras(id, org_id, name)
      `)
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tarea) {
      return NextResponse.json(
        { success: false, error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso a la obra/tarea
    // (Aquí podrías agregar validaciones más específicas según tus reglas)
    
    // Obtener presupuesto aprobado para obtener socio_id
    const { data: presupuesto, error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, socio_id')
      .eq('tarea_id', tareaId)
      .eq('estado', 'APROBADO')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (presupuestoError || !presupuesto || !presupuesto.socio_id) {
      return NextResponse.json(
        { success: false, error: 'No se encontró presupuesto aprobado para esta tarea' },
        { status: 400 }
      );
    }

    // Calcular monto total (si hay porcentaje de adelanto, aplicar)
    let montoFinal = validated.montoTotal;
    if (validated.adelantoPorcentaje) {
      montoFinal = validated.montoTotal * (validated.adelantoPorcentaje / 100);
    }

    // Obtener org_id desde la tarea o obra
    const orgId = tarea.org_id || tarea.obra?.org_id;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo determinar la organización' },
        { status: 400 }
      );
    }

    // Crear intento de pago en escrow
    const escrowResult = await EscrowService.crearIntentoPagoTarea({
      tareaId,
      socioId: presupuesto.socio_id,
      orgId,
      clienteId: user.id,
      montoTotal: montoFinal,
      moneda: validated.moneda,
      presupuestoId: presupuesto.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        escrowId: escrowResult.escrowId,
        checkoutUrl: escrowResult.checkoutUrl,
        mpPreferenceId: escrowResult.mpPreferenceId,
        montoTotal: montoFinal,
        moneda: validated.moneda,
      },
    });
  } catch (error) {
    console.error('[TAREA_CHECKOUT] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear checkout',
      },
      { status: 500 }
    );
  }
}












