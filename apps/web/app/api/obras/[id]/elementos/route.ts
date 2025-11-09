import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras/[id]/elementos
 * Obtiene todos los elementos de una obra desde Supabase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await params;
    
    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Validar sesión
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar cliente de servicio para obtener elementos
    const supabase = createServiceSupabaseClient();

    // Verificar que la obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, name')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError) {
      console.error('[GET_ELEMENTOS] Error verificando obra:', obraError);
      return NextResponse.json(
        { success: false, error: 'Error al verificar obra' },
        { status: 500 }
      );
    }

    if (!obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    // Obtener elementos de la obra
    const { data: elementos, error: elementosError } = await supabase
      .from('elementos')
      .select('*')
      .eq('obra_id', obraId)
      .order('orden', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (elementosError) {
      console.error('[GET_ELEMENTOS] Error obteniendo elementos:', elementosError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener elementos', details: elementosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: elementos || [],
      count: elementos?.length || 0,
    }, { status: 200 });

  } catch (error) {
    console.error('[GET_ELEMENTOS] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/obras/[id]/elementos
 * Crea un nuevo elemento para una obra
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await params;
    const body = await request.json();

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Validar sesión
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Usar cliente de servicio
    const supabase = createServiceSupabaseClient();

    // Verificar que la obra existe
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError || !obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos para insertar
    const elementoData: any = {
      obra_id: obraId,
      nombre: body.nombre,
      categoria: body.categoria,
      unidad: body.unidad || 'unidad',
      cantidad: body.cantidad || 1,
    };

    // Campos opcionales
    if (body.subcategoria) elementoData.subcategoria = body.subcategoria;
    if (body.costo_unitario !== undefined) elementoData.costo_unitario = body.costo_unitario;
    if (body.duracion_estimada !== undefined) elementoData.duracion_estimada = body.duracion_estimada;
    if (body.orden !== undefined) elementoData.orden = body.orden;
    // ⚠️ planta_id no existe en la tabla elementos - comentado hasta que se agregue la columna
    // if (body.planta_id) elementoData.planta_id = body.planta_id;
    if (body.descripcion) elementoData.descripcion = body.descripcion;
    if (body.plantilla_elemento_id) elementoData.plantilla_elemento_id = body.plantilla_elemento_id;
    // ⚠️ etapa solo si existe en la BD
    // if (body.etapa) elementoData.etapa = body.etapa;

    // Insertar elemento
    const { data: elementoInsertado, error: insertError } = await supabase
      .from('elementos')
      .insert([elementoData])
      .select()
      .single();

    if (insertError) {
      console.error('[POST_ELEMENTOS] Error insertando:', insertError);
      return NextResponse.json(
        { success: false, error: 'Error al crear elemento', details: insertError.message },
        { status: 500 }
      );
    }

    // Autogenerar tareas si no se especifica crearTareas=false
    const url = new URL(request.url);
    const crearTareas = url.searchParams.get('crearTareas') !== 'false';

    console.log('[POST_ELEMENTOS] Elemento creado correctamente:', elementoInsertado.id);
    console.log('[POST_ELEMENTOS] Datos de autogeneración:', {
      crearTareas,
      elementoId: elementoInsertado.id,
      obraId: obraId,
      orgId: obra.org_id,
    });

    if (crearTareas && elementoInsertado) {
      try {
        console.log('[POST_ELEMENTOS] 🔧 Generando tareas automáticamente...');

        // Obtener el elemento completo
        const { data: elementoCompleto, error: elementoError } = await supabase
          .from('elementos')
          .select('*')
          .eq('id', elementoInsertado.id)
          .single();

        if (elementoError || !elementoCompleto) {
          console.error('[POST_ELEMENTOS] ❌ Error obteniendo elemento completo:', elementoError);
          throw elementoError || new Error('Elemento no encontrado');
        }

        console.log('[POST_ELEMENTOS] Elemento completo obtenido:', {
          id: elementoCompleto.id,
          nombre: elementoCompleto.nombre,
          categoria: elementoCompleto.categoria,
          obra_id: elementoCompleto.obra_id,
        });

        // Verificar que el elemento tiene obra_id
        if (!elementoCompleto.obra_id) {
          console.error('[POST_ELEMENTOS] ❌ Elemento no tiene obra_id, no se pueden generar tareas');
          throw new Error('Elemento sin obra_id');
        }

        // Verificar que la obra tiene org_id
        if (!obra.org_id) {
          console.error('[POST_ELEMENTOS] ❌ Obra no tiene org_id, no se pueden generar tareas');
          throw new Error('Obra sin org_id');
        }

        // Importar ExpansorElementos
        const { ExpansorElementos } = await import('@/lib/services/expansorElementos');

        // Preparar elemento para el expansor
        const elementoParaExpansor = {
          id: elementoCompleto.id,
          categoria: elementoCompleto.categoria || '',
          tipo: elementoCompleto.nombre || '',
          cantidad: elementoCompleto.cantidad || 1,
          unidad: (elementoCompleto.unidad || 'unidad') as 'm²' | 'm³' | 'unidad',
        };

        console.log('[POST_ELEMENTOS] Elemento preparado para expansor:', elementoParaExpansor);

        // Generar tareas
        const tareasGeneradas = ExpansorElementos.expandirElementos([elementoParaExpansor]);

        console.log('[POST_ELEMENTOS] 📦 Tareas generadas desde catálogo:', tareasGeneradas.length);
        if (tareasGeneradas.length > 0) {
          console.log('[POST_ELEMENTOS] Primeras 3 tareas generadas:', tareasGeneradas.slice(0, 3).map(t => ({
            nombre: t.nombre,
            fase: t.fase,
            tiempoEstimado: t.tiempoEstimado,
            fechaInicio: t.fechaInicio,
            fechaFin: t.fechaFin,
          })));
        } else {
          console.warn('[POST_ELEMENTOS] ⚠️  NO SE GENERARON TAREAS - El ExpansorElementos retornó array vacío');
          console.log('[POST_ELEMENTOS] Esto puede deberse a:');
          console.log('  1. Categoría no encontrada:', elementoParaExpansor.categoria);
          console.log('  2. Tipo no encontrado:', elementoParaExpansor.tipo);
          console.log('  3. Problema con el catálogo de elementos');
        }

        if (tareasGeneradas.length > 0) {
          // Verificar si ya existen tareas para este elemento (evitar duplicados)
          const { data: tareasExistentes, error: existentesError } = await supabase
            .from('tareas')
            .select('id, title, elemento_id')
            .eq('elemento_id', elementoCompleto.id);

          if (existentesError) {
            console.error('[POST_ELEMENTOS] ❌ Error obteniendo tareas existentes:', existentesError);
          }

          const existentesSet = new Set(
            (tareasExistentes || []).map((t) => `${t.title.toLowerCase()}-${t.elemento_id}`)
          );

          console.log('[POST_ELEMENTOS] Tareas existentes encontradas:', existentesSet.size);

          // Filtrar tareas que no existen
          const nuevasTareas = tareasGeneradas.filter(
            (t) => !existentesSet.has(`${t.nombre.toLowerCase()}-${elementoCompleto.id}`)
          );

          console.log('[POST_ELEMENTOS] 🧩 Tareas a insertar (nuevas):', nuevasTareas.length);

          if (nuevasTareas.length > 0) {
            // Usar fechas del ExpansorElementos o calcular si no están disponibles
            const fechaInicioBase = new Date();
            const tareasInsert = nuevasTareas.map((t, index) => {
              // Usar fechas del ExpansorElementos si están disponibles, sino calcular
              let fechaInicioEstimada: Date;
              let fechaFinEstimada: Date;
              
              if (t.fechaInicio && t.fechaFin) {
                fechaInicioEstimada = new Date(t.fechaInicio);
                fechaFinEstimada = new Date(t.fechaFin);
              } else {
                // Calcular basándose en tiempoEstimado
                fechaInicioEstimada = new Date(fechaInicioBase);
                fechaInicioEstimada.setDate(fechaInicioEstimada.getDate() + index * t.tiempoEstimado);
                fechaFinEstimada = new Date(fechaInicioEstimada);
                fechaFinEstimada.setDate(fechaFinEstimada.getDate() + t.tiempoEstimado);
              }

              return {
                org_id: obra.org_id,
                obra_id: elementoCompleto.obra_id,
                elemento_id: elementoCompleto.id,
                title: t.nombre,
                etapa: t.fase ?? null,
                descripcion: `${t.nombre} para ${elementoCompleto.nombre}`,
                estado: 'pendiente',
                prioridad: 'MEDIA',
                avance: 0,
                fecha_inicio_estimada: fechaInicioEstimada.toISOString(),
                fecha_fin_estimada: fechaFinEstimada.toISOString(),
              };
            });

            console.log('[POST_ELEMENTOS] Payload de inserción (primeras 3):', tareasInsert.slice(0, 3).map(t => ({
              org_id: t.org_id,
              obra_id: t.obra_id,
              elemento_id: t.elemento_id,
              title: t.title,
            })));

            const { data: tareasInsertadas, error: tareasError } = await supabase
              .from('tareas')
              .insert(tareasInsert)
              .select('id, title');

            if (tareasError) {
              console.error('[POST_ELEMENTOS] ❌ Error insertando tareas:', {
                message: tareasError.message,
                details: tareasError.details,
                hint: tareasError.hint,
                code: tareasError.code,
              });
              console.error('[POST_ELEMENTOS] Payload que falló (primer registro):', JSON.stringify(tareasInsert[0], null, 2));
              console.error('[POST_ELEMENTOS] Total registros a insertar:', tareasInsert.length);
              // No fallamos la creación del elemento si falla la creación de tareas
            } else {
              console.log('[POST_ELEMENTOS] ✅ Tareas insertadas correctamente:', tareasInsertadas?.length || 0);
              if (tareasInsertadas && tareasInsertadas.length > 0) {
                console.log('[POST_ELEMENTOS] IDs de tareas insertadas:', tareasInsertadas.map(t => t.id).slice(0, 5));
                console.log('[POST_ELEMENTOS] Títulos de tareas insertadas:', tareasInsertadas.map(t => t.title).slice(0, 5));
              } else {
                console.warn('[POST_ELEMENTOS] ⚠️  No se retornaron tareas insertadas en la respuesta de Supabase');
              }
            }
          } else {
            console.log('[POST_ELEMENTOS] ⚠️  No hay tareas nuevas para insertar (todas ya existen)');
          }
        } else {
          console.log('[POST_ELEMENTOS] ⚠️  No se generaron tareas desde el catálogo');
        }
      } catch (error) {
        console.error('[POST_ELEMENTOS] ❌ Error en autogeneración de tareas (no crítico):', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        // No fallamos la creación del elemento si falla la generación de tareas
      }
    } else {
      console.log('[POST_ELEMENTOS] ⏭️  Autogeneración de tareas deshabilitada (crearTareas=false o elementoInsertado es null)');
    }

    return NextResponse.json({
      success: true,
      data: elementoInsertado,
    }, { status: 201 });

  } catch (error) {
    console.error('[POST_ELEMENTOS] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

