/**
 * Utilidades para agrupar y normalizar tareas en el módulo Organiza
 */

import { tareasConstructivas, type TareaConstructiva } from '@/lib/tareas-construccion';

export type TareaDisponible = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  etapa: string;
  prioridad: string;
  duracion_estimada: number;
  elemento_id: string;
  obra_id: string;
  elemento_nombre: string;
  elemento_cantidad?: number;
  elemento_unidad?: string;
  planta_id: string | null;
  planta_nombre: string;
};

export type TareaAgrupada = {
  planta_id: string | null;
  planta_nombre: string;
  fases: {
    fase: string;
    fase_normalizada: 'estructura' | 'obra_gris' | 'terminaciones';
    tareas: TareaDisponible[];
  }[];
};

/**
 * Normaliza el nombre de una fase a los valores estándar
 */
export function normalizarFase(fase: string | null | undefined): 'estructura' | 'obra_gris' | 'terminaciones' {
  if (!fase) return 'estructura';
  
  const faseLower = fase.toLowerCase().trim();
  
  // Coincidencias exactas
  if (faseLower === 'terminaciones' || faseLower === 'terminacion') return 'terminaciones';
  if (faseLower === 'obra_gris' || faseLower === 'obra gris') return 'obra_gris';
  if (faseLower === 'estructura') return 'estructura';
  
  // Coincidencias parciales (priorizar terminaciones)
  if (faseLower.includes('terminacion') || faseLower.includes('termin')) return 'terminaciones';
  if ((faseLower.includes('obra') || faseLower.includes('gris')) && !faseLower.includes('estructura')) {
    return 'obra_gris';
  }
  if (faseLower.includes('estructura')) return 'estructura';
  
  // Por defecto
  return 'estructura';
}

/**
 * Obtiene el nombre legible de una fase
 */
export function obtenerNombreFase(fase: 'estructura' | 'obra_gris' | 'terminaciones'): string {
  const nombres: Record<'estructura' | 'obra_gris' | 'terminaciones', string> = {
    estructura: 'Estructura',
    obra_gris: 'Obra Gris',
    terminaciones: 'Terminaciones',
  };
  return nombres[fase];
}

/**
 * Agrupa tareas por planta y luego por fase
 */
export function agruparTareasPorPlanta(tareas: TareaDisponible[]): TareaAgrupada[] {
  // Agrupar por planta
  const porPlanta = new Map<string | null, TareaDisponible[]>();
  
  tareas.forEach((tarea) => {
    const plantaKey = tarea.planta_id || 'sin_planta';
    const plantaNombre = tarea.planta_nombre;
    
    if (!porPlanta.has(plantaKey)) {
      porPlanta.set(plantaKey, []);
    }
    porPlanta.get(plantaKey)!.push(tarea);
  });
  
  // Convertir a estructura final
  const resultado: TareaAgrupada[] = [];
  
  porPlanta.forEach((tareasPlanta, plantaKey) => {
    // Agrupar tareas por fase dentro de esta planta
    const porFase = new Map<'estructura' | 'obra_gris' | 'terminaciones', TareaDisponible[]>();
    
    tareasPlanta.forEach((tarea) => {
      const faseNormalizada = normalizarFase(tarea.etapa);
      
      if (!porFase.has(faseNormalizada)) {
        porFase.set(faseNormalizada, []);
      }
      porFase.get(faseNormalizada)!.push(tarea);
    });
    
    // Convertir fases a array
    const fases = Array.from(porFase.entries())
      .map(([faseNormalizada, tareasFase]) => ({
        fase: tareasFase[0]?.etapa || faseNormalizada,
        fase_normalizada: faseNormalizada,
        tareas: tareasFase,
      }))
      .sort((a, b) => {
        // Ordenar fases: estructura → obra_gris → terminaciones
        const orden: Record<'estructura' | 'obra_gris' | 'terminaciones', number> = {
          estructura: 0,
          obra_gris: 1,
          terminaciones: 2,
        };
        return orden[a.fase_normalizada] - orden[b.fase_normalizada];
      });
    
    // Obtener nombre de planta (usar el primero de las tareas)
    const plantaNombre = tareasPlanta[0]?.planta_nombre || 'Sin planta asignada';
    const plantaId = plantaKey === 'sin_planta' ? null : plantaKey;
    
    resultado.push({
      planta_id: plantaId,
      planta_nombre: plantaNombre,
      fases,
    });
  });
  
  // Ordenar plantas: primero "Sin planta asignada", luego por nombre
  resultado.sort((a, b) => {
    if (a.planta_nombre === 'Sin planta asignada' && b.planta_nombre !== 'Sin planta asignada') return 1;
    if (a.planta_nombre !== 'Sin planta asignada' && b.planta_nombre === 'Sin planta asignada') return -1;
    return a.planta_nombre.localeCompare(b.planta_nombre);
  });
  
  return resultado;
}

/**
 * Mapea una tarea con su elemento (helper para compatibilidad)
 */
export function mapearTareaConElemento(tarea: TareaDisponible): TareaDisponible & { elemento: { id: string; nombre: string } } {
  return {
    ...tarea,
    elemento: {
      id: tarea.elemento_id,
      nombre: tarea.elemento_nombre,
    },
  };
}

