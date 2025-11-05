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
    // MÉTODO PRINCIPAL: Usar tabla cuadrilla_socios (nueva relación explícita)
    // ============================================
    console.log('[SOCIOS_TAREAS] Buscando cuadrillas del socio usando tabla cuadrilla_socios:', {
      socio_id: socioId,
      socio_nombre: socio.nombre,
      socio_email: socio.email,
    });

    // 1️⃣ Obtener cuadrillas del socio desde tabla intermedia (FUENTE PRINCIPAL)
    const { data: relaciones, error: relacionesError } = await supabase
      .from('cuadrilla_socios')
      .select('cuadrilla_id, rol_en_cuadrilla')
      .eq('socio_id', socioId)
      .eq('activo', true);

    let cuadrillaIds: string[] = [];
    let cuadrillasRelacionadas: any[] = [];

    if (!relacionesError && relaciones && relaciones.length > 0) {
      cuadrillaIds = relaciones.map((r: any) => r.cuadrilla_id);
      
      // Obtener detalles de las cuadrillas
      const { data: cuadrillasData } = await supabase
        .from('cuadrillas')
        .select('id, nombre, encargado, email_encargado')
        .in('id', cuadrillaIds)
        .eq('org_id', organizacionId);
      
      cuadrillasRelacionadas = cuadrillasData || [];
      
      console.log('[SOCIOS_TAREAS] ✅ Cuadrillas encontradas por relación explícita:', {
        cantidad: cuadrillasRelacionadas.length,
        cuadrillas: cuadrillasRelacionadas.map(c => ({ id: c.id, nombre: c.nombre })),
        relaciones: relaciones.map((r: any) => ({ cuadrilla_id: r.cuadrilla_id, rol_en_cuadrilla: r.rol_en_cuadrilla })),
      });
    } else if (relacionesError) {
      console.warn('[SOCIOS_TAREAS] ⚠️ Error al buscar en cuadrilla_socios (puede que la tabla no exista aún):', relacionesError);
      // Continuar con fallback
    }

    // ============================================
    // FALLBACK: Buscar por encargado (compatibilidad con datos antiguos)
    // ============================================
    if (cuadrillaIds.length === 0) {
      console.log('[SOCIOS_TAREAS] No se encontraron cuadrillas por relación explícita, usando fallback por encargado');
      
      const contacto = socio.email || socio.telefono || '';
      const nombre = socio.nombre || '';

      // Construir consulta para cuadrillas
      let cuadrillasQuery = supabase
        .from('cuadrillas')
        .select('id, nombre, encargado, email_encargado, telefono_encargado')
        .eq('org_id', organizacionId);

      // Filtrar por encargado (puede ser nombre, email o teléfono)
      const condicionesCuadrilla: string[] = [];
      
      // Buscar por nombre del encargado (coincidencia parcial)
      if (nombre) {
        condicionesCuadrilla.push(`encargado.ilike.%${nombre}%`);
      }
      
      // Buscar por email del encargado (si existe el campo)
      if (socio.email) {
        condicionesCuadrilla.push(`email_encargado.eq.${socio.email}`);
      }
      
      // Buscar por teléfono del encargado (si existe el campo)
      if (socio.telefono) {
        condicionesCuadrilla.push(`telefono_encargado.eq.${socio.telefono}`);
      }
      
      // Buscar por contacto en el campo encargado (fallback)
      if (contacto) {
        condicionesCuadrilla.push(`encargado.ilike.%${contacto}%`);
      }

      let cuadrillas: any[] = [];
      let cuadrillasError: any = null;

      if (condicionesCuadrilla.length > 0) {
        const { data, error } = await cuadrillasQuery.or(condicionesCuadrilla.join(','));
        cuadrillas = data || [];
        cuadrillasError = error;
      } else {
        const { data, error } = await cuadrillasQuery;
        cuadrillas = data || [];
        cuadrillasError = error;
        
        // Filtrar manualmente si hay error en la query OR o si no se encontraron resultados
        if (!cuadrillasError && cuadrillas.length > 0) {
          cuadrillas = cuadrillas.filter(c => {
            const encargadoLower = (c.encargado || '').toLowerCase().trim();
            const nombreLower = nombre.toLowerCase().trim();
            const contactoLower = contacto.toLowerCase().trim();
            
            const nombrePrimeraPalabra = nombreLower.split(' ')[0];
            const encargadoPrimeraPalabra = encargadoLower.split(' ')[0];
            
            return (
              encargadoLower === nombreLower ||
              encargadoLower.includes(nombreLower) ||
              nombreLower.includes(encargadoLower) ||
              encargadoPrimeraPalabra === nombrePrimeraPalabra ||
              encargadoLower.includes(contactoLower) ||
              (socio.email && c.email_encargado === socio.email) ||
              (socio.telefono && c.telefono_encargado === socio.telefono)
            );
          });
        }
      }

      if (!cuadrillasError && cuadrillas.length > 0) {
        cuadrillaIds = cuadrillas.map(c => c.id);
        cuadrillasRelacionadas = cuadrillas;
        
        console.log('[SOCIOS_TAREAS] ✅ Cuadrillas encontradas por fallback (encargado):', {
          cantidad: cuadrillas.length,
          cuadrillas: cuadrillas.map(c => ({ id: c.id, nombre: c.nombre, encargado: c.encargado })),
        });
      } else if (cuadrillasError) {
        console.warn('[SOCIOS_TAREAS] ⚠️ Error en fallback por encargado:', cuadrillasError);
      }
    }

    // ============================================
    // Construir consulta de tareas
    // ============================================
    // Tareas donde:
    // 1. cuadrilla_id IN (cuadrillas del socio - de cuadrilla_socios o fallback por encargado)
    // 2. OR responsable = contacto del socio (email o teléfono) - compatibilidad
    // NOTA: No hay campo socio_id en la tabla tareas, solo cuadrilla_id y responsable

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
        cuadrilla_id,
        obra_id,
        elemento_id,
        created_at,
        updated_at,
        elemento:elementos(
          id,
          nombre,
          categoria,
          subcategoria
        ),
        obra:obras(
          id,
          name,
          address
        ),
        cuadrilla:cuadrillas(
          id,
          nombre,
          especialidad
        )
      `)
      .eq('org_id', organizacionId);

    // Construir filtros OR
    const filtros: string[] = [];

    // Filtro 1: Tareas de cuadrillas del socio (PRINCIPAL - desde cuadrilla_socios o fallback)
    if (cuadrillaIds.length > 0) {
      filtros.push(`cuadrilla_id.in.(${cuadrillaIds.join(',')})`);
      console.log('[SOCIOS_TAREAS] ✅ Filtro 1: Tareas de cuadrillas del socio:', {
        cuadrilla_ids: cuadrillaIds,
        cantidad: cuadrillaIds.length,
      });
    } else {
      console.warn('[SOCIOS_TAREAS] ⚠️ No se encontraron cuadrillas para el socio, buscando solo por responsable');
    }

    // Filtro 2: Tareas donde responsable = contacto del socio (COMPATIBILIDAD)
    // Este es importante porque cuando se asigna una tarea directamente, se actualiza el responsable
    const nombre = socio.nombre || '';
    if (socio.email) {
      filtros.push(`responsable.eq.${socio.email}`);
    }
    if (socio.telefono) {
      filtros.push(`responsable.eq.${socio.telefono}`);
    }
    // También buscar por nombre del socio en el responsable (por si acaso)
    if (nombre) {
      filtros.push(`responsable.ilike.%${nombre}%`);
    }
    
    console.log('[SOCIOS_TAREAS] Filtro 2: Responsable directo (compatibilidad):', {
      email: socio.email,
      telefono: socio.telefono,
      nombre: nombre,
    });

    // NOTA: No agregamos filtro por socio_id porque ese campo NO existe en la tabla tareas
    // Las tareas se asignan a socios a través de cuadrilla_id (principal) o responsable (fallback)
    
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
        message: 'No se encontraron tareas para este socio. Asegúrate de que el socio esté vinculado a una cuadrilla o tenga tareas asignadas directamente.',
        meta: {
          socio_id: socioId,
          cuadrillas_vinculadas: 0,
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
              cuadrilla_id,
              obra_id,
              elemento_id,
              created_at,
              updated_at,
              elemento:elementos(
                id,
                nombre,
                categoria,
                subcategoria
              ),
              obra:obras(
                id,
                name,
                address
              ),
              cuadrilla:cuadrillas(
                id,
                nombre,
                especialidad
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
              cuadrillas_encontradas: cuadrillaIds.length,
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
      cuadrillas_vinculadas: cuadrillaIds.length,
      cuadrilla_ids: cuadrillaIds,
      total_tareas: (tareas || []).length,
      metodo: cuadrillasRelacionadas.length > 0 ? 'cuadrilla_socios (explícito)' : 'fallback (encargado)',
      tareas_ejemplo: tareas?.slice(0, 3).map((t: any) => ({
        id: t.id,
        title: t.title,
        cuadrilla_id: t.cuadrilla_id,
        estado: t.estado,
      })),
    });

    return NextResponse.json({
      success: true,
      data: tareas || [],
      meta: {
        socio_id: socioId,
        socio_nombre: socio.nombre,
        cuadrillas_vinculadas: cuadrillaIds.length,
        cuadrilla_ids: cuadrillaIds,
        total_tareas: (tareas || []).length,
        metodo: cuadrillasRelacionadas.length > 0 ? 'cuadrilla_socios' : 'fallback_encargado',
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

