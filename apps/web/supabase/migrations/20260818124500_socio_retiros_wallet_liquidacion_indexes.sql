-- Mejoras de esquema (sin RLS): retiros socio, liquidación wallet, CHECKs e índices.

-- 1) Métodos de retiro (CVU/CBU/alias) — usados por /api/socio/metodos-retiro
create table if not exists public.socio_metodos_retiro (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  titular text not null,
  banco text,
  cvu text,
  cbu text,
  alias text,
  tipo text not null default 'transferencia',
  mercado_pago_cvu text,
  mercado_pago_alias text,
  es_principal boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint socio_metodos_retiro_tipo_check check (
    tipo in ('transferencia', 'mercado_pago', 'cvu', 'cbu', 'alias')
  )
);

create index if not exists socio_metodos_retiro_socio_activo_idx
  on public.socio_metodos_retiro (socio_id, activo, es_principal desc, created_at desc);

-- 2) Solicitudes de retiro — usadas por SocioRetiroService
create table if not exists public.socio_retiros (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references public.socios(id) on delete cascade,
  metodo_retiro_id uuid references public.socio_metodos_retiro(id) on delete set null,
  monto numeric not null,
  tipo text not null,
  estado text not null default 'pendiente',
  wallet_movimiento_id uuid references public.wallet_movimientos(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint socio_retiros_tipo_check check (tipo in ('manual', 'liquidacion_quincenal')),
  constraint socio_retiros_estado_check check (estado in ('pendiente', 'procesado', 'rechazado', 'cancelado')),
  constraint socio_retiros_monto_check check (monto > 0)
);

create index if not exists socio_retiros_socio_created_idx
  on public.socio_retiros (socio_id, created_at desc);
create index if not exists socio_retiros_socio_manual_hoy_idx
  on public.socio_retiros (socio_id, tipo, estado, created_at);

-- 3) Fechas de liquidación quincenal en wallet_saldos (el servicio ya las lee/escribe)
alter table public.wallet_saldos
  add column if not exists ultima_liquidacion_at timestamptz;
alter table public.wallet_saldos
  add column if not exists proxima_liquidacion_at timestamptz;

create index if not exists wallet_saldos_proxima_liquidacion_idx
  on public.wallet_saldos (owner_tipo, proxima_liquidacion_at)
  where owner_tipo = 'SOCIO';

-- 4) canvas_nodes.type: incluir estado (proyecto_vivo) sin romper WBS
alter table public.canvas_nodes drop constraint if exists canvas_nodes_type_check;
alter table public.canvas_nodes
  add constraint canvas_nodes_type_check
  check (
    type in ('etapa', 'planta', 'sector', 'ambiente', 'tarea', 'estado')
  );

-- 5) Índices extra de lectura frecuente
create index if not exists tarea_precedencias_tarea_id_idx
  on public.tarea_precedencias (tarea_id);
create index if not exists tarea_precedencias_depende_de_idx
  on public.tarea_precedencias (depende_de);
create index if not exists canvas_edges_obra_id_idx
  on public.canvas_edges (obra_id);
create index if not exists eventos_tarea_id_idx
  on public.eventos (tarea_id, created_at desc)
  where tarea_id is not null;
create index if not exists notificaciones_org_created_idx
  on public.notificaciones (org_id, created_at desc);

comment on table public.socio_metodos_retiro is 'Destinos de cobro del socio (CVU/CBU/alias). No es wallet.';
comment on table public.socio_retiros is 'Pedidos de retiro / liquidación. El movimiento de dinero vive en wallet_movimientos.';
