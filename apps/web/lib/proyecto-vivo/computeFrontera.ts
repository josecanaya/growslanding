import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';

export type FronteraItem = {
  transformacionId: string;
  motivo: string;
};

export type ComputeFronteraOpts = {
  /** canvas_node_id (cliente) → estado operativo. `validada` cuenta como predecesora cumplida. */
  tareaEstadoByCanvasNodeId?: Map<string, string>;
};

function estadoAlcanzado(n: CanvasNode): boolean {
  return isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado';
}

function transformacionCumplida(
  n: CanvasNode,
  tareaEstadoByCanvasNodeId?: Map<string, string>,
): boolean {
  if (!isCanvasTransformacionNode(n)) return false;
  if (n.graphStatus === 'realizada') return true;
  if (n.transformKind === 'ejecucion') {
    const st = tareaEstadoByCanvasNodeId?.get(n.id);
    if (st === 'validada') return true;
  }
  return false;
}

/** Transformaciones posibles: origen alcanzado y precedencias T→T cumplidas. */
export function computeFrontera(
  snapshot: CanvasMultinivelPersisted,
  opts?: ComputeFronteraOpts,
): FronteraItem[] {
  const byId = new Map(snapshot.nodes.map((n) => [n.id, n]));
  const out: FronteraItem[] = [];

  for (const t of snapshot.nodes) {
    if (!isCanvasTransformacionNode(t)) continue;
    if (t.graphStatus === 'realizada' || t.graphStatus === 'bloqueada') continue;
    if (t.graphStatus !== 'propuesta' && t.graphStatus !== 'en_curso') continue;

    const fromId = t.fromNodeId;
    if (!fromId) continue;
    const from = byId.get(fromId);
    if (!from || !estadoAlcanzado(from)) continue;

    const preds = snapshot.edges.filter((e) => e.targetId === t.id);
    const predsOk = preds.every((e) => {
      const pred = byId.get(e.sourceId);
      if (!pred) return false;
      if (isCanvasEstadoNode(pred)) return estadoAlcanzado(pred);
      return transformacionCumplida(pred, opts?.tareaEstadoByCanvasNodeId);
    });
    if (!predsOk) continue;

    out.push({
      transformacionId: t.id,
      motivo:
        t.graphStatus === 'en_curso'
          ? 'Transformación en curso'
          : 'Estado origen alcanzado; transformación en frontera',
    });
  }

  return out;
}
