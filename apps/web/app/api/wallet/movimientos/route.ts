import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/wallet/movimientos?limit=50&offset=0
 * Devuelve lista de movimientos de wallet_movimientos del usuario
 * Ordenados por created_at desc
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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
        ownerTipo = 'ORG';
        ownerId = socio.org_id;
      }
    }

    if (!ownerTipo || !ownerId) {
      return NextResponse.json({
        movimientos: [],
        total: 0,
        paginacion: {
          limit,
          offset,
          hasMore: false,
        },
      });
    }

    // Obtener movimientos
    const { data: movimientos, error: movimientosError } = await supabaseAny
      .from('wallet_movimientos')
      .select('*', { count: 'exact' })
      .eq('owner_tipo', ownerTipo)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (movimientosError) {
      console.error('[WALLET_MOVIMIENTOS] Error obteniendo movimientos:', movimientosError);
      return NextResponse.json(
        {
          message: 'Error al obtener movimientos',
          error: movimientosError.message,
        },
        { status: 500 }
      );
    }

    // Obtener total de registros
    const { count, error: countError } = await supabaseAny
      .from('wallet_movimientos')
      .select('*', { count: 'exact', head: true })
      .eq('owner_tipo', ownerTipo)
      .eq('owner_id', ownerId);

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      movimientos: movimientos || [],
      total,
      paginacion: {
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[WALLET_MOVIMIENTOS] Error:', error);
    return NextResponse.json(
      {
        message: 'Error al obtener movimientos',
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

