-- Obra Check: respuestas estructuradas del contratista + email de completion.

ALTER TABLE public.obra_check_form_responses
  ADD COLUMN IF NOT EXISTS detalle_json jsonb;

ALTER TABLE public.obra_check_form_responses
  ALTER COLUMN telefono DROP NOT NULL;

ALTER TABLE public.obra_check_form_responses
  DROP CONSTRAINT IF EXISTS obra_check_form_responses_contact_check;

ALTER TABLE public.obra_check_form_responses
  ADD CONSTRAINT obra_check_form_responses_contact_check
  CHECK (telefono IS NOT NULL OR email IS NOT NULL);

ALTER TABLE public.obra_check_sessions
  ADD COLUMN IF NOT EXISTS completion_email_sent_at timestamptz;
