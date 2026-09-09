-- Atomic snapshots. These RPCs are server-only; API verifies owner/accepted leader.
create or replace function public.read_canvas_snapshot(p_obra_id uuid, p_org_id uuid)
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'obra', to_jsonb(o), 'revision', coalesce((o.canvas_ui->>'revision')::bigint, 0),
    'nodes', coalesce((select jsonb_agg(n) from public.canvas_nodes n where n.obra_id=o.id),'[]'::jsonb),
    'edges', coalesce((select jsonb_agg(e) from public.canvas_edges e where e.obra_id=o.id),'[]'::jsonb),
    'budgetGroups', coalesce((select jsonb_agg(g) from public.canvas_budget_groups g where g.obra_id=o.id),'[]'::jsonb),
    'checklistItems', coalesce((select jsonb_agg(c) from public.canvas_task_checklist_items c where c.obra_id=o.id),'[]'::jsonb),
    'budgetGroupTasks', coalesce((select jsonb_agg(t) from public.canvas_budget_group_tasks t where t.obra_id=o.id),'[]'::jsonb)
  ) from public.obras o where o.id=p_obra_id and o.org_id=p_org_id;
$$;
revoke all on function public.read_canvas_snapshot(uuid,uuid) from public, anon, authenticated;
grant execute on function public.read_canvas_snapshot(uuid,uuid) to service_role;

