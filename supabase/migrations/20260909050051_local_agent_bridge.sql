-- Backend-only queue. The web API authenticates the owner; devices use a scoped token.
create table public.grows_bridge_devices (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  org_id uuid not null,
  user_id uuid not null,
  token_hash text not null unique,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index grows_bridge_devices_obra on public.grows_bridge_devices(obra_id, user_id);
create table public.grows_bridge_jobs (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  org_id uuid not null,
  user_id uuid not null,
  device_id uuid references public.grows_bridge_devices(id) on delete set null,
  prompt text not null check (length(prompt) between 1 and 20000),
  context jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled','applied')),
  lease_token uuid,
  lease_until timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index grows_bridge_jobs_claim on public.grows_bridge_jobs(obra_id, org_id, user_id, created_at) where status in ('queued','running');
create index grows_bridge_jobs_device on public.grows_bridge_jobs(device_id);
alter table public.grows_bridge_devices enable row level security;
alter table public.grows_bridge_jobs enable row level security;
revoke all on public.grows_bridge_devices, public.grows_bridge_jobs from public, anon, authenticated;
grant select, insert, update, delete on public.grows_bridge_devices, public.grows_bridge_jobs to service_role;

create or replace function public.claim_grows_bridge_job(p_device_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_device public.grows_bridge_devices;
  v_job public.grows_bridge_jobs;
begin
  select * into v_device from public.grows_bridge_devices where id=p_device_id and revoked_at is null for update;
  if not found then raise exception 'Device unavailable' using errcode='42501'; end if;
  update public.grows_bridge_devices set last_seen_at=now() where id=p_device_id;
  -- Exhausted leases fail visibly instead of remaining running forever.
  update public.grows_bridge_jobs set status='failed', error='Worker lease expired after 3 attempts',
    lease_token=null, lease_until=null, updated_at=now()
    where obra_id=v_device.obra_id and org_id=v_device.org_id and user_id=v_device.user_id
      and status='running' and lease_until < now() and attempts >= 3;
  select * into v_job from public.grows_bridge_jobs
    where obra_id=v_device.obra_id and org_id=v_device.org_id and user_id=v_device.user_id
      and ((status='queued' and (device_id is null or device_id=p_device_id))
        or (status='running' and lease_until < now() and attempts < 3))
    order by created_at, id for update skip locked limit 1;
  if not found then return null; end if;
  update public.grows_bridge_jobs set status='running', device_id=p_device_id,
    lease_token=gen_random_uuid(), lease_until=now()+interval '10 minutes',
    attempts=attempts+1, error=null, updated_at=now()
    where id=v_job.id returning * into v_job;
  return to_jsonb(v_job);
end;
$$;
revoke all on function public.claim_grows_bridge_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_grows_bridge_job(uuid) to service_role;
