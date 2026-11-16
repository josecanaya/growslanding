-- Proyecto vivo: F(f)=(qT, C). No toca tareas, wallet, presupuestos ni FSM.

alter table public.canvas_nodes
  add column if not exists energy_unit_id text;

alter table public.canvas_nodes
  add column if not exists energy_quantity numeric;

alter table public.canvas_nodes
  add column if not exists capital_amount numeric;

alter table public.canvas_nodes
  add column if not exists capital_currency text;

comment on column public.canvas_nodes.energy_unit_id is
  'proyecto_vivo: identidad de T (la declara el ejecutor/proyecto). Sin catálogo rígido.';
comment on column public.canvas_nodes.energy_quantity is
  'proyecto_vivo: q en E=qT. Solo sumable si energy_unit_id coincide.';
comment on column public.canvas_nodes.capital_amount is
  'proyecto_vivo: C de la transformación. No es wallet ni comisión.';
comment on column public.canvas_nodes.capital_currency is
  'proyecto_vivo: moneda de C; default de aplicación USD.';

comment on column public.canvas_nodes.t_value is
  'OBSOLETO para energía de proyecto_vivo. No es qT.';
comment on column public.canvas_nodes.t_components is
  'OBSOLETO: no usar gamma/sigma/criticidad como energía.';
comment on column public.canvas_nodes.t_formula_id is
  'OBSOLETO: Grows no define fórmula de T.';
