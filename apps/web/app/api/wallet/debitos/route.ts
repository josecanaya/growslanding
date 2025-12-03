import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const crearDebitoSchema = z.object({
  owner_tipo: z.enum(['SOCIO', 'ORG']),
  owner_id: z.string().uuid(),
  monto: z.number().positive(),
  concepto: z.string().min(1),
  tarea_id: z.string().uuid().optional(),
  presupuesto_id: z.string().uuid().optional(),
});

/**
 * POST /api/wallet/debitos
 * Crea un movimiento tipo DEBITO en wallet_movimientos
 * Actualiza automáticamente el saldo en wallet_saldos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = crearDebitoSchema.parse(body);

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
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Crear movimiento
    const { data: movimiento, error: movimientoError } = await supabaseAny
      .from('wallet_movimientos')
      .insert({
        owner_tipo: payload.owner_tipo,
        owner_id: payload.owner_id,
        tipo: 'DEBITO',
        monto: payload.monto,
        concepto: payload.concepto,
        tarea_id: payload.tarea_id ?? null,
        presupuesto_id: payload.presupuesto_id ?? null,
        estado: 'completado',
      })
      .select()
      .single();

    if (movimientoError) {
      console.error('[WALLET_DEBITOS] Error creando movimiento:', movimientoError);
      return NextResponse.json(
        {
          message: 'Error al crear débito',
          error: movimientoError.message,
        },
        { status: 500 }
      );
    }

    // Obtener o crear saldo
    let { data: saldoData, error: saldoError } = await supabaseAny
      .from('wallet_saldos')
      .select('id, saldo_actual, saldo_pendiente')
      .eq('owner_tipo', payload.owner_tipo)
      .eq('owner_id', payload.owner_id)
      .maybeSingle();

    if (!saldoData || saldoError) {
      // Crear saldo en cero si no existe
      const { data: nuevoSaldo, error: insertError } = await supabaseAny
        .from('wallet_saldos')
        .insert({
          owner_tipo: payload.owner_tipo,
          owner_id: payload.owner_id,
          saldo_actual: 0,
          saldo_pendiente: 0,
          moneda: 'ARS',
        })
        .select('id, saldo_actual, saldo_pendiente')
        .single();

      if (insertError) {
        console.error('[WALLET_DEBITOS] Error creando saldo:', insertError);
        // Continuar aunque falle, el movimiento ya se creó
      } else {
        saldoData = nuevoSaldo;
      }
    }

    // Actualizar saldo
    if (saldoData) {
      const nuevoSaldo = Math.max(0, (saldoData.saldo_actual ?? 0) - payload.monto);

      const { error: updateError } = await supabaseAny
        .from('wallet_saldos')
        .update({
          saldo_actual: nuevoSaldo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', saldoData.id);

      if (updateError) {
        console.error('[WALLET_DEBITOS] Error actualizando saldo:', updateError);
        // Continuar aunque falle, el movimiento ya se creó
      }
    }

    return NextResponse.json({
      success: true,
      movimiento,
    });
  } catch (error) {
    console.error('[WALLET_DEBITOS] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Error de validación',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Error al crear débito',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

