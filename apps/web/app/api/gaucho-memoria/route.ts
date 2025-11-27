import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

/**
 * Endpoint exclusivo para el chatbot de la landing.
 * No se mezcla con mensajes internos.
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAny = createServiceSupabaseClient() as any;
    const obraId = request.nextUrl.searchParams.get('obra_id');
    const tareaId = request.nextUrl.searchParams.get('tarea_id');

    let query = supabaseAny
      .from('gaucho_memoria')
      .select('*')
      .eq('tipo', 'texto')
      .order('created_at', { ascending: true });

    if (obraId) query = query.eq('obra_id', obraId);
    if (tareaId) query = query.eq('tarea_id', tareaId);

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/gaucho-memoria] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error('[GET /api/gaucho-memoria] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAny = createServiceSupabaseClient() as any;
    const body = await request.json();
    const payload = {
      contenido: body.contenido ?? body.mensaje ?? '',
      tipo: 'texto',
      leido: false,
      obra_id: body.obra_id ?? null,
      tarea_id: body.tarea_id ?? null,
      org_id: body.org_id ?? null,
    };

    const { data, error } = await supabaseAny.from('gaucho_memoria').insert([payload]).select();

    if (error) {
      console.error('[POST /api/gaucho-memoria] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[POST /api/gaucho-memoria] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
