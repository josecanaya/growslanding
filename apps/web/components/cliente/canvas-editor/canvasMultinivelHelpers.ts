import type {
  CanvasNivelEstadoLocal,
  CanvasNivelTipo,
  CanvasNode,
  CanvasPrecedenceEdge,
  CanvasTareaEstadoLocal,
} from '@/lib/types/canvasMultinivel';
import type {
  CanvasProjectKind,
  CabeceraNivelVista,
  VistaNivelPrincipal,
} from '@/lib/canvas/canvasProjectProfile';
import {
  cabeceraContextoNivelForKind,
  defaultTitleForKind,
  labelCrearContextualForKind,
  labelTipoNodoForKind,
  nextChildCanvasType,
  vistaPrincipalPorContenedorForKind,
} from '@/lib/canvas/canvasProjectProfile';

export type { CabeceraNivelVista, VistaNivelPrincipal } from '@/lib/canvas/canvasProjectProfile';

export function newCanvasNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `cn-${crypto.randomUUID()}`;
  }
  return `cn-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function newCanvasEdgeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `ce-${crypto.randomUUID()}`;
  }
  return `ce-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Bajo obra (sin nodo padre visible) sólo crean etapas; el siguiente tipo depende del perfil de obra. */
export function childTypeForContainer(
  parent: CanvasNode | null,
  projectKind: CanvasProjectKind,
): CanvasNivelTipo | null {
  return nextChildCanvasType(parent, projectKind);
}

export function labelCrearContextual(
  childType: CanvasNivelTipo | null,
  projectKind: CanvasProjectKind,
): string {
  return labelCrearContextualForKind(childType, projectKind);
}

export function labelTipoNodo(t: CanvasNivelTipo, projectKind: CanvasProjectKind): string {
  return labelTipoNodoForKind(t, projectKind);
}

export function defaultTitleFor(type: CanvasNivelTipo, projectKind: CanvasProjectKind): string {
  return defaultTitleForKind(type, projectKind);
}

export function depthFromParent(nodes: CanvasNode[], parentId: string | null): number {
  if (parentId === null) return 0;
  const p = nodes.find((n) => n.id === parentId);
  return p ? p.level + 1 : 1;
}

export function staggerPosition(index: number): { x: number; y: number } {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 80 + col * 240, y: 60 + row * 140 };
}

export function collectSubtreeIds(nodes: CanvasNode[], rootId: string): Set<string> {
  const set = new Set<string>();
  const walk = (id: string) => {
    set.add(id);
    for (const n of nodes) {
      if (n.parentId === id) walk(n.id);
    }
  };
  walk(rootId);
  return set;
}

/** Cadena de ids desde la etapa raíz hasta `containerId` (inclusive), para abrir el canvas de ese contenedor */
export function pathIdsToShowContainer(nodes: CanvasNode[], containerId: string): string[] {
  const chain: CanvasNode[] = [];
  let cur: CanvasNode | undefined = nodes.find((n) => n.id === containerId);
  while (cur) {
    chain.unshift(cur);
    if (!cur.parentId) break;
    const pid = cur.parentId;
    cur = nodes.find((n) => n.id === pid);
  }
  return chain.map((c) => c.id);
}

export function canEnterNode(n: CanvasNode): boolean {
  return n.type !== 'tarea';
}

/** Precedencias entre hermanos del mismo padre (`containerId` null = etapas raíz). */
export function edgesForSiblingLevel(
  containerId: string | null,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
): CanvasPrecedenceEdge[] {
  return edges.filter((e) => {
    const s = nodes.find((x) => x.id === e.sourceId);
    const t = nodes.find((x) => x.id === e.targetId);
    return !!s && !!t && s.parentId === containerId && t.parentId === containerId;
  });
}

export function canAddPrecedenceEdge(
  containerId: string | null,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return false;
  const s = nodes.find((n) => n.id === sourceId);
  const t = nodes.find((n) => n.id === targetId);
  if (!s || !t || s.parentId !== containerId || t.parentId !== containerId) return false;
  if (edges.some((e) => e.sourceId === sourceId && e.targetId === targetId)) return false;

  const locally = edgesForSiblingLevel(containerId, nodes, edges);
  const adj = new Map<string, string[]>();
  const addAdj = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  };
  for (const e of locally) addAdj(e.sourceId, e.targetId);
  addAdj(sourceId, targetId);

  const stack: string[] = [targetId];
  const seen = new Set<string>();
  while (stack.length) {
    const u = stack.pop()!;
    if (u === sourceId) return false;
    if (seen.has(u)) continue;
    seen.add(u);
    for (const v of adj.get(u) ?? []) stack.push(v);
  }
  return true;
}

export type GuiaContextualRow = {
  nivelLabel: string;
  dentroLabel: string;
  accionSugerida: string;
};

