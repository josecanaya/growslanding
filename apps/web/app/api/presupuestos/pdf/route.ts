import { NextRequest, NextResponse } from 'next/server';
import { uploadActaPdf } from '@/lib/storage';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type Payload = {
  obra_id: string;
  tarea_ids?: string[];
  etapa?: string | null;
  pdfBase64: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const tareaIdsParam = request.nextUrl.searchParams.get('tarea_ids');
    const obraId = request.nextUrl.searchParams.get('obra_id');

    console.log('[GET /api/presupuestos/pdf] Parámetros:', { tareaIdsParam, obraId });

    if (!tareaIdsParam && !obraId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere tarea_ids (comma) o obra_id' },
        { status: 400 },
      );
    }

    const tareaIds = (tareaIdsParam ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    console.log('[GET /api/presupuestos/pdf] Tarea IDs procesados:', tareaIds);

    // Obtener obra_id desde las tareas si no se proporcionó
    let obraIdFinal = obraId;
    if (!obraIdFinal && tareaIds.length > 0) {
      const { data: tareaData } = await supabaseAny
        .from('tareas')
        .select('obra_id')
        .eq('id', tareaIds[0])
        .maybeSingle();
      
      obraIdFinal = tareaData?.obra_id || null;
      console.log('[GET /api/presupuestos/pdf] Obra ID obtenida desde tarea:', obraIdFinal);
    }

    // Buscar eventos con PDF que contengan "presupuestos" en el path
    // El PDF se guarda como: actas/presupuestos/{obra_id}/{tarea_id}.pdf
    // Priorizar búsqueda por tarea_ids específicas para obtener el PDF correcto de la etapa
    let query = supabaseAny
      .from('eventos')
      .select('pdf_path, tarea_id, created_at, notas, id')
      .not('pdf_path', 'is', null)
      .like('pdf_path', '%presupuestos%');

    if (tareaIds.length > 0) {
      // PRIORIDAD 1: Buscar PDFs que correspondan específicamente a estas tareas
      // Esto asegura que obtenemos el PDF de la etapa correcta
      query = query.in('tarea_id', tareaIds);
      console.log('[GET /api/presupuestos/pdf] Buscando PDFs para tareas específicas:', tareaIds);
    } else if (obraIdFinal) {
      // PRIORIDAD 2: Si no hay tarea_ids, buscar por obra_id (menos específico)
      query = query.like('pdf_path', `%${obraIdFinal}%`);
      console.log('[GET /api/presupuestos/pdf] Buscando PDFs para obra:', obraIdFinal);
    } else {
      return NextResponse.json(
        { success: false, error: 'Se requiere obra_id o tarea_ids' },
        { status: 400 },
      );
    }

    // Ordenar después de aplicar filtros (más reciente primero)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    
    console.log('[GET /api/presupuestos/pdf] Query ejecutado, resultado:', {
      hasError: !!error,
      error: error?.message,
      dataLength: data?.length || 0,
      firstItem: data?.[0] || null,
    });
    
    if (error) {
      console.error('[GET /api/presupuestos/pdf] Error en query:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log('[GET /api/presupuestos/pdf] Eventos encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('[GET /api/presupuestos/pdf] Primer evento:', {
        tarea_id: data[0].tarea_id,
        pdf_path: data[0].pdf_path,
        notas: data[0].notas,
        created_at: data[0].created_at,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontró PDF de presupuesto para estas tareas',
      }, { status: 404 });
    }

    // Si hay múltiples PDFs, necesitamos encontrar el que mejor coincida con las tareas solicitadas
    // Los PDFs se guardan con el mismo pdf_path para todas las tareas del mismo lote
    // Agrupamos por pdf_path y contamos cuántas tareas de las solicitadas tiene cada PDF
    if (tareaIds.length > 0 && data.length > 1) {
      // Agrupar eventos por pdf_path
      const pdfsPorPath = new Map<string, { pdf_path: string; tarea_ids: Set<string>; created_at: string }>();
      
      data.forEach((evento: any) => {
        const path = evento.pdf_path;
        if (!pdfsPorPath.has(path)) {
          pdfsPorPath.set(path, {
            pdf_path: path,
            tarea_ids: new Set(),
            created_at: evento.created_at,
          });
        }
        pdfsPorPath.get(path)!.tarea_ids.add(evento.tarea_id);
      });

      // Encontrar el PDF que tenga más tareas en común con las solicitadas
      let mejorPdf: { pdf_path: string; tarea_ids: Set<string>; created_at: string } | null = null;
      let maxCoincidencias = 0;

      pdfsPorPath.forEach((pdfInfo) => {
        const coincidencias = Array.from(pdfInfo.tarea_ids).filter(tid => tareaIds.includes(tid)).length;
        if (coincidencias > maxCoincidencias) {
          maxCoincidencias = coincidencias;
          mejorPdf = pdfInfo;
        }
      });

      if (mejorPdf && maxCoincidencias > 0) {
        // Encontrar el evento correspondiente al mejor PDF
        const eventoMejorPdf = data.find((e: any) => e.pdf_path === mejorPdf!.pdf_path);
        if (eventoMejorPdf) {
          console.log('[GET /api/presupuestos/pdf] PDF seleccionado por coincidencias:', {
            pdf_path: eventoMejorPdf.pdf_path,
            tarea_id: eventoMejorPdf.tarea_id,
            coincidencias: maxCoincidencias,
            tareasSolicitadas: tareaIds.length,
          });
          
          return NextResponse.json({ 
            success: true, 
            pdf_path: eventoMejorPdf.pdf_path, 
            tarea_id: eventoMejorPdf.tarea_id 
          });
        }
      }
    }

    // Si no hay tarea_ids o no encontramos mejor coincidencia, devolver el más reciente
    const pdfMasReciente = data[0];
    
    console.log('[GET /api/presupuestos/pdf] PDF encontrado (más reciente):', {
      pdf_path: pdfMasReciente.pdf_path,
      tarea_id: pdfMasReciente.tarea_id,
      created_at: pdfMasReciente.created_at,
      totalEncontrados: data.length,
    });
    
    return NextResponse.json({ 
      success: true, 
      pdf_path: pdfMasReciente.pdf_path, 
      tarea_id: pdfMasReciente.tarea_id 
    });
  } catch (error: any) {
    console.error('[GET /api/presupuestos/pdf] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const { obra_id, tarea_ids = [], etapa, pdfBase64 } = body;

    if (!obra_id || !pdfBase64) {
      return NextResponse.json(
        { success: false, error: 'obra_id y pdfBase64 son obligatorios' },
        { status: 400 },
      );
    }

    const tareaPrincipal = tarea_ids[0];
    if (!tareaPrincipal) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos una tarea_id para registrar el PDF' },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener org_id para el evento y validar la tarea
    const { data: tareaData } = await supabaseAny
      .from('tareas')
      .select('id, org_id, obra_id')
      .eq('id', tareaPrincipal)
      .maybeSingle();

    const { data: obraData } = await supabaseAny
      .from('obras')
      .select('org_id')
      .eq('id', obra_id)
      .maybeSingle();

    const orgId = tareaData?.org_id ?? obraData?.org_id ?? null;
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo resolver org_id de la obra/tarea' },
        { status: 400 },
      );
    }

    // Decodificar base64 a bytes
    let pdfBytes: Uint8Array;
    try {
      const buffer = Buffer.from(pdfBase64, 'base64');
      pdfBytes = new Uint8Array(buffer);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'No se pudo decodificar el PDF' },
        { status: 400 },
      );
    }

    // Path en bucket actas (compatible con el modal del cliente)
    const path = `presupuestos/${obra_id}/${tareaPrincipal}.pdf`;

    // Subir a Storage
    const { path: storedPath } = await uploadActaPdf(pdfBytes, path);

    // Registrar en eventos (para que el modal lo encuentre)
    // Buscar eventos existentes con PDF para estas tareas
    const { data: existingEvents } = await supabaseAny
      .from('eventos')
      .select('id, tarea_id')
      .in('tarea_id', tarea_ids)
      .not('pdf_path', 'is', null)
      .order('created_at', { ascending: false });
    
    console.log('[POST /api/presupuestos/pdf] Eventos existentes encontrados:', existingEvents?.length || 0);

    // Crear un evento por cada tarea para que el GET pueda encontrarlos
    // La tabla eventos requiere: tarea_id, org_id (NOT NULL), pdf_path, actor_name, actor_role, actor_method, notas, etc.
    // IMPORTANTE: Ejecutar el SQL en sql/migracion_agregar_obra_id.sql para agregar obra_id a la tabla eventos
    const eventosPayload = tarea_ids.map((tareaId) => ({
      tarea_id: tareaId,
      org_id: orgId, // Requerido por la tabla (NOT NULL)
      obra_id: obra_id, // Agregar después de ejecutar la migración SQL
      pdf_path: storedPath, // Mismo PDF para todas las tareas
      actor_name: 'Sistema',
      actor_role: 'Socio',
      actor_method: 'login',
      notas: `PDF de presupuesto${etapa ? ` (${etapa})` : ''}`,
      checklist: null,
      has_nc: false,
      nuevo_estado: 'pendiente' as const,
      snapshot_json: null,
      created_at: new Date().toISOString(),
    }));

    console.log('[POST /api/presupuestos/pdf] Guardando eventos para tareas:', tarea_ids);
    console.log('[POST /api/presupuestos/pdf] PDF path:', storedPath);

    // Eliminar eventos existentes con PDF para estas tareas y crear nuevos
    if (existingEvents && existingEvents.length > 0) {
      const idsToDelete = existingEvents.map((e: any) => e.id);
      const { error: deleteError } = await supabaseAny
        .from('eventos')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.warn('[POST /api/presupuestos/pdf] Error eliminando eventos antiguos:', deleteError);
      } else {
        console.log('[POST /api/presupuestos/pdf] Eventos antiguos eliminados:', idsToDelete.length);
      }
    }

    const { error: insertError } = await supabaseAny
      .from('eventos')
      .insert(eventosPayload);

    if (insertError) {
      console.error('[POST /api/presupuestos/pdf] Error insertando eventos:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message || 'No se pudo registrar el PDF en eventos' },
        { status: 500 },
      );
    }

    console.log('[POST /api/presupuestos/pdf] Eventos guardados exitosamente para', tarea_ids.length, 'tareas');

    return NextResponse.json({ success: true, path: storedPath });
  } catch (error: any) {
    console.error('[POST /api/presupuestos/pdf] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
