-- Wallet schema alignment for MVP (owner_tipo/owner_id + suspension model)

-- Enums ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_owner_tipo') THEN
    CREATE TYPE wallet_owner_tipo AS ENUM ('SOCIO', 'ORG');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_movimiento_tipo') THEN
    CREATE TYPE wallet_movimiento_tipo AS ENUM ('CREDITO', 'DEBITO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_movimiento_estado') THEN
    CREATE TYPE wallet_movimiento_estado AS ENUM ('pendiente', 'completado', 'cancelado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_metodo_pago') THEN
    CREATE TYPE wallet_metodo_pago AS ENUM ('EFECTIVO', 'ONLINE');
  END IF;
END $$;

-- Core tables -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.wallet_saldos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_tipo wallet_owner_tipo NOT NULL,
  owner_id uuid NOT NULL,
  saldo_actual numeric(15,2) NOT NULL DEFAULT 0,
  saldo_pendiente numeric(15,2) NOT NULL DEFAULT 0,
  moneda char(3) NOT NULL DEFAULT 'ARS',
  suspendido boolean NOT NULL DEFAULT false,
  suspendido_desde timestamptz,
  limite_sobregiro numeric(15,2) NOT NULL DEFAULT -50000,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_saldos_owner_unique UNIQUE (owner_tipo, owner_id)
);

CREATE TABLE IF NOT EXISTS public.wallet_movimientos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_tipo wallet_owner_tipo NOT NULL,
  owner_id uuid NOT NULL,
  tarea_id uuid REFERENCES public.tareas(id) ON DELETE SET NULL,
  subtarea_id uuid REFERENCES public.tareas_subtareas(id) ON DELETE SET NULL,
  presupuesto_id uuid REFERENCES public.tareas_presupuestos(id) ON DELETE SET NULL,
  escrow_id uuid,
  tipo wallet_movimiento_tipo NOT NULL,
  metodo_pago wallet_metodo_pago NOT NULL DEFAULT 'EFECTIVO',
  estado wallet_movimiento_estado NOT NULL DEFAULT 'pendiente',
  origen text NOT NULL,
  descripcion text,
  plan_aplicado text,
  reputacion_factor numeric(5,4),
  oferta_demanda_factor numeric(5,4),
  porcentaje_comision numeric(5,4) NOT NULL DEFAULT 0,
  monto_bruto numeric(15,2) NOT NULL CHECK (monto_bruto > 0),
  monto_comision numeric(15,2) NOT NULL DEFAULT 0,
  monto_neto numeric(15,2) NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_movimientos_owner_fk
    FOREIGN KEY (owner_tipo, owner_id)
    REFERENCES public.wallet_saldos(owner_tipo, owner_id)
    ON DELETE CASCADE,
  CONSTRAINT wallet_movimientos_monto_check
    CHECK (monto_neto = monto_bruto - monto_comision),
  CONSTRAINT wallet_movimientos_subtarea_unique
    UNIQUE (subtarea_id, tipo) WHERE subtarea_id IS NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_owner
  ON public.wallet_movimientos(owner_tipo, owner_id);

CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_subtarea
  ON public.wallet_movimientos(subtarea_id)
  WHERE subtarea_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_created_at
  ON public.wallet_movimientos(created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'escrow_transacciones'
  ) THEN
    ALTER TABLE public.wallet_movimientos
      ADD CONSTRAINT wallet_movimientos_escrow_fkey
      FOREIGN KEY (escrow_id)
      REFERENCES public.escrow_transacciones(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Historial de suspensiones ---------------------------------------------------

CREATE TABLE IF NOT EXISTS public.socio_suspensiones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  wallet_saldo_id uuid NOT NULL REFERENCES public.wallet_saldos(id) ON DELETE CASCADE,
  motivo text NOT NULL DEFAULT 'LIMITE_NEGATIVO',
  saldo_al_momento numeric(15,2) NOT NULL,
  inicio timestamptz NOT NULL DEFAULT now(),
  fin timestamptz
);

CREATE INDEX IF NOT EXISTS idx_socio_suspensiones_open
  ON public.socio_suspensiones(socio_id)
  WHERE fin IS NULL;

-- Trigger para mantener updated_at -------------------------------------------

CREATE OR REPLACE FUNCTION public.touch_wallet_saldos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_wallet_saldos ON public.wallet_saldos;
CREATE TRIGGER trg_touch_wallet_saldos
  BEFORE UPDATE ON public.wallet_saldos
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_wallet_saldos_updated_at();

-- Suspensión automática -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_wallet_suspension()
RETURNS TRIGGER AS $$
DECLARE
  current_open uuid;
BEGIN
  IF NEW.owner_tipo = 'SOCIO' THEN
    IF NEW.saldo_actual < NEW.limite_sobregiro THEN
      NEW.suspendido := true;
      IF NEW.suspendido_desde IS NULL THEN
        NEW.suspendido_desde := now();
      END IF;

      SELECT id INTO current_open
      FROM public.socio_suspensiones
      WHERE socio_id = NEW.owner_id
        AND fin IS NULL
      FOR UPDATE SKIP LOCKED;

      IF current_open IS NULL THEN
        INSERT INTO public.socio_suspensiones (socio_id, wallet_saldo_id, saldo_al_momento)
        VALUES (NEW.owner_id, NEW.id, NEW.saldo_actual);
      END IF;
    ELSE
      NEW.suspendido := false;
      NEW.suspendido_desde := NULL;

      UPDATE public.socio_suspensiones
      SET fin = now()
      WHERE socio_id = NEW.owner_id
        AND wallet_saldo_id = NEW.id
        AND fin IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_wallet_suspension ON public.wallet_saldos;
CREATE TRIGGER trg_enforce_wallet_suspension
  BEFORE INSERT OR UPDATE ON public.wallet_saldos
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_wallet_suspension();
