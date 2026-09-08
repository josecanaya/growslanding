import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';

/**
 * Reglas de scope del Canvas recursivo — «cuadros dentro de cuadros».
 *
 * REGLA FUNDACIONAL:
 * El Canvas de Grows es un grafo recursivo de cuadros dentro de cuadros. En pantalla
 * se muestra un único scope a la vez. Cada tarjeta puede abrir otro Canvas mediante
 * doble click, pero todos los nodos y relaciones continúan perteneciendo a un único
 * grafo global de la obra.
 *
 * REGLA IGUAL DE IMPORTANTE:
 * Cada cuadro puede contener otros cuadros, pero ninguna caja aísla lo que contiene
 * del resto de la obra.
 *
 * De ahí las dos semánticas separadas:
 * - `parentId` significa SOLAMENTE contención («está dentro de»). Nunca precedencia.
 * - Las relaciones productivas viven en `edges` y PUEDEN cruzar scopes.
 *
 * Este módulo es puro y no guarda estado: la fuente de verdad sigue siendo el
 * snapshot único del canvas (Supabase). No es una segunda fuente de verdad.
 */

/** Id del nodo abierto actualmente; `null` = vista raíz de la obra. */
export type CanvasScopeId = string | null;

/** Scope raíz de la obra: los nodos sin padre. */
export const CANVAS_ROOT_SCOPE: CanvasScopeId = null;

export type CanvasNodeIndex = Map<string, CanvasNode>;

export function buildNodeIndex(nodes: CanvasNode[]): CanvasNodeIndex {
  const m: CanvasNodeIndex = new Map();
  for (const n of nodes) m.set(n.id, n);
  return m;
}

/**
 * Hijos DIRECTOS del scope: lo único que se dibuja.
 * Nunca padre + hijos + nietos simultáneamente.
 */
export function visibleNodesForScope(nodes: CanvasNode[], scopeId: CanvasScopeId): CanvasNode[] {
  return nodes.filter((n) => n.parentId === scopeId);
}

/**
 * Ancla del nodo en el scope: el ancestro (o el nodo mismo) que es hijo directo de
 * `scopeId`. `null` si el nodo no pertenece a este subárbol.
 *
 * Es la pieza que permite proyectar una relación profunda hacia el nivel visible:
 * `Losa P3 -> Columnas P4` ancla en `Piso 3 -> Piso 4` cuando el scope es la obra.
 */
export function scopeAnchorId(
  index: CanvasNodeIndex,
  scopeId: CanvasScopeId,
  nodeId: string,
): string | null {
  let cur = index.get(nodeId);
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.id)) return null;
    guard.add(cur.id);
    if (cur.parentId === scopeId) return cur.id;
    if (cur.parentId === null) return null;
    cur = index.get(cur.parentId);
  }
  return null;
}

/** Cadena de contención desde la raíz hasta `nodeId` (inclusive) — de acá sale el breadcrumb. */
export function scopePathIds(nodes: CanvasNode[], nodeId: string): string[] {
  const index = buildNodeIndex(nodes);
  const chain: string[] = [];
  const guard = new Set<string>();
  let cur = index.get(nodeId);
  while (cur) {
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    chain.unshift(cur.id);
    if (cur.parentId === null) break;
    cur = index.get(cur.parentId);
  }
  return chain;
}

/**
 * Clasificación de una relación respecto del scope visible. El grafo es siempre el
 * mismo; sólo cambia cómo lo proyecta la UI.
 *
 * - `directa`  → ambos extremos son hijos directos del scope. Se dibuja tal cual.
 * - `agregada` → ambos extremos resuelven a tarjetas visibles distintas, pero al
 *                menos uno vive más abajo. Proyección futura (`Piso 3 -> Piso 4`).
 * - `externa`  → sólo un extremo pertenece a este subárbol. Dependencia externa:
 *                por ahora se muestra como badge/contador, no como flecha.
 * - `interna`  → ambos extremos caen dentro de la MISMA tarjeta visible. Invisible
 *                en este nivel; se ve al entrar.
 * - `fuera`    → ninguno de los extremos pertenece a este subárbol.
 */
export type ScopeEdgeClass =
  | { kind: 'directa'; edge: CanvasPrecedenceEdge; sourceAnchorId: string; targetAnchorId: string }
  | { kind: 'agregada'; edge: CanvasPrecedenceEdge; sourceAnchorId: string; targetAnchorId: string }
  | { kind: 'externa'; edge: CanvasPrecedenceEdge; anchorId: string; direction: 'in' | 'out' }
  | { kind: 'interna'; edge: CanvasPrecedenceEdge; anchorId: string }
  | { kind: 'fuera'; edge: CanvasPrecedenceEdge };

