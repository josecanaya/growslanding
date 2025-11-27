/**
 * Ordena tareas según sus precedencias usando topological sort
 * 
 * @param tareas Array de tareas con id
 * @param precedencias Array de precedencias con tarea_id y depende_de (o tarea_predecesora_id)
 * @returns Array de tareas ordenadas según precedencias
 */
export function ordenarTareasPorPrecedencias<T extends { id: string }>(
  tareas: T[],
  precedencias: Array<{ tarea_id: string; depende_de?: string; tarea_predecesora_id?: string }>
): T[] {
  // Crear un mapa de tareas por ID para acceso rápido
  const tareasMap = new Map<string, T>();
  tareas.forEach((tarea) => {
    tareasMap.set(tarea.id, tarea);
  });

  // Construir grafo de dependencias
  // dependencias[tarea_id] = [tareas que dependen de esta]
  const dependencias = new Map<string, string[]>();
  // predecesoras[tarea_id] = [tareas que deben ejecutarse antes]
  const predecesoras = new Map<string, string[]>();
  // Contador de dependencias pendientes
  const dependenciasPendientes = new Map<string, number>();

  // Inicializar todas las tareas
  tareas.forEach((tarea) => {
    dependencias.set(tarea.id, []);
    predecesoras.set(tarea.id, []);
    dependenciasPendientes.set(tarea.id, 0);
  });

  // Construir el grafo desde las precedencias
  precedencias.forEach((prec) => {
    // La tabla puede usar 'depende_de' o 'tarea_predecesora_id'
    const tareaPredecesoraId = prec.depende_de ?? prec.tarea_predecesora_id;
    const { tarea_id } = prec;

    if (!tareaPredecesoraId) {
      return;
    }

    // Si alguna de las tareas no está en la lista, ignorar
    if (!tareasMap.has(tarea_id) || !tareasMap.has(tareaPredecesoraId)) {
      return;
    }

    // tarea_id depende de tareaPredecesoraId
    // Agregar a la lista de dependencias de la predecesora
    const deps = dependencias.get(tareaPredecesoraId) ?? [];
    deps.push(tarea_id);
    dependencias.set(tareaPredecesoraId, deps);

    // Agregar a la lista de predecesoras de la tarea
    const preds = predecesoras.get(tarea_id) ?? [];
    preds.push(tareaPredecesoraId);
    predecesoras.set(tarea_id, preds);

    // Incrementar contador de dependencias pendientes
    const count = dependenciasPendientes.get(tarea_id) ?? 0;
    dependenciasPendientes.set(tarea_id, count + 1);
  });

  // Topological sort usando algoritmo de Kahn mejorado para CPM
  // Ordena por nivel de profundidad y luego por orden de precedencias
  const resultado: T[] = [];
  const cola: string[] = [];
  const niveles: Map<string, number> = new Map(); // nivel[tareaId] = profundidad en el grafo

  // Calcular niveles de profundidad (BFS)
  const calcularNiveles = () => {
    // Inicializar todas las tareas sin nivel
    tareas.forEach((tarea) => {
      niveles.set(tarea.id, -1);
    });

    // Encontrar todas las tareas sin dependencias (nivel 0)
    const tareasSinDeps: string[] = [];
    dependenciasPendientes.forEach((count, tareaId) => {
      if (count === 0) {
        tareasSinDeps.push(tareaId);
        niveles.set(tareaId, 0);
      }
    });

    // BFS para calcular niveles
    const visitadas = new Set<string>();
    const queue: string[] = [...tareasSinDeps];
    
    while (queue.length > 0) {
      const tareaId = queue.shift()!;
      if (visitadas.has(tareaId)) continue;
      visitadas.add(tareaId);

      const nivelActual = niveles.get(tareaId) ?? 0;
      const deps = dependencias.get(tareaId) ?? [];
      
      deps.forEach((depId) => {
        const nivelDep = niveles.get(depId) ?? -1;
        if (nivelDep < nivelActual + 1) {
          niveles.set(depId, nivelActual + 1);
        }
        if (!visitadas.has(depId)) {
          queue.push(depId);
        }
      });
    }
  };

  calcularNiveles();

  // Encontrar todas las tareas sin dependencias (dependenciasPendientes === 0)
  dependenciasPendientes.forEach((count, tareaId) => {
    if (count === 0) {
      cola.push(tareaId);
    }
  });

  // Ordenar la cola inicial por nivel (las del nivel 0 primero)
  cola.sort((a, b) => {
    const nivelA = niveles.get(a) ?? 0;
    const nivelB = niveles.get(b) ?? 0;
    return nivelA - nivelB;
  });

  // Procesar la cola
  while (cola.length > 0) {
    // Ordenar la cola por nivel antes de procesar
    // Priorizar tareas del mismo nivel según orden de creación o ID
    cola.sort((a, b) => {
      const nivelA = niveles.get(a) ?? 0;
      const nivelB = niveles.get(b) ?? 0;
      if (nivelA !== nivelB) {
        return nivelA - nivelB;
      }
      
      // Si están en el mismo nivel, intentar ordenar por fecha_inicio_estimada si está disponible
      const tareaA = tareasMap.get(a) as any;
      const tareaB = tareasMap.get(b) as any;
      
      if (tareaA?.fechaInicio && tareaB?.fechaInicio) {
        const fechaA = new Date(tareaA.fechaInicio).getTime();
        const fechaB = new Date(tareaB.fechaInicio).getTime();
        if (fechaA !== fechaB) {
          return fechaA - fechaB;
        }
      }
      
      // Si no hay fechas o son iguales, mantener orden por ID para consistencia
      return a.localeCompare(b);
    });

    const tareaId = cola.shift()!;
    const tarea = tareasMap.get(tareaId);
    
    if (tarea) {
      resultado.push(tarea);
    }

    // Reducir el contador de dependencias para todas las tareas que dependen de esta
    const deps = dependencias.get(tareaId) ?? [];
    deps.forEach((depId) => {
      const count = dependenciasPendientes.get(depId) ?? 0;
      dependenciasPendientes.set(depId, Math.max(0, count - 1));
      
      // Si ya no tiene dependencias pendientes, agregar a la cola
      if (dependenciasPendientes.get(depId) === 0) {
        cola.push(depId);
      }
    });
  }

  // Si hay tareas que no se procesaron, hay un ciclo en las dependencias
  // Agregarlas al final en el orden original
  const procesadas = new Set(resultado.map((t) => t.id));
  tareas.forEach((tarea) => {
    if (!procesadas.has(tarea.id)) {
      resultado.push(tarea);
    }
  });

  return resultado;
}

