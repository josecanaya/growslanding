import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import { isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { calcularCPM, type CPMResultado, type TareaCPMResultado } from '@/lib/utils/cpm';

export type ProyectoVivoCpmBundle = {
  resultado: CPMResultado;
  byId: Map<string, TareaCPMResultado>;
};

/**
 * Lente Tiempo: CPM solo sobre transformaciones.
 * Reusa `calcularCPM`; no persiste es/ef en `tareas` ni usa CPMService Prisma.
 */
export function computeProyectoVivoCpm(
  snapshot: CanvasMultinivelPersisted,
): ProyectoVivoCpmBundle | null {
  const transforms = snapshot.nodes.filter(isCanvasTransformacionNode);
  if (transforms.length === 0) return null;

  const ids = new Set(transforms.map((t) => t.id));
  const predMap = new Map<string, string[]>();
  for (const t of transforms) predMap.set(t.id, []);
  for (const e of snapshot.edges) {
    if (!ids.has(e.sourceId) || !ids.has(e.targetId)) continue;
    const arr = predMap.get(e.targetId) ?? [];
    if (!arr.includes(e.sourceId)) arr.push(e.sourceId);
    predMap.set(e.targetId, arr);
  }

  const input = transforms.map((t) => ({
    id: t.id,
    name: t.title,
    duration: Math.max(0, Math.round(t.duracionDias ?? 0)),
    predecessors: predMap.get(t.id) ?? [],
  }));

  try {
    const resultado = calcularCPM(input);
    return {
      resultado,
      byId: new Map(resultado.tareas.map((row) => [row.id, row])),
    };
  } catch {
    return null;
  }
}
