import { dependenciasBase } from '@/lib/data/dependenciasBase';

type TareaReferencia = {
  nombre?: string | null;
  title?: string | null;
};

/**
 * Ordena un conjunto de tareas utilizando la secuencia definida en dependenciasBase.
 * - No muta el arreglo original.
 * - Si una tarea no coincide con ninguna dependencia conocida, queda al final.
 */
export function ordenarTareasPorDependenciasBase<T extends TareaReferencia>(
  tareas: T[] | null | undefined
): T[] {
  if (!tareas || tareas.length === 0) return [];

  const prioridades: Record<string, number> = {};

  dependenciasBase.forEach((item, index) => {
    prioridades[item.id.toLowerCase()] = index;
  });

  const claves = Object.keys(prioridades);

  const obtenerIndice = (tarea: T): number => {
    const nombreNormalizado = (tarea.nombre ?? tarea.title ?? '').toLowerCase();
    const coincidencia = claves.find((key) => nombreNormalizado.includes(key));
    return coincidencia !== undefined ? prioridades[coincidencia] : Number.MAX_SAFE_INTEGER;
  };

  return [...tareas].sort((a, b) => obtenerIndice(a) - obtenerIndice(b));
}

