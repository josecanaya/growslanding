import type { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import { proponerL0 } from '@/lib/proyecto-vivo/orquestador/proponerL0';
import {
  insertarPropuestaEnCanvas,
  type InsertarPropuestasResult,
} from '@/lib/proyecto-vivo/orquestador/insertarPropuestaEnCanvas';

export type AplicarPropuestasL0Result = InsertarPropuestasResult;

/**
 * Inserta nodos/aristas nuevos. No hace PUT replace-all, no crea tareas, no marca realizada.
 */
export async function aplicarPropuestasL0(params: {
  supabase: ReturnType<typeof createServiceSupabaseClient>;
  obraId: string;
  orgId: string;
  canvas: CanvasMultinivelPersisted;
  objetivoTexto: string | null;
}): Promise<AplicarPropuestasL0Result> {
  const propuesta = proponerL0({
    canvas: params.canvas,
    objetivoTexto: params.objetivoTexto,
  });
  return insertarPropuestaEnCanvas({ ...params, propuesta });
}