create or replace function public.save_canvas_snapshot(p_obra_id uuid, p_org_id uuid, p_expected_revision bigint, p_snapshot jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_ui jsonb;
  v_revision bigint;
  v_key text;
  v_table text;
  v_collision boolean;
  v_node_ids uuid[];
  v_group_ids uuid[];
begin
  select coalesce(canvas_ui,'{}'::jsonb) into v_ui from public.obras
    where id=p_obra_id and org_id=p_org_id for update;
  if not found then raise exception 'Obra no autorizada' using errcode='42501'; end if;
  v_revision := coalesce((v_ui->>'revision')::bigint,0);
  if p_expected_revision is null or p_expected_revision <> v_revision then
    raise exception 'Canvas revision conflict' using errcode='40001';
  end if;
  foreach v_key in array array['nodes','edges','budgetGroups','checklistItems','budgetGroupTasks'] loop
    if jsonb_typeof(p_snapshot->v_key) is distinct from 'array' then
      raise exception 'Incomplete snapshot' using errcode='22023';
    end if;
  end loop;
  if jsonb_typeof(p_snapshot->'obrasPatch') is distinct from 'object' then
    raise exception 'Missing obra data' using errcode='22023';
  end if;
  select coalesce(array_agg((x->>'id')::uuid),array[]::uuid[]) into v_node_ids from jsonb_array_elements(p_snapshot->'nodes') x;
  select coalesce(array_agg((x->>'id')::uuid),array[]::uuid[]) into v_group_ids from jsonb_array_elements(p_snapshot->'budgetGroups') x;
  -- A UUID belonging to another obra is never deleted, adopted or updated.
  for v_key,v_table in select * from (values ('nodes','canvas_nodes'),('edges','canvas_edges'),('budgetGroups','canvas_budget_groups'),('checklistItems','canvas_task_checklist_items')) as pairs(k,t) loop
    execute format('select exists(select 1 from public.%I r join jsonb_array_elements($1) x on r.id=(x->>''id'')::uuid where r.obra_id<>$2)',v_table)
      into v_collision using p_snapshot->v_key,p_obra_id;
    if v_collision then raise exception 'Cross obra ID' using errcode='42501'; end if;
    if exists(select 1 from jsonb_array_elements(p_snapshot->v_key) x where x->>'id' is null) or
      (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(p_snapshot->v_key) x) then
      raise exception 'Missing or duplicate ID' using errcode='22023';
    end if;
  end loop;
  -- Validate every reference against the incoming snapshot, before touching any row.
  if exists(select 1 from jsonb_array_elements(p_snapshot->'nodes') x where
    (x->>'parent_id' is not null and not (x->>'parent_id')::uuid=any(v_node_ids)) or
    (x->>'from_node_id' is not null and not (x->>'from_node_id')::uuid=any(v_node_ids)) or
    (x->>'to_node_id' is not null and not (x->>'to_node_id')::uuid=any(v_node_ids)) or
    (x->>'budget_group_id' is not null and not (x->>'budget_group_id')::uuid=any(v_group_ids))) or
    exists(select 1 from jsonb_array_elements(p_snapshot->'edges') x where
      x->>'source_node_id' is null or x->>'target_node_id' is null or
      not (x->>'source_node_id')::uuid=any(v_node_ids) or not (x->>'target_node_id')::uuid=any(v_node_ids)) or
    exists(select 1 from jsonb_array_elements(p_snapshot->'checklistItems') x where
      x->>'task_node_id' is null or not (x->>'task_node_id')::uuid=any(v_node_ids)) or
    exists(select 1 from jsonb_array_elements(p_snapshot->'budgetGroupTasks') x where
      x->>'task_node_id' is null or x->>'budget_group_id' is null or
      not (x->>'task_node_id')::uuid=any(v_node_ids) or not (x->>'budget_group_id')::uuid=any(v_group_ids)) then
    raise exception 'Invalid canvas reference' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_snapshot->'budgetGroups') x
    where x->>'scheduled_socio_id' is not null and not exists (
      select 1 from public.socios s where s.id=(x->>'scheduled_socio_id')::uuid and s.org_id=p_org_id)) then
    raise exception 'Socio outside organization' using errcode='42501';
  end if;
  insert into public.canvas_budget_groups (id, obra_id, org_id, name, description, status, created_at, scheduled_socio_id, mensaje_socio_borrador)
    select r.id, p_obra_id, p_org_id, r.name, r.description, 'borrador', r.created_at, r.scheduled_socio_id, r.mensaje_socio_borrador from jsonb_populate_recordset(null::public.canvas_budget_groups,p_snapshot->'budgetGroups') r
    on conflict (id) do update set name=excluded.name, description=excluded.description, scheduled_socio_id=excluded.scheduled_socio_id, mensaje_socio_borrador=excluded.mensaje_socio_borrador, updated_at=now()
    where canvas_budget_groups.obra_id=p_obra_id;
  insert into public.canvas_nodes (id, obra_id, org_id, parent_id, type, title, description, status, planned_duration_days, progress, position_x, position_y, sort_order, project_source, project_uid, project_outline_level, project_outline_number, is_summary, is_critical, budget_group_id, metadata, created_at, transform_kind, from_node_id, to_node_id, executor_kind, executor_ref, graph_status, energy_unit_id, energy_quantity, capital_amount, capital_currency)
    select r.id, p_obra_id, p_org_id, r.parent_id, r.type, r.title, r.description, r.status, r.planned_duration_days, r.progress, r.position_x, r.position_y, r.sort_order, r.project_source, r.project_uid, r.project_outline_level, r.project_outline_number, r.is_summary, r.is_critical, r.budget_group_id, r.metadata, r.created_at, r.transform_kind, r.from_node_id, r.to_node_id, r.executor_kind, r.executor_ref, r.graph_status, r.energy_unit_id, r.energy_quantity, r.capital_amount, r.capital_currency from jsonb_populate_recordset(null::public.canvas_nodes,p_snapshot->'nodes') r
    on conflict (id) do update set parent_id=excluded.parent_id, type=excluded.type, title=excluded.title, description=excluded.description, status=case when exists (select 1 from public.tareas t where t.canvas_node_id=canvas_nodes.id and t.obra_id=p_obra_id) then canvas_nodes.status else excluded.status end, planned_duration_days=excluded.planned_duration_days, progress=case when exists (select 1 from public.tareas t where t.canvas_node_id=canvas_nodes.id and t.obra_id=p_obra_id) then canvas_nodes.progress else excluded.progress end, position_x=excluded.position_x, position_y=excluded.position_y, sort_order=excluded.sort_order, project_source=excluded.project_source, project_uid=excluded.project_uid, project_outline_level=excluded.project_outline_level, project_outline_number=excluded.project_outline_number, is_summary=excluded.is_summary, is_critical=excluded.is_critical, budget_group_id=excluded.budget_group_id, transform_kind=excluded.transform_kind, from_node_id=excluded.from_node_id, to_node_id=excluded.to_node_id, executor_kind=excluded.executor_kind, executor_ref=excluded.executor_ref, graph_status=case when canvas_nodes.graph_status='realizado' or exists (select 1 from public.tareas t where t.canvas_node_id=canvas_nodes.id and t.obra_id=p_obra_id) then canvas_nodes.graph_status else excluded.graph_status end, energy_unit_id=excluded.energy_unit_id, energy_quantity=excluded.energy_quantity, capital_amount=excluded.capital_amount, capital_currency=excluded.capital_currency, metadata=canvas_nodes.metadata || excluded.metadata, updated_at=now()
    where canvas_nodes.obra_id=p_obra_id;
  insert into public.canvas_edges (id, obra_id, org_id, source_node_id, target_node_id, type, is_critical, lag_days)
    select r.id, p_obra_id, p_org_id, r.source_node_id, r.target_node_id, r.type, r.is_critical, r.lag_days from jsonb_populate_recordset(null::public.canvas_edges,p_snapshot->'edges') r
    on conflict (id) do update set source_node_id=excluded.source_node_id, target_node_id=excluded.target_node_id, type=excluded.type, is_critical=excluded.is_critical, lag_days=excluded.lag_days, updated_at=now()
    where canvas_edges.obra_id=p_obra_id;
  insert into public.canvas_task_checklist_items (id, obra_id, org_id, task_node_id, title, done, sort_order)
    select r.id, p_obra_id, p_org_id, r.task_node_id, r.title, r.done, r.sort_order from jsonb_populate_recordset(null::public.canvas_task_checklist_items,p_snapshot->'checklistItems') r
    on conflict (id) do update set task_node_id=excluded.task_node_id, title=excluded.title, done=excluded.done, sort_order=excluded.sort_order, updated_at=now()
    where canvas_task_checklist_items.obra_id=p_obra_id;
  delete from public.canvas_budget_group_tasks where obra_id=p_obra_id;
  insert into public.canvas_budget_group_tasks (obra_id, org_id, budget_group_id, task_node_id)
    select p_obra_id, p_org_id, r.budget_group_id, r.task_node_id from jsonb_populate_recordset(null::public.canvas_budget_group_tasks,p_snapshot->'budgetGroupTasks') r
