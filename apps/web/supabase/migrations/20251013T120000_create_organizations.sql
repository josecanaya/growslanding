-- Enable uuid extension if not already active
create extension if not exists "uuid-ossp";

-- Main organizations table
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cuit text,
  address text,
  created_at timestamptz not null default now()
);

-- Add org_id column to the public.users table (if it exists)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'id'
  ) then
    begin
      alter table public.users
        add column if not exists org_id uuid;

      alter table public.users
        add constraint users_org_id_fkey
        foreign key (org_id)
        references public.organizations(id)
        on delete set null;

      create index if not exists users_org_id_idx
        on public.users(org_id);
    exception
      when duplicate_object then
        null;
    end;
  end if;
end$$;
