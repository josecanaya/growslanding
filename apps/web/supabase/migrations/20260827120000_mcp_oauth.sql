-- MCP OAuth: permitir que ChatGPT (u otros clientes MCP) se conecten "como GitHub".
-- Grows actúa como Authorization Server + Resource Server sobre Supabase Auth.
--   mcp_oauth_clients : registro dinámico de clientes (RFC 7591). ChatGPT se registra solo.
--   mcp_oauth_codes   : códigos de autorización de vida corta, con PKCE, atados a un usuario.
-- Los access/refresh tokens se emiten como JWT firmados (no requieren tabla).

create table if not exists public.mcp_oauth_clients (
  id text primary key,                       -- client_id (generado por nosotros)
  client_secret text,                        -- opcional; ChatGPT usa cliente público + PKCE
  client_name text,
  redirect_uris jsonb not null default '[]'::jsonb,
  grant_types jsonb not null default '["authorization_code","refresh_token"]'::jsonb,
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default now()
);

comment on table public.mcp_oauth_clients is 'Clientes OAuth registrados dinámicamente para el MCP de Grows (ej: ChatGPT).';

create table if not exists public.mcp_oauth_codes (
  code text primary key,                      -- authorization code (opaco, un solo uso)
  client_id text not null references public.mcp_oauth_clients(id) on delete cascade,
  user_id uuid not null,                      -- auth.users.id del usuario que autorizó
  redirect_uri text not null,
  scope text,
  code_challenge text,                        -- PKCE (S256)
  code_challenge_method text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.mcp_oauth_codes is 'Códigos de autorización OAuth de vida corta (PKCE) para el MCP de Grows.';

create index if not exists idx_mcp_oauth_codes_expires on public.mcp_oauth_codes (expires_at);

-- RLS: solo el service_role (backend) toca estas tablas. Nadie desde el cliente.
alter table public.mcp_oauth_clients enable row level security;
alter table public.mcp_oauth_codes  enable row level security;
