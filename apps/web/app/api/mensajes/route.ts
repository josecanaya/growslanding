import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const orgId = request.headers.get('x-organizacion-id');
    const obraId = request.nextUrl.searchParams.get('obra_id');
    const tareaId = request.nextUrl.searchParams.get('tarea_id');
    const socioId = request.nextUrl.searchParams.get('socio_id');
    const clienteId = request.nextUrl.searchParams.get('cliente_id');

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Falta x-organizacion-id' }, { status: 400 });
    }

    let query = supabaseAny.from('mensajes').select('*').eq('org_id', orgId);

    if (obraId) {
      query = query.eq('obra_id', obraId);
    }

    if (tareaId) {
      query = query.eq('tarea_id', tareaId);
    }

    if (socioId) {
      query = query.or(`remitente_id.eq.${socioId},destinatario_id.eq.${socioId}`);
      console.log('[GET /api/mensajes] Filtrando por socio_id:', socioId);
    }

    if (clienteId) {
      query = query.or(`remitente_id.eq.${clienteId},destinatario_id.eq.${clienteId}`);
      console.log('[GET /api/mensajes] Filtrando por cliente_id:', clienteId);
    }

    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;
    
    console.log('[GET /api/mensajes] Resultado de la query:', { 
      dataLength: data?.length || 0, 
      error: error?.message || null,
      orgId,
      socioId,
      clienteId,
      obraId,
      tareaId
    });

    if (error) {
      console.error('[GET /api/mensajes] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[GET /api/mensajes] Excepción:', error);
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

    const { data, error } = await supabaseAny.from('mensajes').insert([body]).select();

    if (error) {
      console.error('[POST /api/mensajes] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[POST /api/mensajes] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}


