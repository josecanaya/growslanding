-- Cliente wallet MVP: internal org balance before Mercado Pago production flow.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cliente_wallet_movimiento_tipo') THEN
    CREATE TYPE public.cliente_wallet_movimiento_tipo AS ENUM (
      'CARGA_SALDO',
      'RESERVA_TAREA',
      'LIBERACION_PAGO',
      'DEVOLUCION_RESERVA',
      'COMISION_GROWS',
      'AJUSTE_MANUAL'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cliente_wallet_movimiento_estado') THEN
    CREATE TYPE public.cliente_wallet_movimiento_estado AS ENUM (
      'pendiente',
      'confirmado',
      'rechazado',
      'cancelado',
      'revertido'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cliente_wallets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cliente_user_id uuid,
  saldo_disponible numeric(15,2) NOT NULL DEFAULT 0 CHECK (saldo_disponible >= 0),
  saldo_reservado numeric(15,2) NOT NULL DEFAULT 0 CHECK (saldo_reservado >= 0),
  moneda char(3) NOT NULL DEFAULT 'ARS',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cliente_wallets_org_unique UNIQUE (org_id),
  CONSTRAINT cliente_wallets_moneda_check CHECK (moneda = 'ARS')
);

CREATE TABLE IF NOT EXISTS public.cliente_wallet_movimientos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id uuid NOT NULL REFERENCES public.cliente_wallets(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo public.cliente_wallet_movimiento_tipo NOT NULL,
  monto numeric(15,2) NOT NULL CHECK (monto > 0),
  estado public.cliente_wallet_movimiento_estado NOT NULL DEFAULT 'pendiente',
  referencia_tipo text,
  referencia_id uuid,
  descripcion text,
  mp_payment_id text,
  mp_preference_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compatibilidad wallet socio: la validación/reconciliación necesita identificar el bloque exacto
-- para no acreditar dos veces una misma subtarea.
ALTER TABLE public.wallet_movimientos
  ADD COLUMN IF NOT EXISTS subtarea_id uuid REFERENCES public.tareas_subtareas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_subtarea_cliente_reconcile
  ON public.wallet_movimientos(subtarea_id)
  WHERE subtarea_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cliente_wallet_movimientos_wallet_created
  ON public.cliente_wallet_movimientos(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cliente_wallet_movimientos_org_created
  ON public.cliente_wallet_movimientos(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cliente_wallet_movimientos_referencia
  ON public.cliente_wallet_movimientos(referencia_tipo, referencia_id)
  WHERE referencia_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_wallet_reserva_tarea_activa
  ON public.cliente_wallet_movimientos(org_id, referencia_tipo, referencia_id, tipo)
  WHERE tipo = 'RESERVA_TAREA'
    AND estado IN ('pendiente', 'confirmado')
    AND referencia_tipo = 'tarea'
    AND referencia_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_cliente_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_cliente_wallets ON public.cliente_wallets;
CREATE TRIGGER trg_touch_cliente_wallets
  BEFORE UPDATE ON public.cliente_wallets
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_cliente_wallets_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_cliente_wallet(
  p_org_id uuid,
  p_cliente_user_id uuid DEFAULT NULL
)
RETURNS public.cliente_wallets AS $$
DECLARE
  v_wallet public.cliente_wallets;
BEGIN
  INSERT INTO public.cliente_wallets (org_id, cliente_user_id)
  VALUES (p_org_id, p_cliente_user_id)
  ON CONFLICT (org_id) DO UPDATE
    SET cliente_user_id = COALESCE(public.cliente_wallets.cliente_user_id, EXCLUDED.cliente_user_id)
  RETURNING * INTO v_wallet;

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cliente_wallet_acreditar_manual(
  p_org_id uuid,
  p_cliente_user_id uuid,
  p_monto numeric,
  p_descripcion text DEFAULT NULL
)
RETURNS public.cliente_wallets AS $$
DECLARE
  v_wallet public.cliente_wallets;
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;

  v_wallet := public.ensure_cliente_wallet(p_org_id, p_cliente_user_id);

  SELECT * INTO v_wallet
  FROM public.cliente_wallets
  WHERE id = v_wallet.id
  FOR UPDATE;

  UPDATE public.cliente_wallets
  SET saldo_disponible = saldo_disponible + round(p_monto::numeric, 2)
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.cliente_wallet_movimientos (
    wallet_id, org_id, tipo, monto, estado, referencia_tipo, descripcion
  )
  VALUES (
    v_wallet.id, p_org_id, 'CARGA_SALDO', round(p_monto::numeric, 2), 'confirmado', 'carga_manual',
    COALESCE(p_descripcion, 'Carga manual de prueba')
  );

  -- TODO Mercado Pago: crear preferencia, esperar webhook aprobado y acreditar con mp_payment_id/mp_preference_id.
  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cliente_wallet_reservar_tarea(
  p_org_id uuid,
  p_cliente_user_id uuid,
  p_tarea_id uuid,
  p_monto numeric,
  p_descripcion text DEFAULT NULL
)
RETURNS public.cliente_wallets AS $$
DECLARE
  v_wallet public.cliente_wallets;
  v_existing uuid;
BEGIN
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;

  v_wallet := public.ensure_cliente_wallet(p_org_id, p_cliente_user_id);

  SELECT id INTO v_existing
  FROM public.cliente_wallet_movimientos
  WHERE org_id = p_org_id
    AND tipo = 'RESERVA_TAREA'
    AND estado IN ('pendiente', 'confirmado')
    AND referencia_tipo = 'tarea'
    AND referencia_id = p_tarea_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_wallet;
  END IF;

  SELECT * INTO v_wallet
  FROM public.cliente_wallets
  WHERE id = v_wallet.id
  FOR UPDATE;

  IF v_wallet.saldo_disponible < round(p_monto::numeric, 2) THEN
    RAISE EXCEPTION 'SALDO_INSUFICIENTE';
  END IF;

  UPDATE public.cliente_wallets
  SET
    saldo_disponible = saldo_disponible - round(p_monto::numeric, 2),
    saldo_reservado = saldo_reservado + round(p_monto::numeric, 2)
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.cliente_wallet_movimientos (
    wallet_id, org_id, tipo, monto, estado, referencia_tipo, referencia_id, descripcion
  )
  VALUES (
    v_wallet.id, p_org_id, 'RESERVA_TAREA', round(p_monto::numeric, 2), 'confirmado',
    'tarea', p_tarea_id, COALESCE(p_descripcion, 'Reserva de saldo para tarea')
  );

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cliente_wallet_devolver_reserva(
  p_org_id uuid,
  p_referencia_id uuid,
  p_descripcion text DEFAULT NULL
)
RETURNS public.cliente_wallets AS $$
DECLARE
  v_wallet public.cliente_wallets;
  v_reserva public.cliente_wallet_movimientos;
BEGIN
  SELECT * INTO v_wallet
  FROM public.cliente_wallets
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NO_ENCONTRADA';
  END IF;

  SELECT * INTO v_reserva
  FROM public.cliente_wallet_movimientos
  WHERE org_id = p_org_id
    AND tipo = 'RESERVA_TAREA'
    AND estado = 'confirmado'
    AND referencia_id = p_referencia_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN v_wallet;
  END IF;

  UPDATE public.cliente_wallets
  SET
    saldo_disponible = saldo_disponible + v_reserva.monto,
    saldo_reservado = GREATEST(0, saldo_reservado - v_reserva.monto)
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  UPDATE public.cliente_wallet_movimientos
  SET estado = 'revertido'
  WHERE id = v_reserva.id;

  INSERT INTO public.cliente_wallet_movimientos (
    wallet_id, org_id, tipo, monto, estado, referencia_tipo, referencia_id, descripcion
  )
  VALUES (
    v_wallet.id, p_org_id, 'DEVOLUCION_RESERVA', v_reserva.monto, 'confirmado',
    v_reserva.referencia_tipo, v_reserva.referencia_id, COALESCE(p_descripcion, 'Devolución de reserva')
  );

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cliente_wallet_liberar_tarea(
  p_org_id uuid,
  p_tarea_id uuid,
  p_socio_id uuid,
  p_monto_total numeric,
  p_monto_pago numeric,
  p_monto_comision numeric DEFAULT 0,
  p_descripcion text DEFAULT NULL
)
RETURNS public.cliente_wallets AS $$
DECLARE
  v_wallet public.cliente_wallets;
  v_existing uuid;
  v_total numeric;
  v_pago numeric;
  v_comision numeric;
BEGIN
  v_total := round(COALESCE(p_monto_total, 0)::numeric, 2);
  v_pago := round(COALESCE(p_monto_pago, 0)::numeric, 2);
  v_comision := round(COALESCE(p_monto_comision, 0)::numeric, 2);

  IF v_total <= 0 OR v_pago <= 0 OR v_comision < 0 OR v_pago + v_comision <> v_total THEN
    RAISE EXCEPTION 'MONTO_INVALIDO';
  END IF;

  SELECT * INTO v_wallet
  FROM public.cliente_wallets
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'WALLET_NO_ENCONTRADA';
  END IF;

  SELECT id INTO v_existing
  FROM public.cliente_wallet_movimientos
  WHERE org_id = p_org_id
    AND tipo = 'LIBERACION_PAGO'
    AND estado = 'confirmado'
    AND referencia_tipo = 'tarea'
    AND referencia_id = p_tarea_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_wallet;
  END IF;

  IF v_wallet.saldo_reservado < v_total THEN
    RAISE EXCEPTION 'SALDO_RESERVADO_INSUFICIENTE';
  END IF;

  UPDATE public.cliente_wallets
  SET saldo_reservado = saldo_reservado - v_total
  WHERE id = v_wallet.id
  RETURNING * INTO v_wallet;

  INSERT INTO public.cliente_wallet_movimientos (
    wallet_id, org_id, tipo, monto, estado, referencia_tipo, referencia_id, descripcion, metadata
  )
  VALUES (
    v_wallet.id, p_org_id, 'LIBERACION_PAGO', v_pago, 'confirmado',
    'tarea', p_tarea_id, COALESCE(p_descripcion, 'Liberación de pago de tarea'),
    jsonb_build_object('socio_id', p_socio_id, 'monto_total', v_total)
  );

  IF v_comision > 0 THEN
    INSERT INTO public.cliente_wallet_movimientos (
      wallet_id, org_id, tipo, monto, estado, referencia_tipo, referencia_id, descripcion, metadata
    )
    VALUES (
      v_wallet.id, p_org_id, 'COMISION_GROWS', v_comision, 'confirmado',
      'tarea', p_tarea_id, 'Comisión GROWS por liberación de tarea',
      jsonb_build_object('socio_id', p_socio_id, 'monto_total', v_total)
    );
  END IF;

  RETURN v_wallet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
