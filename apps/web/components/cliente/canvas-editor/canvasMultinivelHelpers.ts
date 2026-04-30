import type {
  CanvasNivelEstadoLocal,
  CanvasNivelTipo,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';

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

/** Bajo obra (sin nodo padre visible) sólo crean etapas */
export function childTypeForContainer(parent: CanvasNode | null): CanvasNivelTipo | null {
  if (!parent) return 'etapa';
  switch (parent.type) {
    case 'etapa':
      return 'planta';
    case 'planta':
      return 'sector';
    case 'sector':
      return 'ambiente';
    case 'ambiente':
      return 'tarea';
    default:
      return null;
  }
}

export function labelCrearContextual(childType: CanvasNivelTipo | null): string {
  switch (childType) {
    case 'etapa':
      return '+ Etapa';
    case 'planta':
      return '+ Planta / sector';
    case 'sector':
      return '+ Sector interno';
    case 'ambiente':
      return '+ Ambiente';
    case 'tarea':
      return '+ Tarea';
    default:
      return '+ Nodo';
  }
}

export function labelTipoNodo(t: CanvasNivelTipo): string {
  switch (t) {
    case 'etapa':
      return 'Etapa';
    case 'planta':
      return 'Planta / sector';
    case 'sector':
      return 'Sector interno';
    case 'ambiente':
      return 'Ambiente';
    case 'tarea':
      return 'Tarea';
  }
}

export function depthFromParent(nodes: CanvasNode[], parentId: string | null): number {
  if (parentId === null) return 0;
  const p = nodes.find((n) => n.id === parentId);
  return p ? p.level + 1 : 1;
}

export function defaultTitleFor(type: CanvasNivelTipo): string {
  switch (type) {
    case 'etapa':
      return 'Nueva etapa';
    case 'planta':
      return 'Nueva planta / sector';
    case 'sector':
      return 'Nuevo sector interno';
    case 'ambiente':
      return 'Nuevo ambiente';
    case 'tarea':
      return 'Nueva tarea';
  }
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

export type VistaNivelPrincipal = 'etapas' | 'plantas' | 'sectores' | 'ambientes' | 'tareas';

export function vistaPrincipalPorContenedor(container: CanvasNode | null): VistaNivelPrincipal {
  if (!container) return 'etapas';
  switch (container.type) {
    case 'etapa':
      return 'plantas';
    case 'planta':
      return 'sectores';
    case 'sector':
      return 'ambientes';
    case 'ambiente':
      return 'tareas';
    default:
      return 'tareas';
  }
}

export type CabeceraNivelVista = {
  /** Texto corto para “Nivel actual: …”. */
  nivelActualTitulo: string;
  /** Dónde estás dentro de la jerarquía. */
  contextoUbicacion: string;
  vistaActual: string;
  accionSugerida: string;
};

/** Barra contextual superior (timeline / hub / canvas). */
export function cabeceraContextoNivel(obraNombre: string, container: CanvasNode | null): CabeceraNivelVista {
  if (!container) {
    return {
      nivelActualTitulo: 'Etapas / fases',
      contextoUbicacion: `Obra · ${obraNombre}`,
      vistaActual: 'Timeline horizontal',
      accionSugerida:
        'Agregá fases nuevas y, si querés, el orden esperable en el tiempo con precedencias entre etapas.',
    };
  }
  switch (container.type) {
    case 'etapa':
      return {
        nivelActualTitulo: 'Planta / sector general',
        contextoUbicacion: `Etapa · ${container.title}`,
        vistaActual: 'Composición tipo mapa · hub + grilla',
        accionSugerida: 'Creá niveles físicos coherentes dentro de esta fase (pisos, cocheras, azoteas…).',
      };
    case 'planta':
      return {
        nivelActualTitulo: 'Sector interno / departamento',
        contextoUbicacion: `Planta · ${container.title}`,
        vistaActual: 'Mapa guiado del nivel',
        accionSugerida: 'Definí depts, palieres o núcleos como piezas claras del piso.',
      };
    case 'sector':
      return {
        nivelActualTitulo: 'Ambientes',
        contextoUbicacion: `Sector · ${container.title}`,
        vistaActual: 'Tarjetas de ambientes',
        accionSugerida: 'Nombrá cocina, dormitorios, etc. antes de pasar a tareas de ejecución.',
      };
    case 'ambiente':
      return {
        nivelActualTitulo: 'Tareas operativas',
        contextoUbicacion: `Ambiente · ${container.title}`,
        vistaActual: 'Canvas de precedencias',
        accionSugerida: 'Creá tareas, conectalas, usá checklist y camino crítico en el inspector izquierdo.',
      };
    default:
      return {
        nivelActualTitulo: 'Obra',
        contextoUbicacion: container.title,
        vistaActual: 'Vista general',
        accionSugerida: 'Seleccioná un elemento para editarlo.',
      };
  }
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
