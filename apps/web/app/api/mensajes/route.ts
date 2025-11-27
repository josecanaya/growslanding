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
    // obra_id y tarea_id fueron eliminados de la tabla mensajes

    if (!orgId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Faltan org_id o usuario_id' },
        { status: 400 },
      );
    }

    // Construir el query de búsqueda
    // Según los datos en Supabase:
    // - Cuando el cliente envía: remitente_id = usuarioId del cliente
    // - Cuando el socio envía al cliente: destinatario_id = org_id (no usuarioId)
    // Por lo tanto, necesitamos buscar mensajes donde:
    // - remitente_id = usuarioId (mensajes enviados por el usuario)
    // - destinatario_id = usuarioId O destinatario_id = orgId (mensajes recibidos por el usuario)
    
    let query = supabaseAny
      .from('mensajes')
      .select('*')
      .eq('org_id', orgId);
    
    // Construir condiciones OR para buscar mensajes donde el usuario participa
    // Si usuarioId y orgId son diferentes, buscar en ambos
    if (usuarioId !== orgId) {
      // Buscar: (remitente_id = usuarioId) OR (destinatario_id = usuarioId) OR (destinatario_id = orgId)
      query = query.or(
        `remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId},destinatario_id.eq.${orgId}`
      );
    } else {
      // Si son iguales, solo buscar por uno
      query = query.or(`remitente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`);
    }
    
    query = query.order('created_at', { ascending: true });

    // Nota: obra_id y tarea_id fueron eliminados de la tabla mensajes
    // Si se necesitan filtrar por obra o tarea, se debe hacer en el cliente

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
    
    // Solo agregar obra_id y tarea_id si existen en el body (para compatibilidad con código antiguo)
    // pero no los incluimos si la tabla no los tiene

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

