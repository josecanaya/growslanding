-- Cantidad/unidad por tarea + bandeja permanente del arquitecto (inbox_token).

ALTER TABLE public.obra_check_tasks
  ADD COLUMN IF NOT EXISTS unidad text DEFAULT 'm2';

ALTER TABLE public.obra_check_tasks
  ADD COLUMN IF NOT EXISTS cantidad numeric;

ALTER TABLE public.obra_check_sessions
  ADD COLUMN IF NOT EXISTS inbox_token uuid UNIQUE DEFAULT gen_random_uuid();

-- Backfill inbox_token for existing sessions
UPDATE public.obra_check_sessions
SET inbox_token = gen_random_uuid()
WHERE inbox_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_obra_check_sessions_inbox_token
  ON public.obra_check_sessions(inbox_token);

CREATE INDEX IF NOT EXISTS idx_obra_check_sessions_email
  ON public.obra_check_sessions(email);
