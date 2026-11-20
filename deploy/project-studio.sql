create schema if not exists grows_private;
revoke all on schema grows_private from public, anon, authenticated;

create table if not exists public.project_rounds (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id),
 version integer not null check(version>0), actor_id uuid not null references auth.users(id),
 goal numeric not null check(goal>0), closes date not null, conditions text not null,
 snapshot jsonb not null, fingerprint text not null, created_at timestamptz not null default now(),
 mode text not null default 'ensayo' check(mode='ensayo'), unique(obra_id,version)
);
create table if not exists public.project_change_notes (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id),
 actor_id uuid not null references auth.users(id), title text not null, reason text not null,
 amount numeric not null check(amount>=0), days integer not null check(days>=0),
 created_at timestamptz not null default now(), status text not null default 'pendiente_proxima_ronda'
);
create table if not exists public.project_requests (
 obra_id uuid not null references public.obras(id), request_id uuid not null,
 payload jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
 primary key(obra_id,request_id)
);
alter table public.project_rounds enable row level security;
alter table public.project_change_notes enable row level security;
alter table public.project_requests enable row level security;
revoke all on public.project_rounds,public.project_change_notes,public.project_requests from anon,authenticated;
grant select,insert on public.project_rounds,public.project_change_notes,public.project_requests to service_role;

create or replace function grows_private.immutable_round() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'La versión de ronda y sus notas son inalterables.' using errcode='23514'; end $$;
drop trigger if exists immutable_round on public.project_rounds;
create trigger immutable_round before update or delete on public.project_rounds for each row execute function grows_private.immutable_round();
drop trigger if exists immutable_change on public.project_change_notes;
create trigger immutable_change before update or delete on public.project_change_notes for each row execute function grows_private.immutable_round();

create or replace function grows_private.guard_funded_scope() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; locked boolean; keep_old jsonb; keep_new jsonb;
begin
 if tg_table_name='obras' then target:=case when tg_op='INSERT' then new.id else old.id end;
 elsif tg_op='DELETE' then target:=old.obra_id;
 else target:=new.obra_id; end if;
 if tg_op='UPDATE' and tg_table_name<>'obras' then
 if old.obra_id is distinct from new.obra_id then raise exception 'No se puede trasladar alcance entre obras.' using errcode='42501'; end if;
 end if;
 perform 1 from public.obras where id=target for update;
 select exists(select 1 from public.project_rounds where obra_id=target) into locked;
 if locked then
   if tg_op='UPDATE' then
     if tg_table_name='obras' then
       keep_old:=to_jsonb(old)-array['canvas_ui','updated_at','estado'];
       keep_new:=to_jsonb(new)-array['canvas_ui','updated_at','estado'];
       if keep_old=keep_new and (old.canvas_ui->'studio') is not distinct from (new.canvas_ui->'studio') then return new; end if;
     elsif tg_table_name='canvas_nodes' then
       keep_old:=to_jsonb(old)-array['status','progress','graph_status','updated_at','position_x','position_y','executor_kind','executor_ref'];
       keep_new:=to_jsonb(new)-array['status','progress','graph_status','updated_at','position_x','position_y','executor_kind','executor_ref'];
       if keep_old=keep_new then return new; end if;
     elsif tg_table_name='canvas_budget_groups' and (to_jsonb(old)-array['status','scheduled_socio_id','mensaje_socio_borrador','updated_at'])=(to_jsonb(new)-array['status','scheduled_socio_id','mensaje_socio_borrador','updated_at']) then return new;
     elsif tg_table_name='canvas_task_checklist_items' and (to_jsonb(old)-array['done','updated_at'])=(to_jsonb(new)-array['done','updated_at']) then return new;
     end if;
   end if;
   raise exception 'El alcance está congelado por la ronda. Registrá el cambio como adicional.' using errcode='23514';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
do $$ declare t text; begin
 foreach t in array array['obras','canvas_nodes','canvas_edges','canvas_budget_groups','canvas_budget_group_tasks','canvas_task_checklist_items'] loop
 execute format('drop trigger if exists guard_funded_scope on public.%I',t);
 execute format('create trigger guard_funded_scope before insert or update or delete on public.%I for each row execute function grows_private.guard_funded_scope()',t);
 end loop;
