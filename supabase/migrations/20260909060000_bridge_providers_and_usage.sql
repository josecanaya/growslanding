alter table public.grows_bridge_devices
  add column if not exists capabilities jsonb not null default '[]'::jsonb,
  add column if not exists usage jsonb not null default '{}'::jsonb,
  add column if not exists activity text;

alter table public.grows_bridge_jobs
  add column if not exists usage jsonb not null default '{}'::jsonb,
  add column if not exists activity text;

comment on column public.grows_bridge_devices.capabilities is
  'Providers/models detected by the paired local bridge. Server treats this as status, never authorization.';
comment on column public.grows_bridge_devices.usage is
  'Provider-reported usage when available; unavailable limits remain explicit instead of estimated.';
comment on column public.grows_bridge_jobs.usage is
  'Measured input/output tokens or local execution marker for this job.';
