const IN_FILTER_CHUNK = 100;

export async function resolveTaskNodeIdsForBudgetGroup(
  supabaseAny: any,
  obraId: string,
  dbGroupId: string,
): Promise<{ taskNodeIds: string[]; error: string | null }> {
  const { data: bgtRows, error: bgtErr } = await supabaseAny
    .from('canvas_budget_group_tasks')
    .select('task_node_id')
    .eq('obra_id', obraId)
    .eq('budget_group_id', dbGroupId);

  if (bgtErr) {
    return { taskNodeIds: [], error: bgtErr.message };
  }

  const { data: nodesInGroupRows, error: nbgErr } = await supabaseAny
    .from('canvas_nodes')
    .select('id')
    .eq('obra_id', obraId)
    .eq('type', 'tarea')
    .eq('budget_group_id', dbGroupId);

  if (nbgErr) {
    return { taskNodeIds: [], error: nbgErr.message };
  }

  const taskNodeIdSet = new Set<string>();
  for (const r of bgtRows ?? []) {
    const tid = (r as { task_node_id?: string }).task_node_id;
    if (tid) taskNodeIdSet.add(tid);
  }
  for (const r of nodesInGroupRows ?? []) {
    const id = (r as { id?: string }).id;
    if (id) taskNodeIdSet.add(id);
  }

  return { taskNodeIds: [...taskNodeIdSet], error: null };
}

export async function resolveTareaIdsForTaskNodes(
  supabaseAny: any,
  obraId: string,
  taskNodeIds: string[],
): Promise<{
  tareaIds: string[];
  canvasToTarea: Map<string, { id: string; dias_presupuesto: number; title: string | null }>;
  error: string | null;
}> {
  if (taskNodeIds.length === 0) {
    return { tareaIds: [], canvasToTarea: new Map(), error: null };
  }

  const merged: Array<{
    id: string;
    canvas_node_id: string | null;
    dias_presupuesto?: number | null;
    title?: string | null;
  }> = [];

  for (let i = 0; i < taskNodeIds.length; i += IN_FILTER_CHUNK) {
    const chunk = taskNodeIds.slice(i, i + IN_FILTER_CHUNK);
    const { data, error } = await supabaseAny
      .from('tareas')
      .select('id, canvas_node_id, dias_presupuesto, title')
      .eq('obra_id', obraId)
      .in('canvas_node_id', chunk);
    if (error) {
      return { tareaIds: [], canvasToTarea: new Map(), error: error.message };
    }
    merged.push(...(data ?? []));
  }

  const canvasToTarea = new Map<
    string,
    { id: string; dias_presupuesto: number; title: string | null }
  >();
  for (const t of merged) {
    const cid = t.canvas_node_id;
    if (cid) {
      canvasToTarea.set(cid, {
        id: t.id,
        dias_presupuesto: Math.max(1, Math.floor(Number(t.dias_presupuesto) || 1)),
        title: t.title ?? null,
      });
    }
  }

  return { tareaIds: [...canvasToTarea.values()].map((x) => x.id), canvasToTarea, error: null };
}

export async function countOfertoresEnGrupo(
  supabaseAny: any,
  tareaIds: string[],
): Promise<number> {
  if (tareaIds.length === 0) return 0;
  const socios = new Set<string>();
  for (let i = 0; i < tareaIds.length; i += IN_FILTER_CHUNK) {
    const chunk = tareaIds.slice(i, i + IN_FILTER_CHUNK);
    const { data } = await supabaseAny
      .from('tareas_presupuestos')
      .select('socio_id, estado')
      .in('tarea_id', chunk);
    for (const r of data ?? []) {
      const sid = (r as { socio_id?: string | null }).socio_id;
      if (!sid) continue;
      const e = String((r as { estado?: string | null }).estado ?? 'PENDIENTE').toUpperCase();
      if (e === 'PENDIENTE' || e === 'ENVIADO' || e === 'APROBADO' || e === 'ACEPTADO') {
        socios.add(sid);
      }
    }
  }
  return socios.size;
}

export async function grupoTienePresupuestoAprobado(
  supabaseAny: any,
  tareaIds: string[],
): Promise<boolean> {
  if (tareaIds.length === 0) return false;
  for (let i = 0; i < tareaIds.length; i += IN_FILTER_CHUNK) {
    const chunk = tareaIds.slice(i, i + IN_FILTER_CHUNK);
    const { data } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, estado')
      .in('tarea_id', chunk)
      .in('estado', ['APROBADO', 'ACEPTADO']);
    if ((data ?? []).length > 0) return true;
  }
  return false;
}
