-- Aprobación de paquete y ventana de cambio (doble verificación post-aprobación).

ALTER TABLE public.canvas_budget_groups
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS change_window_status text NOT NULL DEFAULT 'cerrada',
  ADD COLUMN IF NOT EXISTS change_window_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS change_window_notes text;

COMMENT ON COLUMN public.canvas_budget_groups.change_window_status IS
  'cerrada | abierta_cliente | confirmada_socio — flujo de cambio post-aprobación';
