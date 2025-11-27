import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const orgId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');
    const soloNoLeidas = request.nextUrl.searchParams.get('soloNoLeidas') === '1';

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Falta x-organizacion-id' }, { status: 400 });
    }

    if (!usuarioId) {
      return NextResponse.json({ success: false, error: 'Falta x-usuario-id' }, { status: 400 });
    }

    // Construir query base
    let query = supabaseAny
      .from('notificaciones')
      .select('*')
      .eq('org_id', orgId)
      .eq('destinatario_id', usuarioId);

    // Filtrar solo no leídas si se solicita
    if (soloNoLeidas) {
      query = query.eq('leida', false);
    }

    // Ordenar por fecha descendente (más recientes primero)
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/notificaciones] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('[GET /api/notificaciones] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const body = await request.json();

    const { data, error } = await supabaseAny.from('notificaciones').insert([body]).select();

    if (error) {
      console.error('[POST /api/notificaciones] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[POST /api/notificaciones] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