/**
 * Tipo para tarea consolidada por ID técnico
 */
export type TareaConsolidada = {
  id: string; // ID técnico de la tarea (ej: "REP001", "1RACA001")
  nombre: string;
  unidad: string;
  coef_operativo: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
  cantidad_total: number;
  duracion_calculada: number; // días = cantidad_total * coef_operativo / 8
  elementos_origen: Array<{
    elemento_id: string;
    elemento_nombre: string;
    cantidad: number;
    unidad: string;
  }>;
  ids_originales: string[]; // IDs de Supabase de las tareas originales (para agregar al lienzo)
};

export type TareaAgrupadaConsolidada = {
  planta_id: string | null;
  planta_nombre: string;
  fases: {
    fase: string;
    fase_normalizada: 'estructura' | 'obra_gris' | 'terminaciones';
    tareas: TareaConsolidada[];
  }[];
};

/**
 * Busca una tarea en el catálogo por nombre (coincidencia exacta o parcial)
 */
function buscarTareaEnCatalogo(nombreTarea: string): TareaConstructiva | null {
  const nombreNormalizado = nombreTarea.toLowerCase().trim();
  
  // Primero buscar coincidencia exacta
  const exacta = tareasConstructivas.find(
    (t) => t.nombre.toLowerCase().trim() === nombreNormalizado
  );
  if (exacta) return exacta;
  
  // Luego buscar coincidencia parcial (el nombre de la tarea contiene el nombre del catálogo o viceversa)
  const parcial = tareasConstructivas.find(
    (t) => {
      const nombreCatalogo = t.nombre.toLowerCase().trim();
      return nombreNormalizado.includes(nombreCatalogo) || nombreCatalogo.includes(nombreNormalizado);
    }
  );
  if (parcial) return parcial;
  
  return null;
}

/**
 * Agrupa tareas por ID técnico (consolida tareas iguales de diferentes elementos)
 * 
 * @param tareas Array de tareas disponibles
 * @returns Array de tareas consolidadas por ID técnico
 */
export function agruparTareasPorId(tareas: TareaDisponible[]): TareaConsolidada[] {
  // Mapa para agrupar por ID técnico de la tarea
  const porIdTecnico = new Map<string, {
    tareaCatalogo: TareaConstructiva;
    tareasOriginales: TareaDisponible[];
  }>();
  
  // Procesar cada tarea disponible
  tareas.forEach((tarea) => {
    // Buscar la tarea en el catálogo por nombre
    const tareaCatalogo = buscarTareaEnCatalogo(tarea.nombre);
    
    if (!tareaCatalogo) {
      // Si no se encuentra en el catálogo, crear una entrada con datos por defecto
      const idTecnico = `UNKNOWN_${tarea.id}`;
      if (!porIdTecnico.has(idTecnico)) {
        porIdTecnico.set(idTecnico, {
          tareaCatalogo: {
            id: idTecnico,
            nombre: tarea.nombre,
            unidad: tarea.elemento_unidad || 'unidad',
            coef_operativo: tarea.duracion_estimada || 1,
            fase: normalizarFase(tarea.etapa),
          },
          tareasOriginales: [],
        });
      }
      porIdTecnico.get(idTecnico)!.tareasOriginales.push(tarea);
      return;
    }
    
    // Agrupar por ID técnico de la tarea del catálogo
    const idTecnico = tareaCatalogo.id;
    
    if (!porIdTecnico.has(idTecnico)) {
      porIdTecnico.set(idTecnico, {
        tareaCatalogo,
        tareasOriginales: [],
      });
    }
    
    porIdTecnico.get(idTecnico)!.tareasOriginales.push(tarea);
  });
  
  // Convertir a array de tareas consolidadas
  const tareasConsolidadas: TareaConsolidada[] = [];
  
  porIdTecnico.forEach((grupo, idTecnico) => {
    const { tareaCatalogo, tareasOriginales } = grupo;
    
    // Calcular cantidad total sumando todas las cantidades de elementos
    const cantidadTotal = tareasOriginales.reduce((suma, tarea) => {
      const cantidad = tarea.elemento_cantidad || 0;
      return suma + cantidad;
    }, 0);
    
    // Calcular duración: coef_operativo * cantidad_total / 8 (horas por día)
    const HORAS_POR_DIA = 8;
    const duracionCalculada = Math.max(1, Math.ceil((tareaCatalogo.coef_operativo * cantidadTotal) / HORAS_POR_DIA));
    
    // Crear lista de elementos origen
    const elementosOrigen = tareasOriginales.map((tarea) => ({
      elemento_id: tarea.elemento_id,
      elemento_nombre: tarea.elemento_nombre,
      cantidad: tarea.elemento_cantidad || 0,
      unidad: tarea.elemento_unidad || 'unidad',
    }));
    
    // Obtener IDs originales de Supabase
    const idsOriginales = tareasOriginales.map((t) => t.id);
    
    tareasConsolidadas.push({
      id: idTecnico,
      nombre: tareaCatalogo.nombre,
      unidad: tareaCatalogo.unidad,
      coef_operativo: tareaCatalogo.coef_operativo,
      fase: tareaCatalogo.fase,
      cantidad_total: cantidadTotal,
      duracion_calculada: duracionCalculada,
      elementos_origen: elementosOrigen,
      ids_originales: idsOriginales,
    });
  });
  
  // Ordenar por fase y luego por nombre
  const ordenFase: Record<'estructura' | 'obra_gris' | 'terminaciones', number> = {
    estructura: 0,
    obra_gris: 1,
    terminaciones: 2,
  };
  
  tareasConsolidadas.sort((a, b) => {
    const ordenA = ordenFase[a.fase];
    const ordenB = ordenFase[b.fase];
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.nombre.localeCompare(b.nombre);
  });
  
  return tareasConsolidadas;
}

