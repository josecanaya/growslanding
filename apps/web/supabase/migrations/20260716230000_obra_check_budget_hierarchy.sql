-- Obra Check: jerarquía fase → subgrupo en grupos de presupuesto.

ALTER TABLE public.obra_check_budget_groups
  ADD COLUMN IF NOT EXISTS parent_client_id text;

ALTER TABLE public.obra_check_budget_groups
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'subgrupo';

ALTER TABLE public.obra_check_budget_groups
  DROP CONSTRAINT IF EXISTS obra_check_budget_groups_kind_check;

ALTER TABLE public.obra_check_budget_groups
  ADD CONSTRAINT obra_check_budget_groups_kind_check
  CHECK (kind IN ('fase', 'subgrupo'));

CREATE INDEX IF NOT EXISTS idx_obra_check_budget_groups_parent
  ON public.obra_check_budget_groups(session_id, parent_client_id);
