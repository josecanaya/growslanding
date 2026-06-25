-- Templates de tareas para precargar el canvas (Sprint 1)
-- Columnas en obras para tipo producto y template elegido

ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS obra_product_kind text,
  ADD COLUMN IF NOT EXISTS canvas_template_slug text,
  ADD COLUMN IF NOT EXISTS m2_estimados numeric;

CREATE TABLE IF NOT EXISTS public.canvas_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  obra_product_kind text NOT NULL,
  visibilidad text NOT NULL DEFAULT 'oficial' CHECK (visibilidad IN ('oficial', 'publico', 'privado')),
  autor_user_id uuid,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.canvas_template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.canvas_task_templates(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  orden integer NOT NULL,
  duracion_estimada_dias integer NOT NULL DEFAULT 1,
  tipo text NOT NULL DEFAULT 'tarea',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.canvas_template_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.canvas_task_templates(id) ON DELETE CASCADE,
  source_task_id uuid NOT NULL REFERENCES public.canvas_template_tasks(id) ON DELETE CASCADE,
  target_task_id uuid NOT NULL REFERENCES public.canvas_template_tasks(id) ON DELETE CASCADE,
  tipo_conexion text NOT NULL DEFAULT 'FINISH_TO_START'
);

CREATE INDEX IF NOT EXISTS idx_canvas_task_templates_kind ON public.canvas_task_templates(obra_product_kind);
CREATE INDEX IF NOT EXISTS idx_canvas_task_templates_visibilidad ON public.canvas_task_templates(visibilidad);
