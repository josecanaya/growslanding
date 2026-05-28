-- Aprobación en obra: el cliente confirma calidad sin liberar pago (wallet).
-- El bloque sigue en `para_validar` hasta la validación definitiva con pago.

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS validado_en_obra_at timestamptz,
  ADD COLUMN IF NOT EXISTS validado_en_obra_por uuid;

COMMENT ON COLUMN public.tareas_subtareas.validado_en_obra_at IS
  'Marca de tiempo cuando el cliente aprobó el bloque en obra (sin liberar pago).';
COMMENT ON COLUMN public.tareas_subtareas.validado_en_obra_por IS
  'Usuario cliente que registró la aprobación en obra.';
