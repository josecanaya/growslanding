-- Proyecto vivo: modo de grafo en obras + semántica A→T→B en canvas_nodes

alter table public.obras
  add column if not exists graph_mode text not null default 'obra_plan';

alter table public.obras
  drop constraint if exists obras_graph_mode_check;

alter table public.obras
  add constraint obras_graph_mode_check
  check (graph_mode in ('obra_plan', 'proyecto_vivo'));

alter table public.obras
  add column if not exists objetivo_texto text;

comment on column public.obras.graph_mode is 'obra_plan = canvas WBS clásico; proyecto_vivo = IDEA → transformaciones → estados';

alter table public.canvas_nodes
  add column if not exists transform_kind text;

alter table public.canvas_nodes
  add column if not exists from_node_id uuid references public.canvas_nodes(id) on delete set null;

alter table public.canvas_nodes
  add column if not exists to_node_id uuid references public.canvas_nodes(id) on delete set null;

alter table public.canvas_nodes
  add column if not exists executor_kind text;

alter table public.canvas_nodes
  add column if not exists executor_ref text;

alter table public.canvas_nodes
  add column if not exists graph_status text;

alter table public.canvas_nodes
  add column if not exists t_value numeric;

alter table public.canvas_nodes
  add column if not exists t_components jsonb default '{}'::jsonb;

alter table public.canvas_nodes
  add column if not exists t_formula_id text;

create index if not exists canvas_nodes_from_node_id_idx on public.canvas_nodes(from_node_id);
create index if not exists canvas_nodes_to_node_id_idx on public.canvas_nodes(to_node_id);
create index if not exists canvas_nodes_graph_status_idx on public.canvas_nodes(graph_status);
