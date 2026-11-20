-- User-authorized delegation. No plaintext bearer/refresh/code/secret is stored.
create table public.connector_clients (
 id uuid primary key default gen_random_uuid(), name text not null,
 redirect_uris text[] not null, auth_method text not null check(auth_method in ('none','client_secret_post','client_secret_basic')),
 secret_hash text, created_at timestamptz not null default now()
);
create table public.connector_grants (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 org_id uuid references public.organizations(id), client_id uuid references public.connector_clients(id),
 name text not null, scopes text[] not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null, revoked_at timestamptz,
 check(cardinality(scopes)>0 and scopes <@ array['grows:public','grows:read','grows:plan','grows:publish','grows:rounds','grows:work'])
);
create table public.connector_codes (
 code_hash text primary key, grant_id uuid not null references public.connector_grants(id),
 client_id uuid not null references public.connector_clients(id), redirect_uri text not null,
 challenge text not null, resource text not null, expires_at timestamptz not null, used_at timestamptz
);
create table public.connector_tokens (
 id uuid primary key default gen_random_uuid(), grant_id uuid not null references public.connector_grants(id),
 access_hash text not null unique, refresh_hash text unique, resource text not null,
 expires_at timestamptz not null, refresh_expires_at timestamptz, refresh_used_at timestamptz, revoked_at timestamptz
);
create table public.connector_requests (
 grant_id uuid not null references public.connector_grants(id), request_id uuid not null, operation text not null,
 payload_hash text not null, status text not null default 'en_curso',
 started_at timestamptz not null default clock_timestamp(), completed_at timestamptz,
 http_status int, result jsonb, primary key(grant_id,request_id)
);
create index on public.connector_grants(user_id);
create index on public.connector_grants(org_id);
create index on public.connector_grants(client_id);
create index on public.connector_codes(grant_id);
create index on public.connector_codes(client_id);
create index on public.connector_tokens(grant_id);
create index on public.connector_requests(started_at);
create index on public.connector_clients(created_at);
do $$ declare t text; begin foreach t in array array['connector_clients','connector_grants','connector_codes','connector_tokens','connector_requests'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,insert,update on public.%I to service_role',t);
 end loop; end $$;

create function public.connector_exchange(p_kind text,p_hash text,p_client uuid,p_redirect text,p_challenge text,p_resource text,p_access text,p_refresh text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.connector_codes%rowtype; t public.connector_tokens%rowtype; g public.connector_grants%rowtype;
begin
 if p_kind='authorization_code' then
 select * into c from public.connector_codes where code_hash=p_hash for update;
 if c.code_hash is null or c.client_id<>p_client or c.redirect_uri<>p_redirect or c.challenge<>p_challenge or c.resource<>p_resource or c.used_at is not null or c.expires_at<=now() then return jsonb_build_object('error','invalid_grant'); end if;
 select * into g from public.connector_grants where id=c.grant_id for update;
 elsif p_kind='refresh_token' then
 select * into t from public.connector_tokens where refresh_hash=p_hash for update;
 if t.id is null then return jsonb_build_object('error','invalid_grant'); end if;
 select * into g from public.connector_grants where id=t.grant_id for update;
 if g.client_id<>p_client or t.resource<>p_resource then return jsonb_build_object('error','invalid_grant'); end if;
 if t.refresh_used_at is not null then
 update public.connector_grants set revoked_at=now() where id=g.id;
 return jsonb_build_object('error','invalid_grant');
 end if;
 if t.revoked_at is not null or t.refresh_expires_at is null or t.refresh_expires_at<=now() then return jsonb_build_object('error','invalid_grant'); end if;
 else return jsonb_build_object('error','unsupported_grant_type'); end if;
 if g.id is null or g.revoked_at is not null or g.expires_at<=now() then return jsonb_build_object('error','invalid_grant'); end if;
 if p_kind='authorization_code' then update public.connector_codes set used_at=now() where code_hash=p_hash;
 else update public.connector_tokens set refresh_used_at=now(),revoked_at=now() where id=t.id; end if;
 insert into public.connector_tokens(grant_id,access_hash,refresh_hash,resource,expires_at,refresh_expires_at)
 values(g.id,p_access,p_refresh,p_resource,least(now()+interval '1 hour',g.expires_at),g.expires_at);
 return jsonb_build_object('scope',array_to_string(g.scopes,' '),'expires_in',least(3600,greatest(0,extract(epoch from g.expires_at-now())::int)));
end $$;
revoke all on function public.connector_exchange(text,text,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.connector_exchange(text,text,uuid,text,text,text,text,text) to service_role;

-- Claiming an operation also serializes the per-connection rate limit. Unknown outcomes are never replayed automatically.
create function public.connector_claim(p_grant uuid,p_request uuid,p_operation text,p_payload text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.connector_grants%rowtype; r public.connector_requests%rowtype;
begin
 select * into g from public.connector_grants where id=p_grant for update;
 if g.id is null or g.revoked_at is not null or g.expires_at<=now() then raise exception 'Conexión vencida o revocada' using errcode='42501'; end if;
 select * into r from public.connector_requests where grant_id=p_grant and request_id=p_request;
 if found then
 if r.operation<>p_operation or r.payload_hash<>p_payload then return jsonb_build_object('conflict',true); end if;
 return jsonb_build_object('existing',true,'status',r.status,'http_status',r.http_status,'result',r.result);
 end if;
 if (select count(*) from public.connector_requests where grant_id=p_grant and started_at>now()-interval '1 minute')>=30 then return jsonb_build_object('limited',true); end if;
 insert into public.connector_requests(grant_id,request_id,operation,payload_hash) values(p_grant,p_request,p_operation,p_payload);
 return jsonb_build_object('claimed',true);
end $$;
revoke all on function public.connector_claim(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.connector_claim(uuid,uuid,text,text) to service_role;
-- Public DCR must not provide an unbounded write endpoint.
create function public.connector_registration_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtext('grows:connector-registration'));
 if (select count(*) from public.connector_clients where created_at>now()-interval '1 minute')>=30 or (select count(*) from public.connector_clients where created_at>now()-interval '1 day')>=500 then raise exception 'Registration budget exceeded' using errcode='53300'; end if;
 return new;
end $$;
revoke all on function public.connector_registration_limit() from public,anon,authenticated;
create trigger connector_registration_limit before insert on public.connector_clients for each row execute function public.connector_registration_limit();
create function public.connector_grant_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtext('grows:connector-grants:'||new.user_id::text));
 if (select count(*) from public.connector_grants where user_id=new.user_id and revoked_at is null and expires_at>now())>=30 then raise exception 'Maximum 30 active connections' using errcode='53300'; end if;
 return new;
end $$;
revoke all on function public.connector_grant_limit() from public,anon,authenticated;
create trigger connector_grant_limit before insert on public.connector_grants for each row execute function public.connector_grant_limit();
