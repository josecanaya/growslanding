-- Run on a disposable database containing the application schema and migrations.
begin;
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); org uuid := gen_random_uuid();
  node_id uuid := gen_random_uuid(); foreign_id uuid := gen_random_uuid();
  snap jsonb; saved jsonb; baseline jsonb;
begin
  -- These minimal inserts target the isolated fixture used in local verification.
  insert into organizations(id) values(org);
  insert into obras(id,org_id,name,canvas_ui) values(a,org,'A','{}'),(b,org,'B','{}');
  snap := jsonb_build_object('obrasPatch',jsonb_build_object('name','Saved','canvas_ui',jsonb_build_object('pathIds','[]'::jsonb)),
    'nodes',jsonb_build_array(jsonb_build_object('id',node_id,'type','estado','title','State A','metadata','{}'::jsonb,'is_summary',false,'is_critical',false,'created_at',now())),
    'edges','[]'::jsonb,'budgetGroups','[]'::jsonb,'checklistItems','[]'::jsonb,'budgetGroupTasks','[]'::jsonb);
  saved := save_canvas_snapshot(a,org,0,snap);
  assert saved->>'revision'='1','first save increments revision';
  assert (read_canvas_snapshot(a,org)->'nodes'->0->>'title')='State A','read full snapshot';
  -- Existing IDs survive a save: no deletion/recreation that would clear external FKs.
  create table canvas_test_task(node_id uuid references canvas_nodes(id) on delete set null);
  insert into canvas_test_task values(node_id);
  perform save_canvas_snapshot(a,org,1,snap);
  assert (select count(*) from canvas_test_task where canvas_test_task.node_id is not null)=1,'preserve operational task links';
  baseline := read_canvas_snapshot(a,org);
  begin
    perform save_canvas_snapshot(a,org,1,snap);
    raise exception 'Expected revision conflict';
  exception when serialization_failure then null;
  end;
  assert read_canvas_snapshot(a,org)=baseline,'conflict preserves snapshot';
  -- Force an insert error after nodes were updated, proving all statements roll back.
  snap := jsonb_set(snap,'{nodes,0,title}','"Changed"'::jsonb);
  snap := jsonb_set(snap,'{edges}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'source_node_id',node_id,'target_node_id',node_id,'type','precedencia','is_critical',null,'lag_days',0)));
  begin
    perform save_canvas_snapshot(a,org,2,snap);
    raise exception 'Expected not-null failure';
  exception when not_null_violation then null;
  end;
  assert read_canvas_snapshot(a,org)=baseline,'late failure rolls back previous updates';
  snap := jsonb_set(snap,'{edges}','[]');
  insert into canvas_nodes(id,obra_id,org_id,type,title) values(foreign_id,b,org,'estado','Foreign');
  begin
    perform save_canvas_snapshot(a,org,2,jsonb_set(snap,'{nodes,0,id}',to_jsonb(foreign_id)));
    raise exception 'Expected foreign ID rejection';
  exception when insufficient_privilege then null;
  end;
  assert (select title from canvas_nodes where id=foreign_id)='Foreign','other obra untouched';
  begin
    perform save_canvas_snapshot(a,org,2,jsonb_set(snap,'{nodes,0,from_node_id}',to_jsonb(foreign_id)));
    raise exception 'Expected foreign reference rejection';
  exception when invalid_parameter_value then null;
  end;
  assert read_canvas_snapshot(a,org)=baseline,'foreign reference rejection preserves data';
  begin
    perform save_canvas_snapshot(a,org,2,snap-'nodes');
    raise exception 'Expected incomplete snapshot rejection';
  exception when invalid_parameter_value then null;
  end;
  assert not has_function_privilege('authenticated','public.save_canvas_snapshot(uuid,uuid,bigint,jsonb)','execute'),'authenticated cannot bypass server authorization';
  assert not has_function_privilege('anon','public.read_canvas_snapshot(uuid,uuid)','execute'),'anonymous cannot read';
  raise notice 'PASS: revision, read, stable IDs/FKs, late rollback, cross-obra IDs/references, incomplete payload and ACL';
end $$;
rollback;

