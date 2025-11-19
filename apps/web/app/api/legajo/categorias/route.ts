import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/legajo/categorias
 * Obtiene todas las categorías de legajo ordenadas por orden
 */
export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();

    const { data, error } = await (supabase as any)
      .from('categorias_legajo')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      console.error('[LEGAJO] Error obteniendo categorías:', error);
      return NextResponse.json(
        { success: false, error: `Error al obtener categorías: ${error.message}` },
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

