import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: socioId } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Obtener socio y su información de contacto
    // Nota: Puede que algunos campos no existan, los manejamos con select parcial
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, email, telefono, rol')
      .eq('id', socioId)
      .eq('org_id', organizacionId)
      .single();

    if (socioError || !socio) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    // ============================================
    // ✅ NUEVO MÉTODO: Buscar tareas por responsable (email)
    // Las cuadrillas quedan obsoletas, las tareas se asignan directamente al socio
    // ============================================
    console.log('[SOCIOS_TAREAS] Buscando tareas por responsable:', {
      socio_id: socioId,
      socio_nombre: socio.nombre,
      socio_email: socio.email,
      socio_telefono: socio.telefono,
    });

    let tareasQuery = supabase
      .from('tareas')
      .select(`
        id,
        title,
        descripcion,
        estado,
        responsable,
        prioridad,
        avance,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        obra_id,
        elemento_id,
        created_at,
        updated_at,
        elemento:elementos(
          id,
          nombre,
          categoria,
          subcategoria,
          descripcion,
          unidad,
          cantidad
        ),
        obra:obras(
          id,
          name,
          address
        )
      `)
      .eq('org_id', organizacionId);

    // Construir filtros OR para buscar por responsable
    const filtros: string[] = [];

    // ✅ Buscar tareas donde responsable = email del socio (PRINCIPAL)
    if (socio.email) {
      filtros.push(`responsable.eq.${socio.email}`);
      console.log('[SOCIOS_TAREAS] ✅ Filtro por email:', socio.email);
    }
    
    // ✅ Buscar tareas donde responsable = teléfono del socio (si existe)
    if (socio.telefono) {
      filtros.push(`responsable.eq.${socio.telefono}`);
      console.log('[SOCIOS_TAREAS] ✅ Filtro por teléfono:', socio.telefono);
    }
    
    // ✅ Buscar por nombre del socio en el responsable (búsqueda parcial, por compatibilidad)
    const nombre = socio.nombre || '';
    if (nombre) {
      filtros.push(`responsable.ilike.%${nombre}%`);
      console.log('[SOCIOS_TAREAS] ✅ Filtro por nombre:', nombre);
    }

    // NOTA: Las tareas ahora se asignan directamente por responsable (email), no por cuadrilla
    // El campo cuadrilla_id está obsoleto y no se usa para filtrar tareas
    
    console.log('[SOCIOS_TAREAS] Total filtros:', filtros.length, 'Filtros:', filtros);

    // Aplicar filtros OR si hay alguno
    if (filtros.length > 0) {
      tareasQuery = tareasQuery.or(filtros.join(','));
    } else {
      // Si no hay filtros, retornar array vacío
      console.warn('[SOCIOS_TAREAS] ⚠️ No hay filtros para buscar tareas, retornando vacío');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No se encontraron tareas para este socio. Asegúrate de que el socio tenga tareas asignadas directamente por responsable (email).',
        meta: {
          socio_id: socioId,
          total_tareas: 0,
          metodo: 'ninguno',
        },
      });
    }

    // Ordenar por fecha de creación descendente
    const { data: tareas, error: tareasError } = await tareasQuery
      .order('created_at', { ascending: false });

    if (tareasError) {
      console.error('[ERROR_TAREAS_QUERY]', tareasError);
      
      // Si el error es por campo inexistente (socio_id), intentar sin ese filtro
      if (tareasError.message?.includes('socio_id') || tareasError.code === '42703') {
        const filtrosSinSocioId = filtros.filter(f => !f.includes('socio_id'));
        
        if (filtrosSinSocioId.length > 0) {
          const { data: tareasRetry, error: retryError } = await supabase
            .from('tareas')
            .select(`
              id,
              title,
              descripcion,
              estado,
              responsable,
              prioridad,
              avance,
              fecha_inicio_estimada,
              fecha_fin_estimada,
              fecha_inicio_real,
              fecha_fin_real,
              obra_id,
              elemento_id,
              created_at,
              updated_at,
              elemento:elementos(
                id,
                nombre,
                categoria,
                subcategoria,
                descripcion,
                unidad,
                cantidad
              ),
              obra:obras(
                id,
                name,
                address
              )
            `)
            .eq('org_id', organizacionId)
            .or(filtrosSinSocioId.join(','))
            .order('created_at', { ascending: false });

          if (retryError) {
            return NextResponse.json(
              { success: false, error: 'Error al obtener tareas', details: retryError.message },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            data: tareasRetry || [],
            meta: {
              socio_id: socioId,
              socio_nombre: socio.nombre,
              total_tareas: (tareasRetry || []).length,
            },
          });
        }
      }

      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas', details: tareasError.message },
        { status: 500 }
      );
    }

    console.log('[SOCIOS_TAREAS] ✅ Resultado final:', {
      socio_id: socioId,
      socio_nombre: socio.nombre,
      total_tareas: (tareas || []).length,
      metodo: 'responsable (email)',
      tareas_ejemplo: tareas?.slice(0, 3).map((t: any) => ({
        id: t.id,
        title: t.title,
        responsable: t.responsable,
        estado: t.estado,
      })),
    });

    return NextResponse.json({
      success: true,
      data: tareas || [],
      meta: {
        socio_id: socioId,
        socio_nombre: socio.nombre,
        total_tareas: (tareas || []).length,
        metodo: 'responsable (email)',
      },
    });
  } catch (error) {
    console.error('[ERROR_SOCIOS_TAREAS]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al obtener tareas',
      },
      { status: 500 }
    );
  }
}

