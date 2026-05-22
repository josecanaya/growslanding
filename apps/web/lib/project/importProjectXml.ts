/** Parser Project XML → preview de importación al canvas multinivel Grows (solo cliente, sin backend). */

import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  CANVAS_TYPE_CHAIN_BY_KIND,
  CANVAS_PROJECT_KIND_LABEL,
  inferAdaptiveImportKind,
} from '@/lib/canvas/canvasProjectProfile';
import type { CanvasTareaEstadoLocal } from '@/lib/types/canvasMultinivel';

export const PROJECT_DAY_HOURS = 8;

export type GrowsImportNodeKind = 'root' | 'etapa' | 'planta' | 'sector' | 'ambiente' | 'tarea';

export type ProjectXmlPredecessor = {
  predecessorUid: number;
  type?: number;
  linkLag?: number;
  rawCrossProject?: string | null;
};

export type ProjectXmlTask = {
  uid: number;
  id: number;
  name: string;
  outlineLevel: number;
  outlineNumber: string;
  outlineParts: number[];
  isSummaryFlag: boolean;
  durationRaw: string | null;
  percentComplete: number | null;
  start: string | null;
  finish: string | null;
  predecessors: ProjectXmlPredecessor[];
};

export type ProjectImportWarningKind =
  | 'duration_unparsed'
  | 'duplicate_name'
  | 'deep_outline'
  | 'missing_outline'
  | 'orphan_task'
  | 'dependence_summary_target'
  | 'dependence_summary_source'
  | 'dependence_cross_parent'
  | 'dependence_unresolved'
  | 'parse';

export type ProjectImportWarning = {
  kind: ProjectImportWarningKind;
  message: string;
  taskUid?: number;
  relatedUid?: number;
};

export type GrowsImportNodePreview = {
  sourceUid: number;
  sourceId: number;
  name: string;
  outlineLevel: number;
  outlineNumber: string;
  /** Segmentos WBS para ordenar el árbol (no serializar a canvas todavía) */
  outlineParts?: number[];
  isSummary: boolean;
  isLeaf: boolean;
  growsType: GrowsImportNodeKind;
  /** Índice 0-based entre capas OutlineNumber con hijos (contenedores) */
  groupingTierIdx: number;
  /** Pista opcional derivada del nombre para tipoLabel del canvas */
  semanticHint?: string;
  parentSourceUid: number | null;
  durationDays: number | null;
  percentComplete: number | null;
  status: CanvasTareaEstadoLocal;
  childrenCount: number;
  durationWarning?: string;
};

export type GrowsImportEdgePreview = {
  id: string;
  sourceUid: number;
  targetUid: number;
  predecessorType: number | undefined;
  linkLag: number | undefined;
  kind: 'valid' | 'warning_summary' | 'warning_cross_parent' | 'unresolved';
  detail: string;
};

export type ProjectImportPreview = {
  projectName: string;
  projectStart: string | null;
  projectFinish: string | null;
  tasksTotal: number;
  summaryTasksTotal: number;
  operativeTasksTotal: number;
  /** Total de enlaces PredecessorLink leídos en el XML */
  predecessorsReadTotal: number;
  validPredecessors: number;
  warningPredecessors: number;
  unresolvedPredecessors: number;
  nodesPreview: GrowsImportNodePreview[];
  edgesPreview: GrowsImportEdgePreview[];
  warnings: ProjectImportWarning[];
  statsByLevel: Record<number, number>;
  /** UID ignorado como contenedor único de nivel mínimo (nombre de obra) */
  collapsedRootUid: number | null;
  treeLines: string[];
  /** Inferido sólo desde la profundidad real del Outline (no desde el tipo de obra en pantalla). */
  adaptiveImportKind: CanvasProjectKind;
  /** Cantidad de profundidades de OutlineNumber que son contenedores (tienen hijos en MSP). */
  groupingTierCount: number;
  /** Máximo outlineParts.length en el proyecto (todas las tareas MSP). */
  maxOutlineDepthDetected: number;
  /** Leyenda legible nivel a nivel sobre la cadena adaptable (UI). */
  structureTierLabels: string[];
  mappingSummary: {
    etapas: number;
    plantas: number;
    sectores: number;
    ambientes: number;
    tareas: number;
  };
};