end $$;

create or replace function public.project_studio_action(p_obra uuid,p_actor uuid,p_request uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare w public.obras%rowtype; a text:=p_data->>'action'; prev public.project_requests%rowtype;
 s jsonb; r jsonb; group_id uuid; stage_id uuid; task_id uuid; x jsonb; dep text; phase text; post jsonb; other public.obras%rowtype; total numeric;
begin
 select * into w from public.obras where id=p_obra for update;
 if not found then raise exception 'Obra inexistente' using errcode='22023'; end if;
 if not exists(select 1 from public.organizations where id=w.org_id and user_id=p_actor) and not exists(
 select 1 from public.leader_invites l join auth.users u on u.id=p_actor where l.org_id=w.org_id and l.email=u.email and u.email_confirmed_at is not null and l.status='accepted') then
 raise exception 'Solo el proyectista responsable puede operar este espacio.' using errcode='42501'; end if;
 select * into prev from public.project_requests where obra_id=p_obra and request_id=p_request;
 if found then
 if prev.payload<>p_data then raise exception 'La solicitud ya se usó con otros datos.' using errcode='40001'; end if;
 return prev.result; end if;
 if a='profile' then
 update public.obras set canvas_ui=canvas_ui||jsonb_build_object('studio',p_data-'action','revision',coalesce((canvas_ui->>'revision')::bigint,0)+1),updated_at=now() where id=p_obra;
 r:=jsonb_build_object('message','Perfil del proyecto guardado.');
 elsif a='publication' then
 if exists(select 1 from jsonb_array_elements_text(coalesce(p_data->'publication'->'sisterIds','[]')) v where not exists(select 1 from public.obras sibling where sibling.id=v::uuid and sibling.org_id=w.org_id and sibling.id<>p_obra and sibling.canvas_ui->'publication'->>'visible'='true')) then raise exception 'Las obras hermanas deben estar publicadas y pertenecer a tu organización.' using errcode='22023'; end if;

 if coalesce((w.canvas_ui->>'revision')::bigint,0)<>(p_data->>'revision')::bigint then raise exception 'La obra cambió. Recargá antes de guardar.' using errcode='40001'; end if;
 post:=(p_data->'publication')||jsonb_build_object('publishedAt',now());
 if w.canvas_ui->'publication'->'simulation' is not null then post:=post||jsonb_build_object('simulation',w.canvas_ui->'publication'->'simulation'); end if;
 update public.obras set canvas_ui=canvas_ui||jsonb_build_object('publication',post,'revision',coalesce((canvas_ui->>'revision')::bigint,0)+1),updated_at=now() where id=p_obra;
 r:=jsonb_build_object('publication',post,'revision',coalesce((w.canvas_ui->>'revision')::bigint,0)+1);
 elsif a='import' then
 if jsonb_array_length(p_data->'tasks') not between 1 and 300 then raise exception 'Plan inválido' using errcode='22023'; end if;
 for phase in select distinct v->>'stage' from jsonb_array_elements(p_data->'tasks') v loop
 stage_id:=md5(p_obra::text||p_request::text||phase||'stage')::uuid;
 group_id:=md5(p_obra::text||p_request::text||phase||'group')::uuid;
 insert into public.canvas_nodes(id,obra_id,org_id,type,title,status,position_x,position_y) values(stage_id,p_obra,w.org_id,'etapa',phase,'pendiente',0,0);
 insert into public.canvas_budget_groups(id,obra_id,org_id,name,description,status) values(group_id,p_obra,w.org_id,phase,'Alcance importado por el proyectista. Cada tarea tiene cómputo, presupuesto y dependencias.','borrador');
 end loop;
 for x in select v from jsonb_array_elements(p_data->'tasks') v loop
 stage_id:=md5(p_obra::text||p_request::text||(x->>'stage')||'stage')::uuid;
 group_id:=md5(p_obra::text||p_request::text||(x->>'stage')||'group')::uuid;
 task_id:=md5(p_obra::text||p_request::text||(x->>'code'))::uuid;
 insert into public.canvas_nodes(id,obra_id,org_id,parent_id,type,title,description,status,planned_duration_days,progress,position_x,position_y,budget_group_id,metadata,capital_amount,capital_currency,executor_kind)
 values(task_id,p_obra,w.org_id,stage_id,'tarea',x->>'title',(x->>'quantity')||' '||(x->>'unit')||' × USD '||(x->>'unitPrice'),'pendiente',(x->>'duration')::numeric,0,(x->>'startDay')::numeric*10,100,group_id,x,(x->>'amount')::numeric,'USD','sin_asignar');
 insert into public.canvas_budget_group_tasks(obra_id,org_id,budget_group_id,task_node_id) values(p_obra,w.org_id,group_id,task_id);
 insert into public.canvas_task_checklist_items(obra_id,org_id,task_node_id,title,sort_order) values(p_obra,w.org_id,task_id,'Presentar medición, evidencia y aceptación del proyectista',0);
 end loop;
 for x in select v from jsonb_array_elements(p_data->'tasks') v loop
 for dep in select jsonb_array_elements_text(x->'dependsOn') loop
 insert into public.canvas_edges(obra_id,org_id,source_node_id,target_node_id,type) values(p_obra,w.org_id,md5(p_obra::text||p_request::text||dep)::uuid,md5(p_obra::text||p_request::text||(x->>'code'))::uuid,'precedencia');
 end loop; end loop;
 update public.obras set canvas_ui=canvas_ui||jsonb_build_object('revision',coalesce((canvas_ui->>'revision')::int,0)+1),updated_at=now() where id=p_obra;
 r:=jsonb_build_object('message','Plan y pliegos guardados en el canvas.','tasks',jsonb_array_length(p_data->'tasks'));
 elsif a='round' then
 if exists(select 1 from public.project_rounds where obra_id=p_obra) then raise exception 'Esta obra ya tiene una versión congelada. Registrá adicionales.' using errcode='23514'; end if;
 if w.canvas_ui->'studio' is null or w.canvas_ui->'studio'->>'delivery' is null or length(coalesce(w.canvas_ui->'studio'->>'description',''))<20 then raise exception 'Completá el perfil privado antes de abrir la ronda.' using errcode='22023'; end if;
 if not exists(select 1 from public.canvas_nodes where obra_id=p_obra and type='tarea') or exists(select 1 from public.canvas_nodes where obra_id=p_obra and type='tarea' and (planned_duration_days is null or planned_duration_days<=0 or capital_amount is null or capital_amount<0 or capital_currency is distinct from 'USD')) then raise exception 'Cada tarea necesita plazo y presupuesto en USD.' using errcode='22023'; end if;
 if exists(select 1 from public.canvas_nodes n where n.obra_id=p_obra and n.type='tarea' and not exists(select 1 from public.canvas_budget_group_tasks t where t.obra_id=p_obra and t.task_node_id=n.id)) then raise exception 'Agrupá todas las tareas en pliegos.' using errcode='22023'; end if;
 if exists(with recursive reach(origin,current) as (
 select source_node_id,target_node_id from public.canvas_edges where obra_id=p_obra
 union select r.origin,e.target_node_id from reach r join public.canvas_edges e on e.source_node_id=r.current and e.obra_id=p_obra
 ) select 1 from reach where origin=current) then raise exception 'Las dependencias contienen ciclos.' using errcode='22023'; end if;
 select sum(capital_amount) into total from public.canvas_nodes where obra_id=p_obra and type='tarea';
 if (p_data->>'goal')::numeric<=0 or (p_data->>'goal')::numeric>total or (p_data->>'closes')::date<=current_date or (w.canvas_ui->'studio'->>'delivery')::date<=(p_data->>'closes')::date or length(p_data->>'conditions')<80 then raise exception 'Revisá objetivo, cierre, entrega y condiciones. El objetivo de ensayo no puede superar el presupuesto de tareas.' using errcode='22023'; end if;
 s:=jsonb_build_object('obra',to_jsonb(w)-'canvas_ui','profile',w.canvas_ui->'studio','terms',p_data,
 'nodes',(select coalesce(jsonb_agg(to_jsonb(n) order by n.id),'[]') from public.canvas_nodes n where obra_id=p_obra),
 'edges',(select coalesce(jsonb_agg(to_jsonb(n) order by n.id),'[]') from public.canvas_edges n where obra_id=p_obra),
 'groups',(select coalesce(jsonb_agg(to_jsonb(n) order by n.id),'[]') from public.canvas_budget_groups n where obra_id=p_obra),
 'checks',(select coalesce(jsonb_agg(to_jsonb(n) order by n.id),'[]') from public.canvas_task_checklist_items n where obra_id=p_obra),
 'groupTasks',(select coalesce(jsonb_agg(to_jsonb(n) order by n.id),'[]') from public.canvas_budget_group_tasks n where obra_id=p_obra));
 insert into public.project_rounds(obra_id,version,actor_id,goal,closes,conditions,snapshot,fingerprint) values(p_obra,1,p_actor,(p_data->>'goal')::numeric,(p_data->>'closes')::date,p_data->>'conditions',s,encode(sha256(convert_to(s::text,'UTF8')),'hex')) returning jsonb_build_object('id',id,'version',version,'fingerprint',fingerprint,'message','Ronda de ensayo abierta y versión congelada.') into r;
 elsif a='change' then
 insert into public.project_change_notes(obra_id,actor_id,title,reason,amount,days) values(p_obra,p_actor,p_data->>'title',p_data->>'reason',(p_data->>'amount')::numeric,(p_data->>'days')::int) returning jsonb_build_object('id',id,'message','Adicional registrado para evaluar su financiación.') into r;
 elsif a='post' then
 if w.canvas_ui->'publication' is null then raise exception 'Prepará primero la publicación del proyecto.' using errcode='22023'; end if;
 if jsonb_array_length(coalesce(w.canvas_ui->'publication'->'posts','[]'))>=100 then raise exception 'Se alcanzó el límite de publicaciones de esta obra.' using errcode='22023'; end if;
 post:=jsonb_build_object('id',p_request,'title',p_data->>'title','text',p_data->>'text','coverUrl',p_data->>'coverUrl','category','proyecto','author',coalesce(w.canvas_ui->'studio'->>'title','Equipo de proyecto'),'publishedAt',now());
 update public.obras set canvas_ui=jsonb_set(canvas_ui,'{publication,posts}',coalesce(canvas_ui->'publication'->'posts','[]')||jsonb_build_array(post))||jsonb_build_object('revision',coalesce((canvas_ui->>'revision')::bigint,0)+1),updated_at=now() where id=p_obra;
 r:=jsonb_build_object('message','Novedad publicada en el feed.');
 elsif a='sister' then
 if w.canvas_ui->'publication' is null then raise exception 'Prepará primero la publicación del proyecto.' using errcode='22023'; end if;
 if jsonb_array_length(coalesce(w.canvas_ui->'publication'->'sisterIds','[]'))>=30 and not coalesce(w.canvas_ui->'publication'->'sisterIds','[]') @> jsonb_build_array(p_data->>'other') then raise exception 'Máximo 30 obras hermanas.' using errcode='22023'; end if;

 select * into other from public.obras where id=(p_data->>'other')::uuid;
 if other.id is null or other.org_id<>w.org_id or other.id=w.id or (other.canvas_ui->'publication'->>'visible') is distinct from 'true' then raise exception 'Elegí otra obra publicada de tu organización.' using errcode='22023'; end if;
 update public.obras set canvas_ui=jsonb_set(canvas_ui,'{publication,sisterIds}',coalesce(canvas_ui->'publication'->'sisterIds','[]')||jsonb_build_array(other.id))||jsonb_build_object('revision',coalesce((canvas_ui->>'revision')::bigint,0)+1) where id=p_obra and not coalesce(canvas_ui->'publication'->'sisterIds','[]') @> jsonb_build_array(other.id);
 r:=jsonb_build_object('message','Obra hermana vinculada.');
 else raise exception 'Acción inválida' using errcode='22023'; end if;
 insert into public.project_requests values(p_obra,p_request,p_data,r,now());
 return r;
end $$;
revoke all on function public.project_studio_action(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.project_studio_action(uuid,uuid,uuid,jsonb) to service_role;
