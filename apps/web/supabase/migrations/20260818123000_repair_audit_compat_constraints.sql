-- Reparación de deuda de esquema detectada contra el código de apps/web.
-- No duplica el grafo. No toca wallet. No habilita RLS sin políticas.

-- 1) Auditoría FSM: el código escribe tareas_eventos / tareas_estados, que no existían.
--    Compatibilidad: mismas columnas que espera TareaFsmService / TareasRepository.

create table if not exists public.tareas_eventos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  actor_id uuid,
  actor_tipo text,
  estado_anterior text,
  estado_nuevo text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tareas_eventos_tarea_id_idx on public.tareas_eventos (tarea_id, created_at desc);

create table if not exists public.tareas_estados (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  estado_anterior text,
  estado_nuevo text,
  actor_id uuid,
  actor_tipo text,
  motivo text,
  created_at timestamptz not null default now()
);

create index if not exists tareas_estados_tarea_id_idx on public.tareas_estados (tarea_id, created_at desc);

comment on table public.tareas_eventos is 'Historial de transiciones FSM. Complementa eventos (evidencia/presupuesto).';
comment on table public.tareas_estados is 'Historial de estados de tarea usado por GET /api/tareas/[id] y creación inicial.';

-- 2) Alias de lectura para código que aún consulta organizaciones (permisos/wallet/plan).
--    Escritura sigue yendo a organizations.

create or replace view public.organizaciones as
select
  id,
  name as nombre,
  name,
  cuit,
  address,
  created_at,
  avatar_url,
  plan_actual,
  user_id,
  user_id as owner_user_id
from public.organizations;

comment on view public.organizaciones is 'Compat: alias de organizations. No es un segundo store.';

-- 4) Índices del puente canvas → ejecución (consultas frecuentes).

create index if not exists tareas_canvas_node_id_idx on public.tareas (canvas_node_id) where canvas_node_id is not null;
create index if not exists tareas_obra_id_estado_idx on public.tareas (obra_id, estado);
create index if not exists canvas_nodes_obra_type_idx on public.canvas_nodes (obra_id, type);
create index if not exists canvas_nodes_obra_graph_status_idx on public.canvas_nodes (obra_id, graph_status) where graph_status is not null;

-- 5) CHECKs de aplicación para proyecto_vivo (nullable, no rompe filas actuales).

alter table public.canvas_nodes
  drop constraint if exists canvas_nodes_transform_kind_check;
alter table public.canvas_nodes
  add constraint canvas_nodes_transform_kind_check
  check (
    transform_kind is null
    or transform_kind in ('conocimiento', 'coordinacion', 'ejecucion')
  );

alter table public.canvas_nodes
  drop constraint if exists canvas_nodes_executor_kind_check;
alter table public.canvas_nodes
  add constraint canvas_nodes_executor_kind_check
  check (
    executor_kind is null
    or executor_kind in ('humano', 'empresa', 'agente', 'sin_asignar')
  );

alter table public.canvas_nodes
  drop constraint if exists canvas_nodes_graph_status_check;
alter table public.canvas_nodes
  add constraint canvas_nodes_graph_status_check
  check (
    graph_status is null
    or graph_status in ('propuesta', 'en_curso', 'realizada', 'bloqueada', 'alcanzado', 'fantasma')
  );

-- type=estado ya se usa en código; no forzar CHECK agresivo sobre type para no bloquear WBS existente.
