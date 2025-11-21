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

    // Buscar en gaucho_memoria donde tipo = 'texto' (mensajes)
    // También buscar en mensajes por compatibilidad
    let query = supabaseAny.from('gaucho_memoria').select('*').eq('tipo', 'texto');

    if (obraId) {
      query = query.eq('obra_id', obraId);
    }

    if (tareaId) {
      query = query.eq('tarea_id', tareaId);
    }

    // Nota: gaucho_memoria tiene estructura diferente (contenido, tipo, leido)
    // Si necesitamos filtrar por socio/cliente, necesitaríamos mapear los IDs
    // Por ahora, traemos todos los mensajes de texto y los filtramos después si es necesario
    
    query = query.order('created_at', { ascending: true });

    const { data: gauchoData, error: gauchoError } = await query;
    
    // También intentar obtener de la tabla mensajes por compatibilidad
    let mensajesData: any[] = [];
    try {
      const mensajesQuery = supabaseAny.from('mensajes').select('*').eq('org_id', orgId);
      if (socioId) {
        mensajesQuery.or(`remitente_id.eq.${socioId},destinatario_id.eq.${socioId}`);
      }
      if (clienteId) {
        mensajesQuery.or(`remitente_id.eq.${clienteId},destinatario_id.eq.${clienteId}`);
      }
      const { data: mensajesDataResult } = await mensajesQuery.order('created_at', { ascending: true });
      mensajesData = mensajesDataResult || [];
    } catch (e) {
      // Si la tabla mensajes no existe, continuar solo con gaucho_memoria
      console.log('[GET /api/mensajes] Tabla mensajes no disponible, usando solo gaucho_memoria');
    }

    // Mapear datos de gaucho_memoria al formato esperado
    // gaucho_memoria tiene: id, contenido, tipo, leido, created_at
    // Como no tenemos remitente_id/destinatario_id en gaucho_memoria,
    // asumimos que si hay socioId en la query, los mensajes son del socio hacia el cliente
    // Si no hay socioId pero hay clienteId, son del cliente hacia el socio
    const gauchoMapeado = (gauchoData || []).map((item: any) => {
      // Determinar remitente y destinatario basado en quién está consultando
      let remitente_id = '';
      let remitente_tipo: 'socio' | 'cliente' = 'socio';
      let destinatario_id = '';
      let destinatario_tipo: 'socio' | 'cliente' = 'cliente';
      
      if (socioId) {
        // Si hay socioId, asumimos que los mensajes son del socio hacia el cliente
        remitente_id = socioId;
        remitente_tipo = 'socio';
        destinatario_id = clienteId || '';
        destinatario_tipo = 'cliente';
      } else if (clienteId) {
        // Si hay clienteId pero no socioId, son del cliente hacia el socio
        remitente_id = clienteId;
        remitente_tipo = 'cliente';
        destinatario_id = socioId || '';
        destinatario_tipo = 'socio';
      }
      
      return {
        id: item.id,
        contenido: item.contenido,
        remitente_tipo,
        remitente_id,
        destinatario_tipo,
        destinatario_id,
        obra_id: obraId || null,
        tarea_id: tareaId || null,
        created_at: item.created_at,
        leido: item.leido || false,
      };
    });

    // Combinar ambos resultados
    const data = [...mensajesData, ...gauchoMapeado];
    
    console.log('[GET /api/mensajes] Resultado de la query:', { 
      gauchoDataLength: gauchoData?.length || 0,
      mensajesDataLength: mensajesData.length,
      totalLength: data.length,
      error: gauchoError?.message || null,
      orgId,
      socioId,
      clienteId,
      obraId,
      tareaId
    });

    if (gauchoError) {
      console.error('[GET /api/mensajes] Error en gaucho_memoria:', gauchoError);
      // Si hay error en gaucho_memoria pero tenemos datos de mensajes, continuar
      if (mensajesData.length === 0) {
        return NextResponse.json({ success: false, error: gauchoError.message }, { status: 500 });
      }
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

    // Insertar en gaucho_memoria con tipo 'texto'
    const gauchoData = {
      contenido: body.contenido || body.mensaje || '',
      tipo: 'texto',
      leido: false,
    };

    const { data: gauchoInsert, error: gauchoError } = await supabaseAny
      .from('gaucho_memoria')
      .insert([gauchoData])
      .select();

    // También insertar en mensajes por compatibilidad si existe
    let mensajesInsert = null;
    try {
      const { data: mensajesData, error: mensajesError } = await supabaseAny
        .from('mensajes')
        .insert([body])
        .select();
      if (!mensajesError) {
        mensajesInsert = mensajesData;
      }
    } catch (e) {
      // Si la tabla mensajes no existe, continuar solo con gaucho_memoria
      console.log('[POST /api/mensajes] Tabla mensajes no disponible, usando solo gaucho_memoria');
    }

    if (gauchoError) {
      console.error('[POST /api/mensajes] Error en gaucho_memoria:', gauchoError);
      return NextResponse.json({ success: false, error: gauchoError.message }, { status: 500 });
    }

    // Retornar el dato insertado (preferir mensajes si existe, sino gaucho_memoria)
    const data = mensajesInsert || gauchoInsert;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[POST /api/mensajes] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}


