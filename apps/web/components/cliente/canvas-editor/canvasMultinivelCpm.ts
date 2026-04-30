import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import {
  calcularCPM,
  type CPMResultado,
  type TareaCPM,
  type TareaCPMResultado,
} from '@/lib/utils/cpm';

/** Convierte el grafo local de tareas + aristas tipo A→B (B depende de A) en input CPM estándar. */
export function tareasLocalesToCpmInput(
  tasks: CanvasNode[],
  siblingEdges: CanvasPrecedenceEdge[],
): TareaCPM[] {
  const taskIds = new Set(tasks.map((t) => t.id));
  const predMap = new Map<string, string[]>();
  for (const t of tasks) predMap.set(t.id, []);
  for (const e of siblingEdges) {
    if (!taskIds.has(e.sourceId) || !taskIds.has(e.targetId)) continue;
    const arr = predMap.get(e.targetId) ?? [];
    if (!arr.includes(e.sourceId)) arr.push(e.sourceId);
    predMap.set(e.targetId, arr);
  }
  return tasks.map((t) => ({
    id: t.id,
    name: t.title,
    duration: Math.max(0, Math.round(t.duracionDias ?? 0)),
    predecessors: predMap.get(t.id) ?? [],
  }));
}

export type CanvasTaskCpmBundle = {
  resultado: CPMResultado;
  byId: Map<string, TareaCPMResultado>;
};

/** CPM sobre el lienzo actual (mismo método que OrganizaSection / TaskCanvas). null si ciclo o error. */
export function computeCanvasTaskCpm(
  tasks: CanvasNode[],
  siblingEdges: CanvasPrecedenceEdge[],
): CanvasTaskCpmBundle | null {
  if (tasks.length === 0) return null;
  const input = tareasLocalesToCpmInput(tasks, siblingEdges);
  try {
    const resultado = calcularCPM(input);
    const byId = new Map(resultado.tareas.map((row) => [row.id, row]));
    return { resultado, byId };
  } catch {
    return null;
  }
}

/** Estilo borde/arista tipo TaskCanvas: crítico si holgura 0 calculada (o marca manual arista/nodo legacy). */
export function tareaCriticaPorCpm(
  taskId: string,
  bundle: CanvasTaskCpmBundle | null,
  nodeManual: CanvasNode | undefined,
): boolean {
  if (nodeManual?.esCritica) return true;
  const r = bundle?.byId.get(taskId);
  return Boolean(r?.isCritical);
}

export function aristaCriticaVisual(
  e: CanvasPrecedenceEdge,
  bundle: CanvasTaskCpmBundle | null,
): boolean {
  if (e.critical) return true;
  const s = bundle?.byId.get(e.sourceId);
  const t = bundle?.byId.get(e.targetId);
  if (!s || !t) return false;
  return s.isCritical || t.isCritical;
}
