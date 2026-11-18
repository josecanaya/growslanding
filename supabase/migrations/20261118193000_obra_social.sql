-- Interacciones sociales del feed público de obras: seguir, apoyar y comentar.
-- Solo el servidor (service role) lee y escribe; el API valida la sesión y que la obra esté publicada.

create table if not exists public.obra_follows (
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (obra_id, user_id)
);

create table if not exists public.obra_supports (
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (obra_id, user_id)
);

create table if not exists public.obra_comments (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_role text check (author_role in ('contratista', 'profesional', 'inversor', 'admin')),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists obra_follows_user_idx on public.obra_follows (user_id);
create index if not exists obra_supports_user_idx on public.obra_supports (user_id);
create index if not exists obra_comments_obra_idx on public.obra_comments (obra_id, created_at desc);

alter table public.obra_follows enable row level security;
alter table public.obra_supports enable row level security;
alter table public.obra_comments enable row level security;

-- Sin políticas: anon y authenticated no acceden directo. El service role las saltea.
revoke all on public.obra_follows, public.obra_supports, public.obra_comments from anon, authenticated;

comment on table public.obra_follows is 'Usuarios que siguen una obra publicada en el feed.';
comment on table public.obra_supports is 'Apoyos (likes) a una obra publicada en el feed.';
comment on table public.obra_comments is 'Comentarios y preguntas sobre una obra publicada en el feed.';
