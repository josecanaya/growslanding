-- Solicitudes de revisión de precio tras aprobación del presupuesto (acuerdo socio ↔ cliente)
CREATE TABLE IF NOT EXISTS public.presupuesto_solicitudes_cambio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.tareas_presupuestos(id) ON DELETE CASCADE,
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  monto_actual numeric NOT NULL CHECK (monto_actual >= 0),
  monto_propuesto numeric NOT NULL CHECK (monto_propuesto >= 0),
  motivo text NOT NULL CHECK (char_length(trim(motivo)) >= 10),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'cancelado')),
  respuesta_cliente text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presup_cambio_presupuesto
  ON public.presupuesto_solicitudes_cambio(presupuesto_id);

CREATE INDEX IF NOT EXISTS idx_presup_cambio_socio_estado
  ON public.presupuesto_solicitudes_cambio(socio_id, estado);

COMMENT ON TABLE public.presupuesto_solicitudes_cambio IS
  'Solicitudes de revisión de monto; el monto en tareas_presupuestos no cambia hasta aceptación.';
