import type {
  CanvasBudgetGroup,
  CanvasChecklistItem,
  CanvasMultinivelPersisted,
  CanvasNode,
  CanvasNivelTipo,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import { normalizeCanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';

const UUID_CORE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** Extrae UUID para filas Supabase desde ids con prefijo cn-/ce-/bg-/cl- o UUID puro. */
export function toDbUuidFromCanvasId(clientId: string): string {
  const m = clientId.trim().toLowerCase().match(/^(cn|ce|bg|cl)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/);
  if (m) return m[2]!;
  const pure = clientId.trim().toLowerCase();
  if (UUID_CORE.test(pure) && pure.length === 36) return pure;
  throw new Error(`ID de canvas no válido para Supabase: ${clientId}`);
}

export function toClientNodeId(dbUuid: string): string {
  return `cn-${dbUuid.toLowerCase()}`;
}

export function toClientEdgeId(dbUuid: string): string {
  return `ce-${dbUuid.toLowerCase()}`;
}

export function toClientBudgetGroupId(dbUuid: string): string {
  return `bg-${dbUuid.toLowerCase()}`;
}

export function toClientChecklistId(dbUuid: string): string {
  return `cl-${dbUuid.toLowerCase()}`;
}

type DbNodeRow = {
  id: string;
  obra_id: string;
  org_id: string | null;
  parent_id: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string | null;
  planned_duration_days: number | null;
  progress: number | null;
  position_x: number | null;
  position_y: number | null;
  sort_order: number | null;
  project_source: string | null;
  project_uid: string | null;
  project_outline_level: number | null;
  project_outline_number: string | null;
  is_summary: boolean;
  is_critical: boolean;
  budget_group_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type DbEdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  type: string;
  is_critical: boolean;
  lag_days: number;
};

type DbBgRow = {
  id: string;
  obra_id?: string;
  org_id?: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  scheduled_socio_id?: string | null;
  mensaje_socio_borrador?: string | null;
  change_window_status?: string | null;
  change_window_notes?: string | null;
  approved_at?: string | null;
  bolsa_publicada?: boolean | null;
  publicado_a_agenda?: boolean | null;
  pliego_publicado_at?: string | null;
};

type DbCheckRow = {
  id: string;
  task_node_id: string;
  title: string;
  done: boolean;
  sort_order: number | null;
};

type DbBgTaskRow = {
  budget_group_id: string;
  task_node_id: string;
}

export function persistedToSupabaseRows(
  obraId: string,
  orgId: string,
  data: CanvasMultinivelPersisted,
): {
  obrasPatch: Record<string, unknown>;
  budgetGroups: DbBgRow[];
  nodes: DbNodeRow[];
  edges: DbEdgeRow[];
  checklistItems: DbCheckRow[];
  budgetGroupTasks: DbBgTaskRow[];
} {
  const projectKind = normalizeCanvasProjectKind(data.projectKind);
  const obrasPatch = {
    name: data.obraNombre.trim() || 'Obra',
    canvas_project_kind: projectKind,
    canvas_ui: { pathIds: data.pathIds },
  };

  const budgetGroups: DbBgRow[] = (data.budgetGroups ?? []).map((g) => {
    const id = toDbUuidFromCanvasId(g.id);
    return {
      id,
      obra_id: obraId,
      org_id: orgId,
      name: g.name?.trim() || 'Grupo',
      description: g.description ?? null,
      status: (g.status && String(g.status).trim()) || 'borrador',
      created_at: g.createdAt ?? new Date().toISOString(),
      scheduled_socio_id: g.scheduledSocioId ?? null,
      mensaje_socio_borrador: g.mensajeSocioBorrador ?? null,
    };
  });

  const sortedNodes = [...data.nodes].sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));

  const nodes: DbNodeRow[] = sortedNodes.map((n, idx) => {
    let uuid: string;
    try {
      uuid = toDbUuidFromCanvasId(n.id);
    } catch {
      throw new Error(`Nodo "${n.title}" tiene id no migrable. Recreá el nodo o reimportá el proyecto.`);
    }
    const parentUuid =
      n.parentId == null ? null : toDbUuidFromCanvasId(n.parentId);

    const status =
      n.type === 'tarea'
        ? n.estadoTarea ?? null
        : n.estadoNivel ?? null;

    let budgetGroupUuid: string | null = null;
    if (n.type === 'tarea' && n.budgetGroupId) {
      try {
        budgetGroupUuid = toDbUuidFromCanvasId(n.budgetGroupId);
      } catch {
        budgetGroupUuid = null;
      }
    }

    const meta: Record<string, unknown> = {
      level: n.level,
      tipoLabel: n.tipoLabel,
      notas: n.notas,
      socioLabel: n.socioLabel,
    };

    const projectUid =
      n.importSourceUid != null ? String(n.importSourceUid) : null;

    return {
      id: uuid,
      obra_id: obraId,
      org_id: orgId,
      parent_id: parentUuid,
      type: n.type,
      title: n.title,
      description: n.descripcion ?? null,
      status,
      planned_duration_days: n.duracionDias ?? null,
      progress: n.avancePct ?? null,
      position_x: n.position?.x ?? null,
      position_y: n.position?.y ?? null,
      sort_order: idx,
      project_source: n.importSourceUid != null ? 'microsoft_project_xml' : null,
      project_uid: projectUid,
      project_outline_level: null,
      project_outline_number: n.importOutlineNumber ?? null,
      is_summary: false,
      is_critical: Boolean(n.esCritica),
      budget_group_id: budgetGroupUuid,
      metadata: meta,
      created_at: n.createdAt ?? new Date().toISOString(),
    };
  });

  const edges: DbEdgeRow[] = (data.edges ?? []).map((e) => ({
    id: toDbUuidFromCanvasId(e.id),
    source_node_id: toDbUuidFromCanvasId(e.sourceId),
    target_node_id: toDbUuidFromCanvasId(e.targetId),
    type: 'precedencia',
    is_critical: Boolean(e.critical),
    lag_days: 0,
  }));

  const checklistItems: DbCheckRow[] = [];
  for (const n of data.nodes) {
    if (n.type !== 'tarea' || !Array.isArray(n.checklist)) continue;
    const tid = toDbUuidFromCanvasId(n.id);
    n.checklist.forEach((c, i) => {
      checklistItems.push({
        id: toDbUuidFromCanvasId(c.id),
        task_node_id: tid,
        title: c.label?.trim() || 'Ítem',
        done: Boolean(c.done),
        sort_order: i,
      });
    });
  }

  const budgetGroupTasks: DbBgTaskRow[] = [];
  for (const n of data.nodes) {
    if (n.type !== 'tarea' || !n.budgetGroupId) continue;
    try {
      budgetGroupTasks.push({
        budget_group_id: toDbUuidFromCanvasId(n.budgetGroupId),
        task_node_id: toDbUuidFromCanvasId(n.id),
      });
    } catch {
      /* ignore bad group ref */
    }
  }

  return { obrasPatch, budgetGroups, nodes, edges, checklistItems, budgetGroupTasks };
}

