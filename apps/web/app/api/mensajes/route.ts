import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

const REQUIRED_FIELDS = ['org_id', 'remitente_id', 'destinatario_id', 'contenido'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const orgId = request.headers.get('x-organizacion-id') ?? request.nextUrl.searchParams.get('org_id');
    const usuarioId =
      request.headers.get('x-usuario-id') ??
      request.nextUrl.searchParams.get('usuario_id') ??
      request.nextUrl.searchParams.get('socio_id') ??
      request.nextUrl.searchParams.get('cliente_id');
    const obraId = request.nextUrl.searchParams.get('obra_id');
    const destinatarioId = request.nextUrl.searchParams.get('destinatario_id');

    if (!orgId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Faltan org_id o usuario_id' },
        { status: 400 },
      );
    }

    // Construir el query de búsqueda
    // Si hay obra_id y destinatario_id, filtrar por esos campos (chat específico)
    // Si no, buscar todos los mensajes del usuario en la organización
    
    let query = supabaseAny
      .from('mensajes')
      .select('*')
      .eq('org_id', orgId);
    
    // Si hay obra_id, filtrar por obra
    if (obraId) {
      query = query.eq('obra_id', obraId);
    }

    // Si hay destinatario_id, filtrar conversación específica
    if (destinatarioId) {
      // Buscar mensajes donde:
      // - (remitente_id = usuarioId AND destinatario_id = destinatarioId) OR
      // - (remitente_id = destinatarioId AND destinatario_id = usuarioId)
      query = query.or(
        `and(remitente_id.eq.${usuarioId},destinatario_id.eq.${destinatarioId}),and(remitente_id.eq.${destinatarioId},destinatario_id.eq.${usuarioId})`
      );
    } else {
      // Buscar todos los mensajes donde el usuario participa
      if (usuarioId !== orgId) {
        query = query.or(
          `remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId},destinatario_id.eq.${orgId}`
        );
      } else {
        query = query.or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);
      }
    }
    
    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/mensajes] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
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

    // Validar campos requeridos
    const missing = REQUIRED_FIELDS.filter((field) => !body[field] || typeof body[field] !== 'string');
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Faltan campos: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const payload: Record<string, any> = {
      org_id: body.org_id,
      remitente_id: body.remitente_id,
      destinatario_id: body.destinatario_id,
      contenido: body.contenido ?? body.mensaje ?? '',
      tipo: body.tipo ?? 'chat',
      leido: body.leido ?? false,
      remitente_tipo: body.remitente_tipo ?? null,
      destinatario_tipo: body.destinatario_tipo ?? null,
    };
    
    // Agregar obra_id si existe en el body
    if (body.obra_id) {
      payload.obra_id = body.obra_id;
    }

    const { data, error } = await supabaseAny.from('mensajes').insert([payload]).select();

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

