BEGIN;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS monto_estimado numeric;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS monto_validado numeric;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS fecha_validacion timestamptz;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS validado_por uuid;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS orden_pago integer;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS evidencia_obligatoria boolean DEFAULT true;

UPDATE public.tareas_subtareas
SET evidencia_obligatoria = true
WHERE evidencia_obligatoria IS NULL;

UPDATE public.tareas_subtareas
SET orden_pago = orden
WHERE orden_pago IS NULL;

ALTER TABLE public.tareas_subtareas
  ALTER COLUMN evidencia_obligatoria SET NOT NULL,
  ALTER COLUMN evidencia_obligatoria SET DEFAULT true;

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS bloques_planificados integer;

COMMIT;