/**
 * Agrupa tareas consolidadas por planta y fase
 * Primero consolida por ID técnico, luego agrupa por planta y fase
 */
export function agruparTareasConsolidadasPorPlanta(tareas: TareaDisponible[]): TareaAgrupadaConsolidada[] {
  // Primero consolidar por ID técnico
  const tareasConsolidadas = agruparTareasPorId(tareas);
  
  // Crear un mapa de tareas por elemento para obtener la planta
  const tareasPorElemento = new Map<string, TareaDisponible[]>();
  tareas.forEach((tarea) => {
    if (!tareasPorElemento.has(tarea.elemento_id)) {
      tareasPorElemento.set(tarea.elemento_id, []);
    }
    tareasPorElemento.get(tarea.elemento_id)!.push(tarea);
  });
  
  // Agrupar tareas consolidadas por planta
  const porPlanta = new Map<string | null, TareaConsolidada[]>();
  
  tareasConsolidadas.forEach((tareaConsolidada) => {
    // Obtener la planta de los elementos origen (usar la primera)
    const primerElementoId = tareaConsolidada.elementos_origen[0]?.elemento_id;
    if (!primerElementoId) {
      // Sin elemento, usar 'sin_planta'
      const key = 'sin_planta';
      if (!porPlanta.has(key)) {
        porPlanta.set(key, []);
      }
      porPlanta.get(key)!.push(tareaConsolidada);
      return;
    }
    
    const tareasDelElemento = tareasPorElemento.get(primerElementoId) || [];
    const primeraTarea = tareasDelElemento[0];
    const plantaId = primeraTarea?.planta_id || null;
    const plantaKey = plantaId || 'sin_planta';
    
    if (!porPlanta.has(plantaKey)) {
      porPlanta.set(plantaKey, []);
    }
    porPlanta.get(plantaKey)!.push(tareaConsolidada);
  });
  
  // Convertir a estructura final
  const resultado: TareaAgrupadaConsolidada[] = [];
  
  porPlanta.forEach((tareasPlanta, plantaKey) => {
    // Agrupar tareas por fase dentro de esta planta
    const porFase = new Map<'estructura' | 'obra_gris' | 'terminaciones', TareaConsolidada[]>();
    
    tareasPlanta.forEach((tarea) => {
      const faseNormalizada = tarea.fase;
      
      if (!porFase.has(faseNormalizada)) {
        porFase.set(faseNormalizada, []);
      }
      porFase.get(faseNormalizada)!.push(tarea);
    });
    
    // Convertir fases a array
    const fases = Array.from(porFase.entries())
      .map(([faseNormalizada, tareasFase]) => ({
        fase: obtenerNombreFase(faseNormalizada),
        fase_normalizada: faseNormalizada,
        tareas: tareasFase,
      }))
      .sort((a, b) => {
        // Ordenar fases: estructura → obra_gris → terminaciones
        const orden: Record<'estructura' | 'obra_gris' | 'terminaciones', number> = {
          estructura: 0,
          obra_gris: 1,
          terminaciones: 2,
        };
        return orden[a.fase_normalizada] - orden[b.fase_normalizada];
      });
    
    // Obtener nombre de planta (usar la primera tarea consolidada)
    const primeraTareaConsolidada = tareasPlanta[0];
    const primerElementoId = primeraTareaConsolidada?.elementos_origen[0]?.elemento_id;
    const primeraTareaOriginal = primerElementoId ? tareas.find((t) => t.elemento_id === primerElementoId) : null;
    const plantaNombre = primeraTareaOriginal?.planta_nombre || 'Sin planta asignada';
    const plantaId = plantaKey === 'sin_planta' ? null : plantaKey;
    
    resultado.push({
      planta_id: plantaId,
      planta_nombre: plantaNombre,
      fases,
    });
  });
  
  // Ordenar plantas: primero "Sin planta asignada", luego por nombre
  resultado.sort((a, b) => {
    if (a.planta_nombre === 'Sin planta asignada' && b.planta_nombre !== 'Sin planta asignada') return 1;
    if (a.planta_nombre !== 'Sin planta asignada' && b.planta_nombre === 'Sin planta asignada') return -1;
    return a.planta_nombre.localeCompare(b.planta_nombre);
  });
  
  return resultado;
}

