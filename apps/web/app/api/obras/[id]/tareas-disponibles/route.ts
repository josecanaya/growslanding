import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { mapearTareasAFases } from '@/lib/catalogos/elementos';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras/[id]/tareas-disponibles
 * Obtiene todas las tareas de elementos cargados en la obra, agrupadas por planta y fase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TAREAS_DISPONIBLES] Iniciando GET');
    const { id: obraId } = await params;
    console.log('[TAREAS_DISPONIBLES] obraId:', obraId);

    if (!obraId) {
      console.error('[TAREAS_DISPONIBLES] obraId no proporcionado');
      return NextResponse.json(
        { success: false, error: 'obraId es requerido' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
      console.log('[TAREAS_DISPONIBLES] Cliente Supabase creado');
    } catch (supabaseError) {
      console.error('[TAREAS_DISPONIBLES] Error creando cliente Supabase:', supabaseError);
      return NextResponse.json(
        { success: false, error: 'Error inicializando Supabase', details: supabaseError instanceof Error ? supabaseError.message : 'Error desconocido' },
        { status: 500 }
      );
    }

    // 1. Obtener elementos cargados en la obra
    // Nota: Si planta_id no existe en elementos, se puede obtener desde tareas o usar null
    const { data: elementos, error: elementosError } = await supabase
      .from('elementos')
      .select('id, nombre, cantidad, unidad')
      .eq('obra_id', obraId);

    if (elementosError) {
      console.error('[TAREAS_DISPONIBLES] Error obteniendo elementos:', elementosError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener elementos', details: elementosError.message },
        { status: 500 }
      );
    }

    console.log('[TAREAS_DISPONIBLES] Elementos encontrados:', elementos?.length || 0);

    if (!elementos || elementos.length === 0) {
      console.log('[TAREAS_DISPONIBLES] No hay elementos, retornando array vacío');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const elementoIds = elementos.map((el) => el.id);
    console.log('[TAREAS_DISPONIBLES] Elemento IDs:', elementoIds);

    // 2. Obtener tareas asociadas a estos elementos
    // Usar solo campos básicos que sabemos que existen
    let tareas: any[] = [];
    let tareasError: any = null;
    
    // Si no hay elementos, retornar array vacío
    if (elementoIds.length === 0) {
      console.log('[TAREAS_DISPONIBLES] No hay elementos, retornando array vacío de tareas');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    
    try {
      console.log('[TAREAS_DISPONIBLES] Ejecutando query de tareas...');
      // Query básica con campos esenciales
      const { data: tareasData, error: tareasErr } = await supabase
        .from('tareas')
        .select('id, title, descripcion, estado, elemento_id, obra_id')
        .eq('obra_id', obraId)
        .in('elemento_id', elementoIds);
      
      console.log('[TAREAS_DISPONIBLES] Resultado query básica:', {
        dataLength: tareasData?.length || 0,
        error: tareasErr,
      });
      
      tareas = tareasData || [];
      tareasError = tareasErr;
      
      if (tareasError) {
        console.error('[TAREAS_DISPONIBLES] Error en query básica:', tareasError);
        throw tareasError;
      }
      
      // Intentar obtener campos opcionales por separado si existen
      // Esto es más seguro que intentar todo de una vez
      if (tareas.length > 0) {
        const tareaIds = tareas.map(t => t.id);
        
        // Intentar obtener campos adicionales (pueden no existir)
        try {
          const { data: tareasExtras, error: extrasError } = await supabase
            .from('tareas')
            .select('id, etapa, prioridad, duracion_estimada, planta_id')
            .in('id', tareaIds);
          
          if (!extrasError && tareasExtras) {
            // Merge de campos adicionales
            const extrasMap = new Map(tareasExtras.map((t: any) => [t.id, t]));
            tareas = tareas.map((t: any) => ({
              ...t,
              etapa: extrasMap.get(t.id)?.etapa || null,
              prioridad: extrasMap.get(t.id)?.prioridad || null,
              duracion_estimada: extrasMap.get(t.id)?.duracion_estimada || null,
              planta_id: extrasMap.get(t.id)?.planta_id || null,
            }));
          } else if (extrasError) {
            // Si hay error, continuar sin campos adicionales
            console.warn('[TAREAS_DISPONIBLES] No se pudieron obtener campos adicionales (continuando):', extrasError?.message);
            // Asignar valores por defecto
            tareas = tareas.map((t: any) => ({
              ...t,
              etapa: null,
              prioridad: null,
              duracion_estimada: null,
              planta_id: null,
            }));
          }
        } catch (extrasError: any) {
          // Si falla, continuar sin campos adicionales
          console.warn('[TAREAS_DISPONIBLES] No se pudieron obtener campos adicionales (continuando):', extrasError?.message);
          // Asignar valores por defecto
          tareas = tareas.map((t: any) => ({
            ...t,
            etapa: null,
            prioridad: null,
            duracion_estimada: null,
            planta_id: null,
          }));
        }
      }
    } catch (err) {
      tareasError = err;
      console.error('[TAREAS_DISPONIBLES] Error capturado en try-catch:', err);
    }

    if (tareasError) {
      console.error('[TAREAS_DISPONIBLES] Error obteniendo tareas:', tareasError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener tareas', details: tareasError.message || String(tareasError) },
        { status: 500 }
      );
    }

    console.log('[TAREAS_DISPONIBLES] Tareas encontradas en Supabase:', tareas?.length || 0);
    
    // Validar que todas las tareas tienen elemento_id válido
    const tareasValidas = (tareas || []).filter(t => {
      const tieneElementoId = t.elemento_id && elementoIds.includes(t.elemento_id);
      if (!tieneElementoId) {
        console.warn('[TAREAS_DISPONIBLES] ⚠️ Tarea sin elemento_id válido:', {
          tareaId: t.id,
          title: t.title,
          elemento_id: t.elemento_id,
        });
      }
      return tieneElementoId;
    });
    
    console.log('[TAREAS_DISPONIBLES] Tareas válidas (con elemento_id válido):', tareasValidas.length);
    
    if (tareasValidas.length === 0) {
      console.log('[TAREAS_DISPONIBLES] No hay tareas válidas, retornando array vacío');
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 3. Obtener plantas para mapear planta_id a nombre
    // Las plantas están almacenadas en la obra como JSON, no en una tabla separada
    // Obtener la obra para acceder a las plantas
    let plantasMap: Record<string, { id: string; nombre: string }> = {};
    
    try {
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('plantas')
        .eq('id', obraId)
        .maybeSingle();

      if (!obraError && obra?.plantas) {
        // Las plantas pueden estar como array o como objeto
        let plantasArray: any[] = [];
        
        if (Array.isArray(obra.plantas)) {
          plantasArray = obra.plantas;
        } else if (typeof obra.plantas === 'object' && obra.plantas !== null) {
          // Si es un objeto, intentar extraer un array
          plantasArray = Object.values(obra.plantas).filter((p: any) => p && typeof p === 'object');
        }

        plantasArray.forEach((planta: any, index: number) => {
          // Generar ID consistente basado en orden o ID existente
          const orden = planta.orden !== undefined ? Number(planta.orden) : index + 1;
          const plantaId = planta.id || String(orden);
          const plantaNombre = planta.nombre || `Planta ${orden}`;
          
          // Mapear tanto por ID como por orden para mayor compatibilidad
          plantasMap[plantaId] = { id: plantaId, nombre: plantaNombre };
          plantasMap[String(orden)] = { id: plantaId, nombre: plantaNombre };
        });
      }
    } catch (err) {
      console.warn('[TAREAS_DISPONIBLES] Error al obtener plantas de la obra (continuando sin ellas):', err);
    }

    // 4. Crear mapa de elementos para acceso rápido
    const elementosMap = elementos.reduce((acc, elemento) => {
      acc[elemento.id] = {
        id: elemento.id,
        nombre: elemento.nombre,
        cantidad: elemento.cantidad || 0,
        unidad: elemento.unidad || 'unidad',
      };
      return acc;
    }, {} as Record<string, { id: string; nombre: string; cantidad: number; unidad: string }>);

    // 5. Agrupar tareas por nombre (normalizado) para evitar duplicados
    // Una tarea puede estar en múltiples elementos, pero solo debe aparecer una vez
    const tareasAgrupadasPorNombre = new Map<string, {
      nombre: string;
      tareasOriginales: any[];
      elementos: Array<{ id: string; nombre: string }>;
      plantas: Set<string>;
    }>();

    // Usar solo tareas válidas (con elemento_id válido)
    tareasValidas.forEach((tarea) => {
      const nombreTarea = (tarea.title || tarea.descripcion || '').trim();
      if (!nombreTarea) return; // Saltar tareas sin nombre

      // Normalizar nombre para agrupar (lowercase, sin espacios extra)
      const nombreNormalizado = nombreTarea.toLowerCase().trim();
      
      const elemento = elementosMap[tarea.elemento_id];
      const tareaPlantaId = tarea.planta_id || null;
      const planta = tareaPlantaId ? plantasMap[tareaPlantaId] : null;
      const plantaNombre = planta?.nombre || 'Sin planta asignada';

      if (!tareasAgrupadasPorNombre.has(nombreNormalizado)) {
        // Primera vez que vemos esta tarea
        tareasAgrupadasPorNombre.set(nombreNormalizado, {
          nombre: nombreTarea, // Usar el nombre original (no normalizado)
          tareasOriginales: [tarea],
          elementos: elemento ? [{ id: elemento.id, nombre: elemento.nombre }] : [],
          plantas: new Set([plantaNombre]),
        });
      } else {
        // Ya existe esta tarea, agregar elemento y planta
        const grupo = tareasAgrupadasPorNombre.get(nombreNormalizado)!;
        grupo.tareasOriginales.push(tarea);
        
        // Agregar elemento si no está ya en la lista
        if (elemento && !grupo.elementos.find(e => e.id === elemento.id)) {
          grupo.elementos.push({ id: elemento.id, nombre: elemento.nombre });
        }
        
        // Agregar planta
        grupo.plantas.add(plantaNombre);
      }
    });

    // 6. Convertir grupos a formato final, calculando fase desde el nombre
    const tareasEnriquecidas = Array.from(tareasAgrupadasPorNombre.values()).map((grupo) => {
      // Usar la primera tarea original como referencia
      const tareaRef = grupo.tareasOriginales[0];
      const tareaPlantaId = tareaRef.planta_id || null;
      const planta = tareaPlantaId ? plantasMap[tareaPlantaId] : null;

      // Calcular fase desde el nombre de la tarea
      const fasesCalculadas = mapearTareasAFases([grupo.nombre]);
      
      // Determinar la fase de la tarea
      let etapaCalculada = 'estructura'; // Por defecto
      if (fasesCalculadas.terminaciones.length > 0) {
        etapaCalculada = 'terminaciones';
      } else if (fasesCalculadas.obra_gris.length > 0) {
        etapaCalculada = 'obra_gris';
      } else if (fasesCalculadas.estructura.length > 0) {
        etapaCalculada = 'estructura';
      }

      // Si la tarea tiene etapa explícita, usarla; sino usar la calculada
      const etapaFinal = tareaRef.etapa || etapaCalculada;

      // Si hay múltiples plantas, usar la primera o "Sin planta asignada"
      const plantasArray = Array.from(grupo.plantas);
      const plantaFinal = plantasArray.length === 1 
        ? plantasArray[0] 
        : (plantasArray.find(p => p !== 'Sin planta asignada') || plantasArray[0] || 'Sin planta asignada');

      // Si hay múltiples elementos, mostrar todos separados por comas o el primero con contador
      const elementoPrincipal = grupo.elementos[0];
      let elementosTexto: string;
      if (grupo.elementos.length === 1) {
        elementosTexto = elementoPrincipal.nombre;
      } else if (grupo.elementos.length <= 3) {
        // Si hay 2-3 elementos, mostrarlos todos separados por comas
        elementosTexto = grupo.elementos.map(e => e.nombre).join(', ');
      } else {
        // Si hay más de 3, mostrar los primeros 2 y el contador
        elementosTexto = `${grupo.elementos.slice(0, 2).map(e => e.nombre).join(', ')} (+${grupo.elementos.length - 2} más)`;
      }

      console.log('[TAREAS_DISPONIBLES] Tarea agrupada:', grupo.nombre, '→ Elementos:', grupo.elementos.length, '→ Fase:', etapaFinal);

      const elementoCompleto = elementosMap[elementoPrincipal.id];
      
      return {
        id: tareaRef.id, // Usar ID de la primera tarea como identificador único
        nombre: grupo.nombre,
        descripcion: tareaRef.descripcion || null,
        estado: tareaRef.estado || 'pendiente',
        etapa: etapaFinal,
        prioridad: tareaRef.prioridad || 'Media',
        duracion_estimada: tareaRef.duracion_estimada || 2,
        elemento_id: elementoPrincipal.id, // ID del primer elemento
        obra_id: tareaRef.obra_id,
        elemento_nombre: elementosTexto, // Mostrar todos los elementos o el primero + contador
        elemento_cantidad: elementoCompleto?.cantidad || 0,
        elemento_unidad: elementoCompleto?.unidad || 'unidad',
        planta_id: tareaPlantaId,
        planta_nombre: plantaFinal,
        // Metadata adicional para debugging
        _elementos_count: grupo.elementos.length,
        _tareas_count: grupo.tareasOriginales.length,
      };
    });

    console.log('[TAREAS_DISPONIBLES] Tareas agrupadas (sin duplicados):', tareasEnriquecidas.length, 'de', tareas?.length || 0, 'tareas originales');
    
    const response = NextResponse.json({
      success: true,
      data: tareasEnriquecidas,
    });
    
    console.log('[TAREAS_DISPONIBLES] Respuesta preparada, status:', response.status);
    return response;
  } catch (error) {
    console.error('[TAREAS_DISPONIBLES] Error inesperado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[TAREAS_DISPONIBLES] Stack trace:', errorStack);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorStack ? errorStack.substring(0, 500) : undefined,
      },
      { status: 500 }
    );
  }
}