;
  -- Recheck after upserts: concurrent inserts of the same UUID in another obra must roll back.
  for v_key,v_table in select * from (values ('nodes','canvas_nodes'),('edges','canvas_edges'),('budgetGroups','canvas_budget_groups'),('checklistItems','canvas_task_checklist_items')) as pairs(k,t) loop
    execute format('select exists(select 1 from jsonb_array_elements($1) x left join public.%I r on r.id=(x->>''id'')::uuid and r.obra_id=$2 where r.id is null)',v_table)
      into v_collision using p_snapshot->v_key,p_obra_id;
    if v_collision then raise exception 'Concurrent cross obra ID' using errcode='42501'; end if;
  end loop;
  delete from public.canvas_edges where obra_id=p_obra_id and id not in (select (x->>'id')::uuid from jsonb_array_elements(p_snapshot->'edges') x);
  delete from public.canvas_task_checklist_items where obra_id=p_obra_id and id not in (select (x->>'id')::uuid from jsonb_array_elements(p_snapshot->'checklistItems') x);
  delete from public.canvas_nodes where obra_id=p_obra_id and id not in (select (x->>'id')::uuid from jsonb_array_elements(p_snapshot->'nodes') x);
  delete from public.canvas_budget_groups where obra_id=p_obra_id and id not in (select (x->>'id')::uuid from jsonb_array_elements(p_snapshot->'budgetGroups') x);
  update public.obras set
    name=coalesce(p_snapshot->'obrasPatch'->>'name',name),
    canvas_project_kind=coalesce(p_snapshot->'obrasPatch'->>'canvas_project_kind',canvas_project_kind),
    canvas_ui=v_ui || coalesce(p_snapshot->'obrasPatch'->'canvas_ui','{}'::jsonb) || jsonb_build_object('revision',v_revision+1)
    where id=p_obra_id and org_id=p_org_id;
  return jsonb_build_object('revision',v_revision+1,'nodeCount',cardinality(v_node_ids),'edgeCount',jsonb_array_length(p_snapshot->'edges'));
end;
$$;
revoke all on function public.save_canvas_snapshot(uuid,uuid,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.save_canvas_snapshot(uuid,uuid,bigint,jsonb) to service_role;
