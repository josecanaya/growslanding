import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallet/saldo
 * Devuelve saldo actual y saldo pendiente del usuario (socio o cliente/org)
 * Detecta automáticamente si es SOCIO u ORG según su registro
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { message: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Intentar obtener como socio primero
    const { data: socio, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, org_id')
      .or(`email.eq.${user.email},user_id.eq.${user.id}`)
      .maybeSingle();

    let ownerTipo: 'SOCIO' | 'ORG' | null = null;
    let ownerId: string | null = null;

    if (socio && !socioError) {
      // Es un socio
      ownerTipo = 'SOCIO';
      ownerId = socio.id;
    } else {
      // Intentar obtener como organización
      const { data: org, error: orgError } = await supabaseAny
        .from('organizaciones')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (org && !orgError) {
        ownerTipo = 'ORG';
        ownerId = org.id;
      } else if (socio?.org_id) {
        // Si no encontramos org directamente pero el socio tiene org_id, usar ese
        ownerTipo = 'ORG';
        ownerId = socio.org_id;
      }
    }

    if (!ownerTipo || !ownerId) {
      return NextResponse.json(
        {
          saldo_actual: 0,
          saldo_pendiente: 0,
          moneda: 'ARS',
        },
        { status: 200 }
      );
    }

    // Obtener o crear registro de saldo
    let { data: saldoData, error: saldoError } = await supabaseAny
      .from('wallet_saldos')
      .select('saldo_actual, saldo_pendiente')
      .eq('owner_tipo', ownerTipo)
      .eq('owner_id', ownerId)
      .maybeSingle();

    // Si no existe, crear registro en cero
    if (!saldoData || saldoError) {
      const { data: nuevoSaldo, error: insertError } = await supabaseAny
        .from('wallet_saldos')
        .insert({
          owner_tipo: ownerTipo,
          owner_id: ownerId,
          saldo_actual: 0,
          saldo_pendiente: 0,
          moneda: 'ARS',
        })
        .select('saldo_actual, saldo_pendiente')
        .single();

      if (insertError) {
        console.error('[WALLET_SALDO] Error creando saldo:', insertError);
        return NextResponse.json(
          {
            saldo_actual: 0,
            saldo_pendiente: 0,
            moneda: 'ARS',
          },
          { status: 200 }
        );
      }

      saldoData = nuevoSaldo;
    }

    return NextResponse.json({
      saldo_actual: saldoData.saldo_actual ?? 0,
      saldo_pendiente: saldoData.saldo_pendiente ?? 0,
      moneda: 'ARS',
    });
  } catch (error) {
    console.error('[WALLET_SALDO] Error:', error);
    return NextResponse.json(
      {
        message: 'Error al obtener saldo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

