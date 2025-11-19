/**
 * Utilidades para calcular CPM (Critical Path Method)
 * Calcula Early Start, Early Finish, Late Start, Late Finish, Float y camino crítico
 */

export interface TareaCPM {
  id: string;
  name: string;
  duration: number;
  predecessors: string[]; // IDs de tareas previas
}

export interface TareaCPMResultado extends TareaCPM {
  es: number; // Early Start
  ef: number; // Early Finish
  ls: number; // Late Start
  lf: number; // Late Finish
  float: number; // Holgura total (float_total = LS - ES)
  float_free: number; // Holgura libre (min(ES de sucesoras) - EF)
  isCritical: boolean; // Si float === 0
}

export interface CPMResultado {
  tareas: TareaCPMResultado[];
  project_duration: number; // Duración total del proyecto (max EF de tareas críticas)
  critical_count: number; // Cantidad de tareas en camino crítico
}

/**
 * Calcula el Forward Pass (ES y EF)
 * ES de una tarea = max(EF de todas sus predecesoras)
 * EF = ES + duration
 * Si no tiene predecesoras → ES = 0
 */
export function calcularForwardPass(tareas: TareaCPM[]): Map<string, { es: number; ef: number }> {
  const resultados = new Map<string, { es: number; ef: number }>();
  const tareasMap = new Map(tareas.map((t) => [t.id, t]));
  const procesadas = new Set<string>();

  // Función recursiva para calcular ES y EF
  function calcularESEF(tareaId: string): { es: number; ef: number } {
    // Si ya fue procesada, retornar resultado
    if (resultados.has(tareaId)) {
      return resultados.get(tareaId)!;
    }

    const tarea = tareasMap.get(tareaId);
    if (!tarea) {
      // Si la tarea no existe (fue borrada), retornar valores por defecto
      console.warn(`[CPM] Tarea ${tareaId} no encontrada en forward pass, usando valores por defecto`);
      return { es: 0, ef: 0 };
    }

    // Si ya está siendo procesada, hay un ciclo
    if (procesadas.has(tareaId)) {
      throw new Error(`Ciclo detectado en la tarea ${tareaId}`);
    }

    procesadas.add(tareaId);

    // Si no tiene predecesoras, ES = 0
    if (tarea.predecessors.length === 0) {
      const es = 0;
      const ef = es + tarea.duration;
      resultados.set(tareaId, { es, ef });
      procesadas.delete(tareaId);
      return { es, ef };
    }

    // Calcular ES = max(EF de todas las predecesoras)
    // Filtrar predecesoras que no existen
    const predecesorasValidas = tarea.predecessors.filter((predId) => tareasMap.has(predId));
    
    let maxEF = -1;
    for (const predId of predecesorasValidas) {
      const predResult = calcularESEF(predId);
      if (predResult.ef > maxEF) {
        maxEF = predResult.ef;
      }
    }
    
    // Si no hay predecesoras válidas, ES = 0
    if (predecesorasValidas.length === 0 && tarea.predecessors.length > 0) {
      console.warn(`[CPM] Tarea ${tareaId} tiene predecesoras que no existen, usando ES = 0`);
    }

    const es = maxEF;
    const ef = es + tarea.duration;
    resultados.set(tareaId, { es, ef });
    procesadas.delete(tareaId);
    return { es, ef };
  }

  // Calcular para todas las tareas
  for (const tarea of tareas) {
    if (!resultados.has(tarea.id)) {
      calcularESEF(tarea.id);
    }
  }

  return resultados;
}

/**
 * Calcula el Backward Pass (LS y LF)
 * LF final = EF_max del proyecto
 * LS = LF - duration
 * LF = min(LS de todas sus sucesoras)
 */
