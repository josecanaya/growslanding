import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/legajo/documentos?obraId=xxx&categoriaId=xxx
 * Obtiene documentos de una obra, opcionalmente filtrados por categoría
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');
    const categoriaId = searchParams.get('categoriaId');

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'obraId es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    let query = (supabase as any)
      .from('documentos_legajo')
      .select('*')
      .eq('obra_id', obraId);

    if (categoriaId) {
      query = query.eq('categoria', categoriaId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[LEGAJO] Error obteniendo documentos:', error);
      return NextResponse.json(
        { success: false, error: `Error al obtener documentos: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[LEGAJO] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