export function supabaseRowsToPersisted(input: {
  obra: {
    id: string;
    name: string;
    canvas_project_kind?: string | null;
    canvas_ui?: unknown;
  };
  budgetGroups: DbBgRow[];
  nodes: DbNodeRow[];
  edges: DbEdgeRow[];
  checklistItems: DbCheckRow[];
  budgetGroupTasks?: DbBgTaskRow[];
}): CanvasMultinivelPersisted {
  const canvasUi = input.obra.canvas_ui as { pathIds?: string[] } | null | undefined;
  const pathIdsRaw = Array.isArray(canvasUi?.pathIds) ? canvasUi!.pathIds! : [];

  const checklistByTask = new Map<string, CanvasChecklistItem[]>();
  const checklistSorted = [...input.checklistItems].sort((a, b) => {
    if (a.task_node_id !== b.task_node_id) {
      return a.task_node_id.localeCompare(b.task_node_id);
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  for (const row of checklistSorted) {
    const tid = toClientNodeId(row.task_node_id);
    const item: CanvasChecklistItem = {
      id: toClientChecklistId(row.id),
      label: row.title,
      done: row.done,
    };
    const arr = checklistByTask.get(tid) ?? [];
    arr.push(item);
    checklistByTask.set(tid, arr);
  }

  const nodes: CanvasNode[] = input.nodes.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const level = typeof meta.level === 'number' ? meta.level : 1;
    const base: CanvasNode = {
      id: toClientNodeId(row.id),
      parentId: row.parent_id ? toClientNodeId(row.parent_id) : null,
      level,
      type: row.type as CanvasNivelTipo,
      title: row.title,
      position: {
        x: Number(row.position_x ?? 0),
        y: Number(row.position_y ?? 0),
      },
      createdAt: row.created_at,
    };

    if (typeof meta.notas === 'string') base.notas = meta.notas;
    if (typeof meta.tipoLabel === 'string') base.tipoLabel = meta.tipoLabel;
    if (typeof meta.socioLabel === 'string') base.socioLabel = meta.socioLabel;

    if (row.description) base.descripcion = row.description;

    if (row.type === 'tarea') {
      if (row.status) base.estadoTarea = row.status as CanvasNode['estadoTarea'];
      if (row.planned_duration_days != null) base.duracionDias = Number(row.planned_duration_days);
      base.esCritica = row.is_critical;
      base.checklist = checklistByTask.get(base.id) ?? [];
      if (row.budget_group_id) {
        base.budgetGroupId = toClientBudgetGroupId(row.budget_group_id);
      }
      if (row.project_uid) {
        const uid = parseInt(row.project_uid, 10);
        if (!Number.isNaN(uid)) base.importSourceUid = uid;
      }
      if (row.project_outline_number) base.importOutlineNumber = row.project_outline_number;
    } else {
      if (row.status) base.estadoNivel = row.status as CanvasNode['estadoNivel'];
      if (row.progress != null) base.avancePct = Number(row.progress);
    }

    return base;
  });

  const edges: CanvasPrecedenceEdge[] = input.edges.map((row) => ({
    id: toClientEdgeId(row.id),
    sourceId: toClientNodeId(row.source_node_id),
    targetId: toClientNodeId(row.target_node_id),
    critical: row.is_critical,
  }));

  const budgetGroups: CanvasBudgetGroup[] = input.budgetGroups.map((g) => {
    const row = g as DbBgRow;
    return {
      id: toClientBudgetGroupId(g.id),
      name: g.name,
      description: g.description ?? undefined,
      createdAt: g.created_at,
      status: row.status ?? 'borrador',
      scheduledSocioId: row.scheduled_socio_id ?? null,
      mensajeSocioBorrador: row.mensaje_socio_borrador ?? null,
      changeWindowStatus: row.change_window_status ?? 'cerrada',
      changeWindowNotes: row.change_window_notes ?? null,
      bolsaPublicada: Boolean(row.bolsa_publicada),
      publicadoAAgenda: Boolean(row.publicado_a_agenda),
      pliegoPublicadoAt: row.pliego_publicado_at ?? null,
    };
  });

  const pathIds = pathIdsRaw.filter((id) => {
    try {
      return nodes.some((n) => n.id === id);
    } catch {
      return false;
    }
  });

  return {
    v: 4 as const,
    obraNombre: input.obra.name,
    nodes,
    pathIds,
    edges,
    budgetGroups,
    projectKind: normalizeCanvasProjectKind(input.obra.canvas_project_kind),
  };
}