function nsAwareGetElements(doc: Document, localName: string): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    for (const c of el.children) {
      if (c instanceof Element) {
        if (c.localName === localName) out.push(c);
        walk(c);
      }
    }
  };
  walk(doc.documentElement);
  return out;
}

function childText(el: Element | null, localName: string): string | null {
  if (!el) return null;
  for (const c of el.children) {
    if (c instanceof Element && c.localName === localName) {
      const t = c.textContent?.trim();
      return t === '' || t == null ? null : t;
    }
  }
  return null;
}

function childInt(el: Element | null, localName: string): number | null {
  const t = childText(el, localName);
  if (t == null) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOutlineParts(outlineNumber: string): number[] {
  return outlineNumber
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
}

export function normalizeProjectDuration(
  raw: string | null | undefined,
  dayHours: number = PROJECT_DAY_HOURS,
): { days: number | null; warning?: string } {
  if (raw == null || raw === '') return { days: null };
  const s = raw.trim();
  if (/^0(\.0+)?\s*(days?|hrs?)?$/i.test(s)) return { days: 0 };

  if (s.startsWith('P')) {
    let days = 0;
    let hours = 0;
    let minutes = 0;
    let weeks = 0;

    const wk = s.match(/P(\d+(?:\.\d+)?)W/i);
    if (wk) weeks = parseFloat(wk[1]!);

    const datePart = s.split('T')[0] ?? s;
    const mDay = datePart.match(/(\d+(?:\.\d+)?)D/i);
    if (mDay) days += parseFloat(mDay[1]!);

    const tIdx = s.indexOf('T');
    if (tIdx !== -1) {
      const t = s.slice(tIdx + 1);
      const h = t.match(/(\d+(?:\.\d+)?)H/i);
      const mn = t.match(/(\d+(?:\.\d+)?)M/i);
      if (h) hours += parseFloat(h[1]!);
      if (mn) minutes += parseFloat(mn[1]!);
    }

    const totalDays = weeks * 7 + days + hours / dayHours + minutes / 60 / dayHours;
    if (totalDays >= 0 && (weeks > 0 || mDay || tIdx !== -1 || wk)) {
      return { days: Math.round(totalDays * 1000) / 1000 };
    }
  }

  return { days: null, warning: `Duración no interpretada: ${raw}` };
}

function mapPercentToStatus(pct: number | null): CanvasTareaEstadoLocal {
  if (pct == null || pct <= 0) return 'pendiente';
  if (pct >= 100) return 'validada';
  return 'en_progreso';
}

function taskIsStructural(task: ProjectXmlTask, hasChildren: boolean): boolean {
  if (hasChildren) return true;
  if (task.isSummaryFlag) return true;
  return false;
}

function canvasSlotsForImportKind(kind: CanvasProjectKind) {
  return CANVAS_TYPE_CHAIN_BY_KIND[kind].filter((t) => t !== 'tarea') as GrowsImportNodeKind[];
}

/**
 * Reparte cada capa de OutlineNumber con hijos entre los tipos de contenedor disponibles según perfil adaptable.
 * OutlineNumber define el árbol; no se fuerza piso/depto fuera del XML.
 */
export function mapGroupingTierIdxToGrowType(
  tierIdx: number,
  groupingTierTotal: number,
  kind: CanvasProjectKind,
): GrowsImportNodeKind {
  const slots = canvasSlotsForImportKind(kind);
  const safeSlots = (slots.length > 0 ? slots : ['etapa']) as GrowsImportNodeKind[];
  if (groupingTierTotal <= 1) return safeSlots[0]!;
  const ti = Math.max(0, tierIdx);
  const slotIdx = Math.min(ti, safeSlots.length - 1);
  return safeSlots[slotIdx]!;
}

const STRUCTURE_KIND_LABEL: Record<GrowsImportNodeKind, string> = {
  root: 'Raíz',
  etapa: 'Etapa o fase',
  planta: 'Planta o nivel',
  sector: 'Sector',
  ambiente: 'Área de trabajo',
  tarea: 'Tarea ejecutable',
};

/** Una línea por capa OutlineNumber que agrupa trabajo (tiene hijos en MSP); encaja contra el perfil adaptable. */
function buildStructureTierLabels(groupingTierCount: number, adaptiveKind: CanvasProjectKind): string[] {
  if (groupingTierCount <= 0) return [];
  const total = groupingTierCount;
  const lines: string[] = [];
  for (let ix = 0; ix < total; ix++) {
    const gt = mapGroupingTierIdxToGrowType(ix, total, adaptiveKind);
    lines.push(`Capa ${ix + 1} → ${STRUCTURE_KIND_LABEL[gt]} (perfil Canvas: ${CANVAS_PROJECT_KIND_LABEL[adaptiveKind]})`);
  }
  return lines;
}

function semanticHintFromName(name: string, grows: GrowsImportNodeKind, tierIdx: number): string | undefined {
  const n = name.normalize('NFD').replace(/\u0300-\u036f/g, '').trim().toLowerCase();
  if (/(instalaci|electric|sanitari(a|os)|gas|revoque|pintura|carpinteri|hidraul|soldadur|rubro|terminacion)/i.test(n)) {
    return 'Rubro / instalaciones';
  }
  if (
    /(\b(pb|pa)\b|planta baja|planta alta|piso\b|primer piso|segundo piso\s|nivel)/i.test(n)
  ) {
    return 'Planta / piso';
  }
  if (/(departamento|depto|unidad\b|dto\b)/i.test(n)) {
    return 'Unidad';
  }
  if (/(ba[nñ]o|cocina|living|dormitorio|lavadero|comedor|pasillo|hall|patio|cubiert)/i.test(n)) {
    return 'Espacio interior';
  }
  if (tierIdx === 0 && grows !== 'tarea') {
    return 'Fase';
  }
  return undefined;
}

export function sortedGroupingOutlineLengths(
  tasks: ProjectXmlTask[],
  childCount: Map<number, number>,
  collapsedRootUid: number | null,
): number[] {
  const lenSet = new Set<number>();
  for (const t of tasks) {
    if (t.uid === 0) continue;
    if (collapsedRootUid !== null && t.uid === collapsedRootUid) continue;
    if ((childCount.get(t.uid) ?? 0) === 0) continue;
    if (t.outlineParts.length > 0) lenSet.add(t.outlineParts.length);
  }
  return [...lenSet].sort((a, b) => a - b);
}
function detectCollapsedRoot(tasks: ProjectXmlTask[], childCounts: Map<number, number>): number | null {
  if (tasks.length === 0) return null;
  const minL = Math.min(...tasks.map((t) => t.outlineLevel));
  const atMin = tasks.filter((t) => t.outlineLevel === minL);
  if (atMin.length !== 1) return null;
  const cand = atMin[0]!;
  const kids = childCounts.get(cand.uid) ?? 0;
  const structural = kids > 0 || cand.isSummaryFlag;
  if (!structural) return null;
  return cand.uid;
}

function parentOutlineKey(parts: number[]): string | null {
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

export function extractProjectTasks(xmlDoc: Document): ProjectXmlTask[] {
  const taskEls = nsAwareGetElements(xmlDoc, 'Task');
  const tasks: ProjectXmlTask[] = [];

  for (const te of taskEls) {
    const uid = childInt(te, 'UID');
    if (uid == null || uid === 0) continue;

    const outlineNumber = childText(te, 'OutlineNumber') ?? '';
    const outlineParts = parseOutlineParts(outlineNumber);
    if (outlineParts.length === 0) continue;

    const name = childText(te, 'Name') ?? '(sin nombre)';
    const id = childInt(te, 'ID') ?? uid;
    const outlineLevel = childInt(te, 'OutlineLevel') ?? outlineParts.length;
    const sumRaw = childText(te, 'Summary');
    const isSummaryFlag = sumRaw === '1' || sumRaw?.toLowerCase() === 'true';
    const durationRaw = childText(te, 'Duration');
    const pctRaw = childInt(te, 'PercentComplete');
    const start = childText(te, 'Start');
    const finish = childText(te, 'Finish');

    const predecessors: ProjectXmlPredecessor[] = [];
    for (const c of te.children) {
      if (c instanceof Element && c.localName === 'PredecessorLink') {
        const puid = childInt(c, 'PredecessorUID');
        if (puid == null) continue;
        predecessors.push({
          predecessorUid: puid,
          type: childInt(c, 'Type') ?? undefined,
          linkLag: childInt(c, 'LinkLag') ?? undefined,
          rawCrossProject: childText(c, 'CrossProject'),
        });
      }
    }

    tasks.push({
      uid,
      id,
      name,
      outlineLevel,
      outlineNumber: outlineNumber || outlineParts.join('.'),
      outlineParts,
      isSummaryFlag,
      durationRaw,
      percentComplete: pctRaw,
      start,
      finish,
      predecessors,
    });
  }

  return tasks;
}

export function detectProjectHierarchy(tasks: ProjectXmlTask[]): {
  byUid: Map<number, ProjectXmlTask>;
  parentUid: Map<number, number | null>;
  childCount: Map<number, number>;
} {
  const filtered = tasks.filter((t) => t.uid !== 0);
  const byUid = new Map<number, ProjectXmlTask>();
  const outlineToUid = new Map<string, number>();

  for (const t of filtered) {
    byUid.set(t.uid, t);
    if (t.outlineParts.length > 0) outlineToUid.set(t.outlineParts.join('.'), t.uid);
  }

  const parentUid = new Map<number, number | null>();
  const childCount = new Map<number, number>();

  for (const t of filtered) {
    childCount.set(t.uid, 0);
  }
  for (const t of filtered) {
    const pok = parentOutlineKey(t.outlineParts);
    let p: number | null = null;
    if (pok) {
      const puidFound = outlineToUid.get(pok);
      p = puidFound ?? null;
    }
    parentUid.set(t.uid, p);
  }
  for (const t of filtered) {
    const p = parentUid.get(t.uid);
    if (p != null && byUid.has(p)) {
      childCount.set(p, (childCount.get(p) ?? 0) + 1);
    }
  }

  return { byUid, parentUid, childCount };
}

export function mapProjectToGrowsPreview(
  tasks: ProjectXmlTask[],
  meta: {
    byUid: Map<number, ProjectXmlTask>;
    parentUid: Map<number, number | null>;
    childCount: Map<number, number>;
    collapsedRootUid: number | null;
  },
  sortedGroupLengths: number[],
  adaptiveKind: CanvasProjectKind,
): { nodes: GrowsImportNodePreview[]; warnings: ProjectImportWarning[] } {
  const warnings: ProjectImportWarning[] = [];
  const filtered = tasks.filter((t) => t.uid !== 0);
  const groupingTierTotal = sortedGroupLengths.length;

  const nodes: GrowsImportNodePreview[] = [];

  const nameCount = new Map<string, number>();
  const warnedDupes = new Set<string>();
  /** Nombres de hojas (tareas ejecutables) para alertar duplicados */
  for (const t of filtered) {
    if (meta.collapsedRootUid === t.uid) continue;
    const cc = meta.childCount.get(t.uid) ?? 0;
    if (cc > 0) continue;
    nameCount.set(t.name, (nameCount.get(t.name) ?? 0) + 1);
  }

  const maxSeg = Math.max(0, ...filtered.map((t) => t.outlineParts.length));
  if (maxSeg > 10) {
    warnings.push({
      kind: 'deep_outline',
      message: `Jerarquía muy profunda (OutlineNumber máximo ${maxSeg}). Revisá el mapeo antes de importar.`,
    });
  }

  for (const t of filtered) {
    if (meta.collapsedRootUid === t.uid) continue;

    const cc = meta.childCount.get(t.uid) ?? 0;
    const hasChildren = cc > 0;
    const isLeaf = !hasChildren;
    const tierIx = sortedGroupLengths.indexOf(t.outlineParts.length);

    let growsType: GrowsImportNodeKind;
    let groupingTierIdx = 0;
    if (isLeaf) {
      growsType = 'tarea';
      groupingTierIdx = Math.max(0, sortedGroupLengths.length);
    } else {
      groupingTierIdx = tierIx < 0 ? 0 : tierIx;
      growsType = mapGroupingTierIdxToGrowType(
        groupingTierIdx,
        Math.max(groupingTierTotal, 1),
        adaptiveKind,
      );
      if (growsType === 'tarea') growsType = 'ambiente';
    }

    const norm = normalizeProjectDuration(t.durationRaw, PROJECT_DAY_HOURS);
    if (growsType === 'tarea') {
      if (norm.warning) {
        warnings.push({
          kind: 'duration_unparsed',
          message: `${t.name} (UID ${t.uid}): ${norm.warning}`,
          taskUid: t.uid,
        });
      } else if (norm.days == null && (t.percentComplete ?? 0) < 100) {
        warnings.push({
          kind: 'duration_unparsed',
          message: `Tarea operativa sin duración definida: «${t.name}» (UID ${t.uid})`,
          taskUid: t.uid,
        });
      }
    }

    let parent = meta.parentUid.get(t.uid) ?? null;
    if (parent === meta.collapsedRootUid) parent = null;

    if ((nameCount.get(t.name) ?? 0) > 1 && growsType === 'tarea' && !warnedDupes.has(t.name)) {
      warnedDupes.add(t.name);
      warnings.push({
        kind: 'duplicate_name',
        message: `Nombre duplicado en tareas operativas: «${t.name}» (${nameCount.get(t.name)} ocurrencias)`,
      });
    }

    const isSummary = hasChildren || t.isSummaryFlag;
    const semanticHint =
      growsType === 'tarea'
        ? semanticHintFromName(t.name, 'tarea', 0)
        : semanticHintFromName(t.name, growsType, groupingTierIdx);

    nodes.push({
      sourceUid: t.uid,
      sourceId: t.id,
      name: t.name,
      outlineLevel: t.outlineLevel,
      outlineNumber: t.outlineNumber,
      isSummary,
      isLeaf,
      growsType,
      groupingTierIdx,
      semanticHint,
      parentSourceUid: parent,
      durationDays: growsType === 'tarea' ? norm.days : null,
      percentComplete: t.percentComplete,
      status: growsType === 'tarea' ? mapPercentToStatus(t.percentComplete) : 'pendiente',
      childrenCount: cc,
      durationWarning: growsType === 'tarea' ? norm.warning : undefined,
    });
  }

  return { nodes, warnings };
}
function collectLeafDescendants(
  rootUid: number,
  meta: { byUid: Map<number, ProjectXmlTask>; parentUid: Map<number, number | null> },
): number[] {
  const childrenByParent = new Map<number, number[]>();
  for (const uid of meta.byUid.keys()) {
    const p = meta.parentUid.get(uid);
    if (p == null) continue;
    if (!childrenByParent.has(p)) childrenByParent.set(p, []);
    childrenByParent.get(p)!.push(uid);
  }

  const leaves: number[] = [];
  const stack = [...(childrenByParent.get(rootUid) ?? [])];
  while (stack.length) {
    const u = stack.pop()!;
    const ch = childrenByParent.get(u) ?? [];
    if (ch.length === 0) leaves.push(u);
    else stack.push(...ch);
  }
  return leaves;
}

export function buildPreviewEdges(
  tasks: ProjectXmlTask[],
  meta: {
    byUid: Map<number, ProjectXmlTask>;
    parentUid: Map<number, number | null>;
    childCount: Map<number, number>;
    collapsedRootUid: number | null;
  },
  _nodeByUid: Map<number, GrowsImportNodePreview>,
): { edges: GrowsImportEdgePreview[]; stats: Pick<ProjectImportPreview, 'predecessorsReadTotal' | 'validPredecessors' | 'warningPredecessors' | 'unresolvedPredecessors'>; predWarnings: ProjectImportWarning[] } {
  const filtered = tasks.filter((t) => t.uid !== 0 && t.uid !== meta.collapsedRootUid);
  const predWarnings: ProjectImportWarning[] = [];
  const edges: GrowsImportEdgePreview[] = [];
  const seen = new Set<string>();
  let readTotal = 0;
  let valid = 0;
  let warn = 0;
  let unres = 0;

  const effectiveParent = (uid: number): number | null => {
    let p = meta.parentUid.get(uid) ?? null;
    if (p === meta.collapsedRootUid) return null;
    return p;
  };

  for (const t of filtered) {
    for (const pl of t.predecessors) {
      readTotal++;
      const predUid = pl.predecessorUid;

      const keyEarly = `${predUid}->${t.uid}`;
      if (seen.has(keyEarly)) continue;

      if (predUid === 0) {
        seen.add(keyEarly);
        unres++;
        predWarnings.push({
          kind: 'dependence_unresolved',
          message: `Tarea «${t.name}» (UID ${t.uid}): predecesor UID 0 / no válido.`,
          taskUid: t.uid,
          relatedUid: predUid,
        });
        edges.push({
          id: `e-${predUid}-${t.uid}-${readTotal}`,
          sourceUid: predUid,
          targetUid: t.uid,
          predecessorType: pl.type,
          linkLag: pl.linkLag,
          kind: 'unresolved',
          detail: 'Predecesor no resuelto.',
        });
        continue;
      }

      const predTask = meta.byUid.get(predUid);
      const succTask = meta.byUid.get(t.uid);
      if (!predTask || !succTask) {
        seen.add(keyEarly);
        unres++;
        predWarnings.push({
          kind: 'dependence_unresolved',
          message: `Dependencia no resuelta: predecesor UID ${predUid} → sucesor UID ${t.uid}.`,
          taskUid: t.uid,
          relatedUid: predUid,
        });
        edges.push({
          id: `e-${predUid}-${t.uid}-${readTotal}`,
          sourceUid: predUid,
          targetUid: t.uid,
          predecessorType: pl.type,
          linkLag: pl.linkLag,
          kind: 'unresolved',
          detail: 'UID no encontrado en el archivo.',
        });
        continue;
      }

      if (meta.collapsedRootUid === predUid || meta.collapsedRootUid === t.uid) {
        continue;
      }

      seen.add(keyEarly);

      const predKids = meta.childCount.get(predUid) ?? 0;
      const succKids = meta.childCount.get(t.uid) ?? 0;
      const predIsSummary = predKids > 0 || predTask.isSummaryFlag;
      const succIsSummary = succKids > 0 || succTask.isSummaryFlag;

      let kind: GrowsImportEdgePreview['kind'] = 'valid';
      let detail = 'Válida para canvas (mismo padre, ambas hojas).';

      if (predIsSummary) {
        kind = 'warning_summary';
        const leaves = collectLeafDescendants(predUid, meta);
        const first = leaves[0];
        const last = leaves[leaves.length - 1];
        detail = `Dependencia hacia tarea resumen (UID ${predUid}), requiere resolución. Hojas descendientes: primera UID ${first ?? '—'}, última UID ${last ?? '—'}.`;
        predWarnings.push({
          kind: 'dependence_summary_target',
          message: detail,
          taskUid: t.uid,
          relatedUid: predUid,
        });
      } else if (succIsSummary) {
        kind = 'warning_summary';
        detail = `El sucesor es tarea resumen (UID ${t.uid}), el canvas opera sobre tareas hoja.`;
        predWarnings.push({
          kind: 'dependence_summary_source',
          message: detail,
          taskUid: t.uid,
          relatedUid: predUid,
        });
      } else {
        const pPred = effectiveParent(predUid);
        const pSucc = effectiveParent(t.uid);
        if (pPred !== pSucc) {
          kind = 'warning_cross_parent';
          detail =
            'Predecesor y sucesor no son hermanos en la jerarquía; en Grows las precedencias del lienzo aplican entre hermanos del mismo contenedor.';
          predWarnings.push({
            kind: 'dependence_cross_parent',
            message: `${detail} (UID ${predUid} → ${t.uid})`,
            taskUid: t.uid,
            relatedUid: predUid,
          });
        }
      }

      if (kind === 'valid') valid++;
      else warn++;

      edges.push({
        id: `e-${predUid}-${t.uid}-${edges.length}`,
        sourceUid: predUid,
        targetUid: t.uid,
        predecessorType: pl.type,
        linkLag: pl.linkLag,
        kind,
        detail,
      });
    }
  }

  return {
    edges,
    stats: {
      predecessorsReadTotal: readTotal,
      validPredecessors: valid,
      warningPredecessors: warn,
      unresolvedPredecessors: unres,
    },
    predWarnings,
  };
}

export function buildPreviewTree(nodes: GrowsImportNodePreview[], projectName: string): string[] {
  const byParent = new Map<string, GrowsImportNodePreview[]>();
  for (const n of nodes) {
    const k = n.parentSourceUid == null ? 'root' : String(n.parentSourceUid);
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(n);
  }
  for (const [, arr] of byParent) {
    arr.sort((a, b) => {
      const ap = a.outlineParts ?? parseOutlineParts(a.outlineNumber);
      const bp = b.outlineParts ?? parseOutlineParts(b.outlineNumber);
      const len = Math.max(ap.length, bp.length);
      for (let i = 0; i < len; i++) {
        const av = ap[i] ?? 0;
        const bv = bp[i] ?? 0;
        if (av !== bv) return av - bv;
      }
      return 0;
    });
  }

  const lines: string[] = [projectName];
  const walk = (parentKey: string, depth: number) => {
    const ch = byParent.get(parentKey) ?? [];
    const pad = '  '.repeat(depth);
    for (const c of ch) {
      const tag = c.growsType !== 'tarea' ? `[${c.growsType}] ` : '';
      lines.push(`${pad}- ${tag}${c.name}`);
      walk(String(c.sourceUid), depth + 1);
    }
  };
  walk('root', 1);
  return lines;
}

export function validateProjectImport(preview: ProjectImportPreview): ProjectImportWarning[] {
  return preview.warnings;
}

function projectMetaFromDoc(xmlDoc: Document): { name: string; start: string | null; finish: string | null } {
  const roots = xmlDoc.getElementsByTagName('*');
  let projectEl: Element | null = null;
  for (let i = 0; i < roots.length; i++) {
    const e = roots[i];
    if (e instanceof Element && e.localName === 'Project') {
      projectEl = e;
      break;
    }
  }
  if (!projectEl) {
    return { name: 'Proyecto', start: null, finish: null };
  }
  const name =
    childText(projectEl, 'Title') ??
    childText(projectEl, 'Name') ??
    childText(projectEl, 'Subject') ??
    'Proyecto';
  const start = childText(projectEl, 'StartDate') ?? childText(projectEl, 'Start');
  const finish = childText(projectEl, 'FinishDate') ?? childText(projectEl, 'Finish');
  return { name, start, finish };
}

/** Añade outlineParts en nodos preview para ordenación */
function attachOutlineParts(nodes: GrowsImportNodePreview[]): GrowsImportNodePreview[] {
  return nodes.map((n) => ({
    ...n,
    outlineParts: parseOutlineParts(n.outlineNumber),
  }));
}

export function parseProjectXml(xmlText: string): ProjectImportPreview {
  let xmlDoc: Document;
  try {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlText, 'application/xml');
  } catch {
    throw new Error('No se pudo leer el XML.');
  }
  const err = xmlDoc.querySelector('parsererror');
  if (err) {
    throw new Error('XML inválido o mal formado.');
  }

  const meta0 = projectMetaFromDoc(xmlDoc);
  const xmlTasks = extractProjectTasks(xmlDoc);

  if (xmlTasks.length === 0) {
    throw new Error('No se encontraron tareas en el XML (OutlineNumber y UID requeridos).');
  }

  const fullHierarchy = detectProjectHierarchy(xmlTasks);
  const collapsedRootUid = detectCollapsedRoot(xmlTasks, fullHierarchy.childCount);

  const collapsedRootTask = collapsedRootUid != null ? fullHierarchy.byUid.get(collapsedRootUid) : null;
  const projectName =
    meta0.name && meta0.name !== 'Proyecto'
      ? meta0.name
      : collapsedRootTask?.name && collapsedRootTask.outlineLevel <= 1
        ? collapsedRootTask.name
        : meta0.name;

  const sortedGroupLengths = sortedGroupingOutlineLengths(
    xmlTasks,
    fullHierarchy.childCount,
    collapsedRootUid,
  );
  const groupingTierCount = sortedGroupLengths.length;
  const adaptiveImportKind = inferAdaptiveImportKind(groupingTierCount);
  const maxOutlineDepthDetected = Math.max(
    0,
    ...xmlTasks
      .filter((t) => t.uid !== 0 && (collapsedRootUid == null || t.uid !== collapsedRootUid))
      .map((t) => t.outlineParts.length),
  );
  const structureTierLabels = buildStructureTierLabels(groupingTierCount, adaptiveImportKind);

  const { nodes: rawNodes, warnings: mapWarnings } = mapProjectToGrowsPreview(
    xmlTasks,
    {
      ...fullHierarchy,
      collapsedRootUid,
    },
    sortedGroupLengths,
    adaptiveImportKind,
  );

  const durWarns = mapWarnings.filter((w) => w.kind === 'duration_unparsed');
  const otherMapWarns = mapWarnings.filter((w) => w.kind !== 'duration_unparsed');
  const durCapped =
    durWarns.length > 70
      ? [
          ...durWarns.slice(0, 70),
          {
            kind: 'duration_unparsed' as const,
            message: `… y ${durWarns.length - 70} advertencias más de duración (listado truncado en preview).`,
          },
        ]
      : durWarns;

  const nodesPreview = attachOutlineParts(rawNodes);
  const nodeByUid = new Map(nodesPreview.map((n) => [n.sourceUid, n]));

  const { edges: edgesPreview, stats: predStats, predWarnings } = buildPreviewEdges(
    xmlTasks,
    { ...fullHierarchy, collapsedRootUid },
    nodeByUid,
  );

  const tasksForAgg = xmlTasks.filter((t) => t.uid !== collapsedRootUid);
  let summaryTasksTotal = 0;
  let operativeTasksTotal = 0;
  for (const t of tasksForAgg) {
    const cc = fullHierarchy.childCount.get(t.uid) ?? 0;
    const hasChildren = cc > 0;
    const isSummaryRow = hasChildren || t.isSummaryFlag;
    if (isSummaryRow) summaryTasksTotal++;
    else operativeTasksTotal++;
  }

  const statsByLevel: Record<number, number> = {};
  for (const t of tasksForAgg) {
    statsByLevel[t.outlineLevel] = (statsByLevel[t.outlineLevel] ?? 0) + 1;
  }

  const mappingSummary = {
    etapas: nodesPreview.filter((n) => n.growsType === 'etapa').length,
    plantas: nodesPreview.filter((n) => n.growsType === 'planta').length,
    sectores: nodesPreview.filter((n) => n.growsType === 'sector').length,
    ambientes: nodesPreview.filter((n) => n.growsType === 'ambiente').length,
    tareas: nodesPreview.filter((n) => n.growsType === 'tarea' && n.isLeaf).length,
  };

  const treeLines = buildPreviewTree(nodesPreview, projectName);

  const warnings = [...otherMapWarns, ...durCapped, ...predWarnings];

  return {
    projectName,
    projectStart: meta0.start,
    projectFinish: meta0.finish,
    tasksTotal: tasksForAgg.length,
    summaryTasksTotal,
    operativeTasksTotal,
    predecessorsReadTotal: predStats.predecessorsReadTotal,
    validPredecessors: predStats.validPredecessors,
    warningPredecessors: predStats.warningPredecessors,
    unresolvedPredecessors: predStats.unresolvedPredecessors,
    nodesPreview,
    edgesPreview,
    warnings,
    statsByLevel,
    collapsedRootUid,
    treeLines,
    adaptiveImportKind,
    groupingTierCount,
    maxOutlineDepthDetected,
    structureTierLabels,
    mappingSummary,
  };
}
