create extension if not exists pg_cron;
create table if not exists public.project_automation_settings (
 id boolean primary key default true check(id), enabled boolean not null default true,
 org_id uuid not null references public.organizations(id), max_works integer not null default 100 check(max_works between 1 and 500),
 timezone text not null default 'America/Argentina/Buenos_Aires'
);
create table if not exists public.project_automation_runs (
 slot text primary key, started_at timestamptz not null default now(), completed_at timestamptz,
 obra_id uuid references public.obras(id), status text not null, detail text not null
);
alter table public.project_automation_settings enable row level security;
alter table public.project_automation_runs enable row level security;
revoke all on public.project_automation_settings,public.project_automation_runs from anon,authenticated;
grant select,update on public.project_automation_settings to service_role;
grant select on public.project_automation_runs to service_role;
insert into public.project_automation_settings(id,org_id) values(true,'948f6c0e-8f19-49db-b371-78f44ea17943') on conflict do nothing;

create or replace function grows_private.run_project_automation(p_slot text default null,p_mode text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.project_automation_settings%rowtype; base public.obras%rowtype; w public.obras%rowtype;
 slot_id text; local_time timestamp; mode text; nid uuid; pub jsonb; post jsonb; task_count int; post_count int;
begin
 if not pg_try_advisory_xact_lock(hashtext('grows:project-automation')) then return jsonb_build_object('status','ocupada'); end if;
 select * into cfg from public.project_automation_settings where id=true;
 if not cfg.enabled then return jsonb_build_object('status','pausada'); end if;
 local_time:=now() at time zone cfg.timezone;
 mode:=coalesce(p_mode,case when extract(hour from local_time)<15 then 'crear' else 'publicar' end);
 if mode not in ('crear','publicar') then raise exception 'Modo inválido'; end if;
 slot_id:=coalesce(p_slot,to_char(local_time,'YYYY-MM-DD')||':'||mode);
 if exists(select 1 from public.project_automation_runs where slot=slot_id) then return jsonb_build_object('status','ya_ejecutada','slot',slot_id); end if;
 begin
 if mode='crear' then
 if (select count(*) from public.obras where org_id=cfg.org_id and canvas_ui->'ensayo' is not null)>=cfg.max_works then
 insert into public.project_automation_runs(slot,status,detail,completed_at) values(slot_id,'limite','Se alcanzó el máximo de obras de ensayo configurado.',now());
 return jsonb_build_object('status','limite'); end if;
 select * into base from public.obras o where org_id=cfg.org_id and canvas_ui->'ensayo'->>'batch'='grows-50-obras-20261119' and not exists(select 1 from public.project_rounds r where r.obra_id=o.id) order by md5(o.id::text||slot_id) limit 1;
 if base.id is null then raise exception 'Falta una plantilla de ensayo disponible.'; end if;
 nid:=md5('grows:auto:'||slot_id)::uuid;
 pub:=(base.canvas_ui->'publication')||jsonb_build_object('title',base.name||' · ensayo '||to_char(local_time,'DD-MM-YYYY')||' '||left(nid::text,4),'progress',0,'stage','Planificación · ensayo','simulation',null,'milestones',(select jsonb_agg(jsonb_build_object('title',m->>'title','status','pendiente')) from jsonb_array_elements(base.canvas_ui->'publication'->'milestones') m),'posts','[]'::jsonb,'publishedAt',now(),'summary','Nueva obra de prueba generada desde una planificación revisable de GROWS. Alcance y pliegos pendientes de aprobación. Imágenes conceptuales de referencia.','sisterIds',jsonb_build_array(base.id));
 insert into public.obras(id,org_id,name,address,estado,tipo_obra,plantas,terreno,m2_estimados,canvas_project_kind,objetivo_texto,canvas_ui)
 values(nid,cfg.org_id,pub->>'title',base.address,'en_curso',base.tipo_obra,base.plantas,base.terreno,base.m2_estimados,base.canvas_project_kind,base.objetivo_texto,jsonb_build_object('publication',pub,'ensayo',(base.canvas_ui->'ensayo')||jsonb_build_object('batch','grows-auto-studio','template',base.id,'slot',slot_id)));
 insert into public.canvas_budget_groups(id,obra_id,org_id,name,description,status) select md5(nid::text||id::text)::uuid,nid,org_id,name,description,'borrador' from public.canvas_budget_groups where obra_id=base.id;
 insert into public.canvas_nodes(id,obra_id,org_id,parent_id,type,title,description,status,planned_duration_days,progress,position_x,position_y,sort_order,budget_group_id,metadata,capital_amount,capital_currency,executor_kind)
 select md5(nid::text||id::text)::uuid,nid,org_id,case when parent_id is null then null else md5(nid::text||parent_id::text)::uuid end,type,title,description,'pendiente',planned_duration_days,0,position_x,position_y,sort_order,case when budget_group_id is null then null else md5(nid::text||budget_group_id::text)::uuid end,metadata,capital_amount,capital_currency,'sin_asignar' from public.canvas_nodes where obra_id=base.id;
 insert into public.canvas_edges(id,obra_id,org_id,source_node_id,target_node_id,type,lag_days,metadata) select md5(nid::text||id::text)::uuid,nid,org_id,md5(nid::text||source_node_id::text)::uuid,md5(nid::text||target_node_id::text)::uuid,type,lag_days,metadata from public.canvas_edges where obra_id=base.id;
 insert into public.canvas_budget_group_tasks(id,obra_id,org_id,budget_group_id,task_node_id) select md5(nid::text||id::text)::uuid,nid,org_id,md5(nid::text||budget_group_id::text)::uuid,md5(nid::text||task_node_id::text)::uuid from public.canvas_budget_group_tasks where obra_id=base.id;
 insert into public.canvas_task_checklist_items(id,obra_id,org_id,task_node_id,title,done,sort_order) select md5(nid::text||id::text)::uuid,nid,org_id,md5(nid::text||task_node_id::text)::uuid,title,false,sort_order from public.canvas_task_checklist_items where obra_id=base.id;
 select * into w from public.obras where id=nid;
 else
 select * into w from public.obras where org_id=cfg.org_id and canvas_ui->'ensayo'->>'batch' in ('grows-auto-studio','grows-50-obras-20261119','grows-10-obras-20261118') and jsonb_array_length(coalesce(canvas_ui->'publication'->'posts','[]'))<95 order by updated_at,id limit 1 for update;
 if w.id is null then raise exception 'No hay obras de ensayo disponibles para publicar.'; end if;
 end if;
 select count(*) into task_count from public.canvas_nodes where obra_id=w.id and type='tarea';
 select count(*) into post_count from public.canvas_budget_groups where obra_id=w.id;
 post:=jsonb_build_object('id',md5('grows:auto:post:'||slot_id)::uuid,'title',case when mode='crear' then 'Una nueva obra se suma a GROWS' else 'La planificación de nuestra obra' end,
 'text',w.name||': el plan cargado contiene '||task_count||' tareas y '||post_count||' pliegos. Próximo paso: revisar alcance, presupuesto y dependencias antes de contratar. Obra ficticia de ensayo; imagen conceptual de referencia.',
 'author','Equipo de proyecto','publishedAt',now(),'coverUrl',w.canvas_ui->'publication'->>'coverUrl','category','planificacion');
 update public.obras set canvas_ui=jsonb_set(canvas_ui,'{publication,posts}',coalesce(canvas_ui->'publication'->'posts','[]')||jsonb_build_array(post))||jsonb_build_object('revision',coalesce((canvas_ui->>'revision')::bigint,0)+1),updated_at=now() where id=w.id;
 insert into public.project_automation_runs(slot,obra_id,status,detail,completed_at) values(slot_id,w.id,'aprobado',case when mode='crear' then 'Obra inicial, plan, pliegos y publicación creados.' else 'Publicación generada desde las tareas y pliegos persistidos.' end,now());
 return jsonb_build_object('status','aprobado','slot',slot_id,'obra',w.id,'tasks',task_count);
 exception when others then
 insert into public.project_automation_runs(slot,status,detail,completed_at) values(slot_id,'fallido',left(sqlerrm,500),now()) on conflict do nothing;
 return jsonb_build_object('status','fallido','detail',left(sqlerrm,500));
 end;
end $$;
revoke all on function grows_private.run_project_automation(text,text) from public,anon,authenticated,service_role;
select cron.schedule('grows-studio-manana','0 12 * * *',$cron$set statement_timeout='45s'; select grows_private.run_project_automation();$cron$);
select cron.schedule('grows-studio-tarde','0 21 * * *',$cron$set statement_timeout='45s'; select grows_private.run_project_automation();$cron$);

create or replace function public.project_automation_control(p_actor uuid,p_action text,p_request uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.project_automation_settings s join public.organizations o on o.id=s.org_id where s.id and o.user_id=p_actor) then raise exception 'Solo el titular puede administrar la carga automática.' using errcode='42501'; end if;
 if p_action in ('pause','resume') then
 update public.project_automation_settings set enabled=(p_action='resume') where id;
 return jsonb_build_object('status',case when p_action='resume' then 'activa' else 'pausada' end);
 elsif p_action in ('crear','publicar') and p_request is not null then
 return grows_private.run_project_automation('manual:'||p_request::text,p_action);
 end if;
 raise exception 'Acción inválida' using errcode='22023';
end $$;
revoke all on function public.project_automation_control(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.project_automation_control(uuid,text,uuid) to service_role;
