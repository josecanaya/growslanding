-- Obra Check: m² de la obra, planos adjuntos y token para que el solicitante vea la respuesta completa.

ALTER TABLE public.obra_check_sessions
  ADD COLUMN IF NOT EXISTS metros_cuadrados numeric;

CREATE TABLE IF NOT EXISTS public.obra_check_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime text NOT NULL,
  size_bytes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.obra_check_planos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_obra_check_planos_session
  ON public.obra_check_planos(session_id);

ALTER TABLE public.obra_check_form_responses
  ADD COLUMN IF NOT EXISTS view_token uuid UNIQUE DEFAULT gen_random_uuid();

ALTER TABLE public.obra_check_form_responses
  ADD COLUMN IF NOT EXISTS notified_requester_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_obra_check_form_responses_view_token
  ON public.obra_check_form_responses(view_token);