export function calcularBackwardPass(
  tareas: TareaCPM[],
  forwardResults: Map<string, { es: number; ef: number }>,
): Map<string, { ls: number; lf: number }> {
  const resultados = new Map<string, { ls: number; lf: number }>();
  const tareasMap = new Map(tareas.map((t) => [t.id, t]));

  // Crear mapa de sucesoras (tareas que tienen esta como predecesora)
  // Solo considerar predecesoras que existen en el conjunto de tareas
  const tareaIds = new Set(tareas.map((t) => t.id));
  const sucesoras = new Map<string, string[]>();
  for (const tarea of tareas) {
    sucesoras.set(tarea.id, []);
  }
  for (const tarea of tareas) {
    for (const predId of tarea.predecessors) {
      // Solo agregar si la predecesora existe en el conjunto de tareas
      if (tareaIds.has(predId)) {
        const predSucesoras = sucesoras.get(predId) || [];
        predSucesoras.push(tarea.id);
        sucesoras.set(predId, predSucesoras);
      }
    }
  }

  // Encontrar EF máximo (proyecto completo)
  let efMax = 0;
  for (const [, result] of forwardResults) {
    if (result.ef > efMax) {
      efMax = result.ef;
    }
  }

  // Función recursiva para calcular LS y LF
  function calcularLSLF(tareaId: string): { ls: number; lf: number } {
    // Si ya fue procesada, retornar resultado
    if (resultados.has(tareaId)) {
      return resultados.get(tareaId)!;
    }

    const tarea = tareasMap.get(tareaId);
    if (!tarea) {
      // Si la tarea no existe (fue borrada), retornar valores por defecto
      console.warn(`[CPM] Tarea ${tareaId} no encontrada en backward pass, usando valores por defecto`);
      return { ls: 0, lf: 0 };
    }

    const tareaSucesoras = sucesoras.get(tareaId) || [];

    // Si no tiene sucesoras, es una tarea final
    if (tareaSucesoras.length === 0) {
      const lf = efMax;
      const ls = lf - tarea.duration;
      resultados.set(tareaId, { ls, lf });
      return { ls, lf };
    }

    // Calcular LS de todas las sucesoras primero
    let minLS = Infinity;
    for (const sucId of tareaSucesoras) {
      const sucResult = calcularLSLF(sucId);
      if (sucResult.ls < minLS) {
        minLS = sucResult.ls;
      }
    }

    // LF = min(LS de todas las sucesoras)
    const lf = minLS;
    const ls = lf - tarea.duration;
    resultados.set(tareaId, { ls, lf });
    return { ls, lf };
  }

  // Calcular para todas las tareas (empezar por las finales)
  // Ordenar por EF descendente para procesar las finales primero
  const tareasOrdenadas = [...tareas].sort((a, b) => {
    const efA = forwardResults.get(a.id)?.ef || 0;
    const efB = forwardResults.get(b.id)?.ef || 0;
    return efB - efA;
  });

  for (const tarea of tareasOrdenadas) {
    if (!resultados.has(tarea.id)) {
      calcularLSLF(tarea.id);
    }
  }

  return resultados;
}

/**
 * Calcula el CPM completo para un conjunto de tareas
 * Retorna las tareas con todos los valores CPM calculados, duración del proyecto y cantidad de críticas
 */
export function calcularCPM(tareas: TareaCPM[]): CPMResultado {
  if (tareas.length === 0) {
    return {
      tareas: [],
      project_duration: 0,
      critical_count: 0,
    };
  }

  // Validar que todas las predecesoras existan
  const tareaIds = new Set(tareas.map((t) => t.id));
  for (const tarea of tareas) {
    for (const predId of tarea.predecessors) {
      if (!tareaIds.has(predId)) {
        console.warn(`[CPM] Predecesora ${predId} de tarea ${tarea.id} no existe en el conjunto de tareas`);
      }
    }
  }

  // Calcular Forward Pass
  const forwardResults = calcularForwardPass(tareas);

  // Calcular Backward Pass
  const backwardResults = calcularBackwardPass(tareas, forwardResults);

  // Crear mapa de sucesoras para calcular float_free
  const tareaIdsSet = new Set(tareas.map((t) => t.id));
  const sucesoras = new Map<string, string[]>();
  for (const tarea of tareas) {
    sucesoras.set(tarea.id, []);
  }
  for (const tarea of tareas) {
    for (const predId of tarea.predecessors) {
      if (tareaIdsSet.has(predId)) {
        const predSucesoras = sucesoras.get(predId) || [];
        predSucesoras.push(tarea.id);
        sucesoras.set(predId, predSucesoras);
      }
    }
  }

  // Combinar resultados y calcular float_total y float_free
  const resultados: TareaCPMResultado[] = tareas.map((tarea) => {
    const forward = forwardResults.get(tarea.id)!;
    const backward = backwardResults.get(tarea.id)!;

    const es = forward.es;
    const ef = forward.ef;
    const ls = backward.ls;
    const lf = backward.lf;
    const float_total = ls - es; // Holgura total
    const isCritical = float_total === 0;

    // Calcular float_free = min(ES de sucesoras) - EF
    const tareaSucesoras = sucesoras.get(tarea.id) || [];
    let float_free = float_total; // Por defecto igual a float_total

    if (tareaSucesoras.length > 0) {
      // Obtener el mínimo ES de las sucesoras
      let minESSucesoras = Infinity;
      for (const sucId of tareaSucesoras) {
        const sucForward = forwardResults.get(sucId);
        if (sucForward && sucForward.es < minESSucesoras) {
          minESSucesoras = sucForward.es;
        }
      }
      if (minESSucesoras !== Infinity) {
        float_free = minESSucesoras - ef;
        // Asegurar que float_free no sea negativo
        if (float_free < 0) float_free = 0;
      }
    }

    return {
      ...tarea,
      es,
      ef,
      ls,
      lf,
      float: float_total,
      float_free,
      isCritical,
    };
  });

  // Calcular duración total del proyecto (max EF de tareas críticas)
  let project_duration = 0;
  let critical_count = 0;

  for (const resultado of resultados) {
    if (resultado.isCritical && resultado.ef > project_duration) {
      project_duration = resultado.ef;
    }
    if (resultado.isCritical) {
      critical_count++;
    }
  }

  return {
    tareas: resultados,
    project_duration,
    critical_count,
  };
}

