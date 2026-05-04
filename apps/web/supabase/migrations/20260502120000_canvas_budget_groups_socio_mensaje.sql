-- Campos opcionales para gestión de Grupos de presupuesto desde la pestaña Presupuestos.
-- Si la tabla aún no existe en el proyecto, aplicar primero la migración que crea canvas_budget_groups.

ALTER TABLE public.canvas_budget_groups
  ADD COLUMN IF NOT EXISTS scheduled_socio_id uuid REFERENCES public.socios(id),
  ADD COLUMN IF NOT EXISTS mensaje_socio_borrador text;