export function classifyEdgeForScope(
  index: CanvasNodeIndex,
  scopeId: CanvasScopeId,
  edge: CanvasPrecedenceEdge,
): ScopeEdgeClass {
  const sourceAnchor = scopeAnchorId(index, scopeId, edge.sourceId);
  const targetAnchor = scopeAnchorId(index, scopeId, edge.targetId);

  if (sourceAnchor === null && targetAnchor === null) return { kind: 'fuera', edge };
  if (sourceAnchor !== null && targetAnchor === null) {
    return { kind: 'externa', edge, anchorId: sourceAnchor, direction: 'out' };
  }
  if (sourceAnchor === null && targetAnchor !== null) {
    return { kind: 'externa', edge, anchorId: targetAnchor, direction: 'in' };
  }

  const s = sourceAnchor as string;
  const t = targetAnchor as string;
  if (s === t) return { kind: 'interna', edge, anchorId: s };
  if (s === edge.sourceId && t === edge.targetId) {
    return { kind: 'directa', edge, sourceAnchorId: s, targetAnchorId: t };
  }
  return { kind: 'agregada', edge, sourceAnchorId: s, targetAnchorId: t };
}

/**
 * Primera iteración: sólo las aristas entre nodos visibles del scope actual.
 * No se dibujan miles de flechas hacia nodos ocultos.
 */
export function visibleEdgesForScope(
  nodes: CanvasNode[],
  scopeId: CanvasScopeId,
  edges: CanvasPrecedenceEdge[],
): CanvasPrecedenceEdge[] {
  const index = buildNodeIndex(nodes);
  const out: CanvasPrecedenceEdge[] = [];
  for (const e of edges) {
    if (classifyEdgeForScope(index, scopeId, e).kind === 'directa') out.push(e);
  }
  return out;
}

export type ScopeRelationCount = {
  /** Relaciones que existen más abajo y resuelven a otra tarjeta visible (proyección futura). */
  aggregatedIn: number;
  aggregatedOut: number;
  /** Relaciones hacia nodos fuera de este scope: hoy se muestran como badge. */
  externalIn: number;
  externalOut: number;
};

export function emptyScopeRelationCount(): ScopeRelationCount {
  return { aggregatedIn: 0, aggregatedOut: 0, externalIn: 0, externalOut: 0 };
}

/**
 * Contadores por tarjeta visible. Permiten indicar en la tarjeta que existen
 * dependencias externas / agregadas sin desplegar ni dibujar el subárbol.
 */
export function scopeRelationCounts(
  nodes: CanvasNode[],
  scopeId: CanvasScopeId,
  edges: CanvasPrecedenceEdge[],
): Map<string, ScopeRelationCount> {
  const index = buildNodeIndex(nodes);
  const out = new Map<string, ScopeRelationCount>();
  const rowFor = (id: string): ScopeRelationCount => {
    const cur = out.get(id) ?? emptyScopeRelationCount();
    out.set(id, cur);
    return cur;
  };

  for (const e of edges) {
    const c = classifyEdgeForScope(index, scopeId, e);
    if (c.kind === 'externa') {
      const row = rowFor(c.anchorId);
      if (c.direction === 'in') row.externalIn += 1;
      else row.externalOut += 1;
      continue;
    }
    if (c.kind === 'agregada') {
      rowFor(c.sourceAnchorId).aggregatedOut += 1;
      rowFor(c.targetAnchorId).aggregatedIn += 1;
    }
  }
  return out;
}

/**
 * Proyección agregada del grafo al scope visible: pares de tarjetas visibles que
 * quedan relacionadas por aristas más profundas. Todavía NO se dibuja (la primera
 * iteración muestra sólo `directa`); queda acá para que la evolución no requiera
 * cambiar el modelo de datos.
 */
export function aggregatedScopePairs(
  nodes: CanvasNode[],
  scopeId: CanvasScopeId,
  edges: CanvasPrecedenceEdge[],
): Array<{ sourceId: string; targetId: string; edgeIds: string[] }> {
  const index = buildNodeIndex(nodes);
  const byPair = new Map<string, { sourceId: string; targetId: string; edgeIds: string[] }>();
  for (const e of edges) {
    const c = classifyEdgeForScope(index, scopeId, e);
    if (c.kind !== 'agregada') continue;
    const key = `${c.sourceAnchorId}->${c.targetAnchorId}`;
    const row = byPair.get(key) ?? {
      sourceId: c.sourceAnchorId,
      targetId: c.targetAnchorId,
      edgeIds: [],
    };
    row.edgeIds.push(e.id);
    byPair.set(key, row);
  }
  return [...byPair.values()];
}

/** ¿La tarjeta contiene otro Canvas? Habilita el hint de «doble click para entrar». */
export function hasChildren(nodes: CanvasNode[], nodeId: string): boolean {
  return nodes.some((n) => n.parentId === nodeId);
}
