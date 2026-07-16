-- Obra Check: invites públicos (formulario por WhatsApp) + respuestas del contratista.
-- Objetivo marketing: capturar nombre/teléfono real del contratista sin depender del Web Share API.

CREATE TABLE IF NOT EXISTS public.obra_check_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  block_client_id text NOT NULL,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('orden_trabajo', 'pedido_presupuesto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  responded_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.obra_check_form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.obra_check_invites(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text NOT NULL,
  email text,
  rubro text,
  empresa text,
  mensaje text,
  acepta_contacto boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.obra_check_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_form_responses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_obra_check_invites_token ON public.obra_check_invites(token);
CREATE INDEX IF NOT EXISTS idx_obra_check_invites_session ON public.obra_check_invites(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_form_responses_session ON public.obra_check_form_responses(session_id);
