-- Obra Check: persistir fases en tareas/bloques + grupos de presupuesto.

ALTER TABLE public.obra_check_tasks
  ADD COLUMN IF NOT EXISTS fase text;

ALTER TABLE public.obra_check_blocks
  ADD COLUMN IF NOT EXISTS fase text;

ALTER TABLE public.obra_check_blocks
  ADD COLUMN IF NOT EXISTS budget_group_client_id text;

CREATE TABLE IF NOT EXISTS public.obra_check_budget_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  nombre text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);

ALTER TABLE public.obra_check_budget_groups ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_obra_check_budget_groups_session
  ON public.obra_check_budget_groups(session_id);

CREATE INDEX IF NOT EXISTS idx_obra_check_blocks_budget_group
  ON public.obra_check_blocks(session_id, budget_group_client_id);

CREATE INDEX IF NOT EXISTS idx_obra_check_tasks_fase
  ON public.obra_check_tasks(session_id, fase);
