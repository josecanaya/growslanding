-- Retiros de socio + fechas de liquidación quincenal automática

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'socio_retiro_estado') THEN
    CREATE TYPE public.socio_retiro_estado AS ENUM (
      'pendiente',
      'procesado',
      'rechazado',
      'cancelado'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'socio_retiro_tipo') THEN
    CREATE TYPE public.socio_retiro_tipo AS ENUM (
      'manual',
      'liquidacion_quincenal'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.socio_retiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  metodo_retiro_id uuid REFERENCES public.socio_metodos_retiro(id) ON DELETE SET NULL,
  monto numeric(15,2) NOT NULL CHECK (monto > 0),
  tipo public.socio_retiro_tipo NOT NULL DEFAULT 'manual',
  estado public.socio_retiro_estado NOT NULL DEFAULT 'pendiente',
  wallet_movimiento_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  procesado_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_socio_retiros_socio_created
  ON public.socio_retiros(socio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_socio_retiros_pendientes
  ON public.socio_retiros(estado, created_at)
  WHERE estado = 'pendiente';

ALTER TABLE public.wallet_saldos
  ADD COLUMN IF NOT EXISTS ultima_liquidacion_at timestamptz,
  ADD COLUMN IF NOT EXISTS proxima_liquidacion_at timestamptz;
