-- Obra Check — herramienta pública gratuita de armado de plan de obra.
-- AISLADA de producción: tablas propias con prefijo obra_check_, RLS deny-all,
-- acceso EXCLUSIVO vía service role en API routes. No referencia ni toca public.obras/tareas/socios.
--
-- Modelo de ids: el motor usa "client_id" (string opaco generado por el front) como identidad
-- estable de tareas/bloques; el PK uuid es interno. predecesoras y block references se guardan
-- como client_id (text) para soportar el full-replace de tareas sin remapear uuids.

CREATE TABLE IF NOT EXISTS public.obra_check_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email text,
  empresa text,
  tipo_obra text,                                        -- 'casa' | 'edificio' | 'reforma' | 'trabajo_comun' | otro
  consent_procesamiento boolean NOT NULL DEFAULT false,  -- Consent A (obligatorio para operar)
  consent_patrones boolean NOT NULL DEFAULT false,       -- Consent B (aportar patrones anónimos a bibliotecas)
  consent_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rubro text,
  telefono text,                                         -- PII de tercero: sólo para generar el wa.me
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,                               -- identidad estable del bloque (front/motor)
  nombre text NOT NULL,
  rubro text,
  orden integer NOT NULL DEFAULT 0,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.obra_check_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  client_id text NOT NULL,                               -- identidad estable de la tarea (front/motor)
  block_client_id text,                                  -- client_id del bloque asignado (post-ordenar)
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  rubro text,
  duracion_dias numeric,
  inicio date,
  fin date,
  predecesoras text[] NOT NULL DEFAULT '{}',             -- client_ids de tareas predecesoras
  responsable_label text,
  orden integer NOT NULL DEFAULT 0,
  es_critica boolean,
  origen text NOT NULL DEFAULT 'chat' CHECK (origen IN ('excel','csv','project_xml','chat')),
  fila_origen integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.obra_check_wa_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.obra_check_contacts(id) ON DELETE SET NULL,
  block_client_id text,
  tipo text NOT NULL CHECK (tipo IN ('orden_trabajo','pedido_presupuesto')),
  texto text NOT NULL,
  generado_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.obra_check_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.obra_check_sessions(id) ON DELETE CASCADE,
  tipo text NOT NULL,                                    -- session_created | file_parsed | chat_message | xml_built | blocks_suggested | contact_added | wa_generated | pdf_downloaded | upsell_view | upsell_click
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS deny-all: sin policies, nadie salvo el service role puede leer/escribir.
ALTER TABLE public.obra_check_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_contacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_check_events      ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_obra_check_tasks_session    ON public.obra_check_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_blocks_session   ON public.obra_check_blocks(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_contacts_session ON public.obra_check_contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_events_session   ON public.obra_check_events(session_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_sessions_token   ON public.obra_check_sessions(session_token);