/** Guía no vinculante — orienta sin cerrar flujo tipo wizard */
export function guiaContextual(obraNombre: string, container: CanvasNode | null): GuiaContextualRow {
  if (!container) {
    return {
      nivelLabel: 'Nivel actual: obra · etapas',
      dentroLabel: `Obra · ${obraNombre}`,
      accionSugerida:
        'Creá etapas o fases. Podés conectarlas por precedencia (mismo nivel) si querés ordenar el gran flujo macro.',
    };
  }
  const dentro = `Dentro de · ${container.title}`;
  switch (container.type) {
    case 'etapa':
      return {
        nivelLabel: 'Nivel actual: planta / sector general',
        dentroLabel: dentro,
        accionSugerida: 'Creá plantas o sectores generales. Conectá hermanos en el mismo nivel cuando definas precedencias.',
      };
    case 'planta':
      return {
        nivelLabel: 'Nivel actual: sector interno / depto',
        dentroLabel: dentro,
        accionSugerida: 'Creá sectores internos. Precedencias en este lienzo son entre departamentos o áreas equivalentes en el mismo piso o sector general.',
      };
    case 'sector':
      return {
        nivelLabel: 'Nivel actual: ambiente',
        dentroLabel: dentro,
        accionSugerida: 'Creá ambientes. Podés enlazarlos por precedencia si el orden espacial importa a nivel zona.',
      };
    case 'ambiente':
      return {
        nivelLabel: 'Nivel actual: tareas operativas',
        dentroLabel: dentro,
        accionSugerida:
          'Creá tareas, conectalas por precedencia, marcá las críticas y usá el checklist por tarea. Este es el corazón de la ejecución.',
      };
    default:
      return { nivelLabel: 'Nivel', dentroLabel: dentro, accionSugerida: 'Editá desde el panel derecho.' };
  }
}

export function checklistProgress(node: CanvasNode): { done: number; total: number } {
  const list = node.type === 'tarea' ? (node.checklist ?? []) : [];
  const total = list.length;
  const done = list.filter((x) => x.done).length;
  return { done, total };
}

export function vistaPrincipalPorContenedor(
  container: CanvasNode | null,
  projectKind: CanvasProjectKind,
): VistaNivelPrincipal {
  return vistaPrincipalPorContenedorForKind(container, projectKind);
}

export function cabeceraContextoNivel(
  obraNombre: string,
  container: CanvasNode | null,
  projectKind: CanvasProjectKind,
): CabeceraNivelVista {
  return cabeceraContextoNivelForKind(obraNombre, container, projectKind);
}

/** Orden Kahn sobre precedencias con desempate horizontal por `position.x`. Ciclo residual: el resto al final por x. */
export function sortSiblingsByPrecedence(
  visible: CanvasNode[],
  siblingEdges: CanvasPrecedenceEdge[],
): CanvasNode[] {
  if (visible.length <= 1) {
    return [...visible].sort(
      (a, b) => a.position.x - b.position.x || a.createdAt.localeCompare(b.createdAt),
    );
  }
  const ids = new Set(visible.map((v) => v.id));
  const indeg = new Map<string, number>();
  visible.forEach((v) => indeg.set(v.id, 0));
  for (const e of siblingEdges) {
    if (!ids.has(e.sourceId) || !ids.has(e.targetId)) continue;
    indeg.set(e.targetId, (indeg.get(e.targetId) ?? 0) + 1);
  }
  const cmp = (a: CanvasNode, b: CanvasNode) =>
    a.position.x - b.position.x || a.createdAt.localeCompare(b.createdAt);
  const result: CanvasNode[] = [];
  const doneSet = new Set<string>();
  while (doneSet.size < visible.length) {
    const zeros = visible
      .filter((n) => !doneSet.has(n.id) && (indeg.get(n.id) ?? 0) === 0)
      .sort(cmp);
    if (zeros.length === 0) break;
    for (const n of zeros) {
      result.push(n);
      doneSet.add(n.id);
      for (const e of siblingEdges) {
        if (e.sourceId !== n.id || !ids.has(e.targetId)) continue;
        const t = e.targetId;
        indeg.set(t, Math.max(0, (indeg.get(t) ?? 0) - 1));
      }
    }
  }
  const rest = visible.filter((n) => !doneSet.has(n.id)).sort(cmp);
  return [...result, ...rest];
}

/** Camino jerárquico desde la raíz hasta la tarea (títulos). */
export function canvasTaskPathTitles(nodes: CanvasNode[], taskId: string): string {
  const titles: string[] = [];
  let cur: CanvasNode | undefined = nodes.find((n) => n.id === taskId);
  const guard = new Set<string>();
  while (cur) {
    const node = cur;
    if (guard.has(node.id)) break;
    guard.add(node.id);
    titles.unshift(node.title);
    cur = node.parentId ? nodes.find((n) => n.id === node.parentId) : undefined;
  }
  return titles.join(' › ');
}

export function labelEstadoTareaFromDb(est: string | undefined | null): string {
  const e = String(est ?? 'pendiente').toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    para_validar: 'Para validar',
    validada: 'Validada',
    rechazada: 'Rechazada',
  };
  return map[e] ?? est ?? '—';
}

export function budgetGroupStatusLabel(status: string | undefined): string {
  const s = String(status ?? 'borrador').toLowerCase();
  const map: Record<string, string> = {
    borrador: 'Borrador',
    listo_para_enviar: 'Listo para enviar',
    enviado: 'Enviado completo',
    enviado_parcial: 'Enviado parcial (hay pendientes)',
    respondido: 'Respondido',
  };
  return map[s] ?? status ?? 'Borrador';
}

export function labelEstadoNivel(est: CanvasNivelEstadoLocal | undefined): string {
  switch (est ?? 'pendiente') {
    case 'pendiente':
      return 'Pendiente';
    case 'en_curso':
      return 'En curso';
    case 'completado':
      return 'Completado';
    case 'bloqueado':
      return 'Bloqueado';
  }
}

export function labelEstadoTarea(est: CanvasTareaEstadoLocal | undefined): string {
  switch (est ?? 'pendiente') {
    case 'pendiente':
      return 'Pendiente';
    case 'en_progreso':
      return 'En progreso';
    case 'para_validar':
      return 'Para validar';
    case 'validada':
      return 'Validada';
    case 'rechazada':
      return 'Rechazada';
  }
}
