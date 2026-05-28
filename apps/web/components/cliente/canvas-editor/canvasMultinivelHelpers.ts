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

/**
 * Misma política anti-ciclo que canAddPrecedenceEdge, pero entre tareas dentro del subárbol de un ancestro común (p. ej. fase con grupos MSP).
 */
export function canAddPrecedenceEdgeInAncestorSubtree(
  ancestorId: string,
  nodes: CanvasNode[],
  edges: CanvasPrecedenceEdge[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return false;
  const s = nodes.find((n) => n.id === sourceId);
  const t = nodes.find((n) => n.id === targetId);
  if (!s || !t || s.type !== 'tarea' || t.type !== 'tarea') return false;

  const subtree = collectSubtreeIds(nodes, ancestorId);
  if (!subtree.has(s.id) || !subtree.has(t.id)) return false;

  const taskIds = descendantTaskNodesUnderAncestor(nodes, ancestorId).map((n) => n.id);
  const idSet = new Set(taskIds);
  if (!idSet.has(sourceId) || !idSet.has(targetId)) return false;
  if (edges.some((e) => e.sourceId === sourceId && e.targetId === targetId)) return false;

  const locally = precedentEdgesAmongTaskIds(edges, idSet);
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

export function descendantTaskNodesUnderAncestor(
  nodes: CanvasNode[],
  ancestorId: string,
): CanvasNode[] {
  const subtree = collectSubtreeIds(nodes, ancestorId);
  return nodes.filter((n) => n.type === 'tarea' && subtree.has(n.id));
}

export function precedentEdgesAmongTaskIds(
  edges: CanvasPrecedenceEdge[],
  taskIds: Set<string>,
): CanvasPrecedenceEdge[] {
  return edges.filter((e) => taskIds.has(e.sourceId) && taskIds.has(e.targetId));
}

/**
 * Cada línea bajo la fase es sólo «un escalón MSP de agrupo» antes de llegar a tareas (p. ej. Fundaciones → rubros → trabajos).
 * Si hay dos o más niveles no-tarea consecutivos (p. ej. planta → ambiente → tareas) se usa el hub / jerarquía profunda como Mampostería.
 */
export function etapaPrefersSubtreeTaskCanvas(
  nodes: CanvasNode[],
  etapa: Pick<CanvasNode, 'id' | 'type'>,
): boolean {
  if (etapa.type !== 'etapa') return false;

  const direct = nodes.filter((n) => n.parentId === etapa.id);
  if (!direct.length) return false;

  /** Máximo un contenedor MSP entre etapa y la hoja tarea por rama directa */
  for (const d of direct) {
    if (d.type === 'tarea') continue;
    const bridgeKids = nodes.filter((k) => k.parentId === d.id);
    if (!bridgeKids.length) return false;
    const allLeavesAreTasks =
      bridgeKids.every((k) => k.type === 'tarea') &&
      bridgeKids.some((k) => k.type === 'tarea');
    if (!allLeavesAreTasks) return false;
  }

  const subtree = collectSubtreeIds(nodes, etapa.id);
  return nodes.some((n) => n.type === 'tarea' && subtree.has(n.id));
}

/**
 * Bajo un piso: si las ramas llegan al trabajo sin pasar por un nivel espacial típico (ambiente/depto…),
 * se usa lienzo de tareas como en MSP aunque el perfil suele hacer Piso→Ambientes primero.
 * Si hay algún hijo directo `ambiente` o `sector` (jerarquía profunda tipo Mampostería / edificio), no aplanamos.
 */
export function plantaPrefersSubtreeTaskCanvas(
  nodes: CanvasNode[],
  planta: Pick<CanvasNode, 'id' | 'type'>,
): boolean {
  if (planta.type !== 'planta') return false;

  const direct = nodes.filter((n) => n.parentId === planta.id);
  if (!direct.length) return false;

  if (direct.some((d) => d.type === 'ambiente' || d.type === 'sector')) return false;

  for (const d of direct) {
    if (d.type === 'tarea') continue;
    const bridgeKids = nodes.filter((k) => k.parentId === d.id);
    if (!bridgeKids.length) return false;
    const allLeavesAreTasks =
      bridgeKids.every((k) => k.type === 'tarea') && bridgeKids.some((k) => k.type === 'tarea');
    if (!allLeavesAreTasks) return false;
  }

  const subtree = collectSubtreeIds(nodes, planta.id);
  return nodes.some((n) => n.type === 'tarea' && subtree.has(n.id));
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

/** Tareas descendientes bajo un contenedor (browser / cards). */
export type DescendantTaskRollup = {
  taskCount: number;
  publishedCount: number;
  unpublishedCount: number;
  presupuestadasCount: number;
};

export function descendantTaskPublicationRollup(
  nodes: CanvasNode[],
  containerNodeId: string,
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null } | undefined>,
): DescendantTaskRollup {
  const ids = collectSubtreeIds(nodes, containerNodeId);
  const tasks = nodes.filter((n) => n.type === 'tarea' && ids.has(n.id));
  let published = 0;
  let presupuestadas = 0;
  for (const t of tasks) {
    const p = tareaPublicacionByNodeId[t.id];
    if (p?.publishedAt) published += 1;
    if (t.budgetGroupId) presupuestadas += 1;
  }
  return {
    taskCount: tasks.length,
    publishedCount: published,
    unpublishedCount: Math.max(0, tasks.length - published),
    presupuestadasCount: presupuestadas,
  };
}

export type PublicationReviewCategory = 'published' | 'draft' | 'incomplete' | 'blocked';

/** Resaltado visual en modo revisión de publicación (no altera datos). */
export function publicationReviewCategory(
  node: CanvasNode,
  tareaPublicacionByNodeId: Record<
    string,
    { publishedAt?: string | null; estado?: string } | undefined
  >,
): PublicationReviewCategory | null {
  if (node.type !== 'tarea') return null;
  const pub = tareaPublicacionByNodeId[node.id];
  if (pub?.publishedAt) return 'published';
  if (node.estadoTarea === 'rechazada') return 'blocked';
  const opEst = (pub?.estado ?? '').toLowerCase();
  if (opEst.includes('bloque')) return 'blocked';
  const { done, total } = checklistProgress(node);
  if (total > 0 && done < total) return 'incomplete';
  if (pub && !pub.publishedAt) return 'incomplete';
  return 'draft';
}

export function vistaPrincipalPorContenedor(
  container: CanvasNode | null,
  projectKind: CanvasProjectKind,
  nodes?: CanvasNode[],
): VistaNivelPrincipal {
  if (container?.type === 'etapa' && nodes && etapaPrefersSubtreeTaskCanvas(nodes, container)) {
    return 'tareas';
  }
  if (container?.type === 'planta' && nodes && plantaPrefersSubtreeTaskCanvas(nodes, container)) {
    return 'tareas';
  }
  return vistaPrincipalPorContenedorForKind(container, projectKind);
}

export function cabeceraContextoNivel(
  obraNombre: string,
  container: CanvasNode | null,
  projectKind: CanvasProjectKind,
  nodes?: CanvasNode[],
): CabeceraNivelVista {
  const preferEtapaSubtreeTasks =
    container?.type === 'etapa' && !!nodes && etapaPrefersSubtreeTaskCanvas(nodes, container);
  const preferPlantaSubtreeTasks =
    container?.type === 'planta' && !!nodes && plantaPrefersSubtreeTaskCanvas(nodes, container);
  return cabeceraContextoNivelForKind(
    obraNombre,
    container,
    projectKind,
    preferEtapaSubtreeTasks,
    preferPlantaSubtreeTasks,
  );
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
    enviado: 'Enviado (legacy)',
    enviado_parcial: 'Enviado parcial (legacy)',
    respondido: 'Respondido (legacy)',
    aprobado: 'Aprobado — socio puede operar',
    aprobado_parcial: 'Aprobado parcial (faltan tareas publicadas)',
  };
  return map[s] ?? status ?? 'Borrador';
}

export function changeWindowStatusLabel(status: string | undefined | null): string | null {
  const s = String(status ?? 'cerrada').toLowerCase();
  const map: Record<string, string> = {
    cerrada: 'Sin cambios pendientes',
    abierta_cliente: 'Cambio solicitado — esperando socio',
    confirmada_socio: 'Socio confirmó — podés re-enviar paquete',
  };
  return map[s] ?? null;
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
