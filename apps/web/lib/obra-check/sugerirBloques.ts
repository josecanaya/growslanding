/**
 * Heurística de bloques de Obra Check (NO usar el generar-bloques de producción, que está
 * acoplado a auth + presupuesto aprobado).
 *
 * Regla: agrupar tareas consecutivas (según su orden ya calculado) que compartan rubro,
 * con un máximo de 8 tareas por bloque. Tareas sin rubro caen en bloques "Varios".
 */

import type { ObraCheckBlock, ObraCheckTask } from './types';
import { rubroLabel } from './rubros';

const MAX_TAREAS_POR_BLOQUE = 8;

let blockCounter = 0;
function genBlockId(): string {
  blockCounter += 1;
  return `blk-${blockCounter}`;
}

/**
 * @param tasksOrdenadas tareas ya ordenadas (se respeta `orden`; si falta, el índice del array).
 */
export function sugerirBloques(tasksOrdenadas: ObraCheckTask[]): ObraCheckBlock[] {
  const ordered = [...tasksOrdenadas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const blocks: ObraCheckBlock[] = [];

  let current: ObraCheckBlock | null = null;
  let currentRubro: string | null | undefined = undefined;

  for (const t of ordered) {
    const mismoRubro = current !== null && currentRubro === t.rubro;
    const hayLugar = current !== null && current.taskIds.length < MAX_TAREAS_POR_BLOQUE;

    if (!current || !mismoRubro || !hayLugar) {
      current = {
        id: genBlockId(),
        nombre: rubroLabel(t.rubro),
        rubro: t.rubro,
        orden: blocks.length,
        taskIds: [],
      };
      blocks.push(current);
      currentRubro = t.rubro;
    }
    current.taskIds.push(t.id);
  }

  return blocks;
}
