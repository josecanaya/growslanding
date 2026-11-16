-- Funciones y triggers recuperados de migraciones históricas presentes en otras ramas del repositorio

-- (origin/claude/obra-check-whatsapp-share-pxm23m y origin/fix/conocimiento-mcp-folder). Solo `create function` / `create trigger`.



-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20251210T120000_wallet_schema.sql

CREATE OR REPLACE FUNCTION public.touch_wallet_saldos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trg_touch_wallet_saldos ON public.wallet_saldos;
CREATE TRIGGER trg_touch_wallet_saldos
  BEFORE UPDATE ON public.wallet_saldos
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_wallet_saldos_updated_at();

DROP TRIGGER IF EXISTS trg_enforce_wallet_suspension ON public.wallet_saldos;
CREATE TRIGGER trg_enforce_wallet_suspension
  BEFORE INSERT OR UPDATE ON public.wallet_saldos
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_wallet_suspension();

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20251210T121000_tareas_fsm_enum.sql

CREATE OR REPLACE FUNCTION public.sync_dias_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
  dias integer;
BEGIN
  IF NEW.estado = 'APROBADO' THEN
    dias := COALESCE(NEW.dias_reales, 1);
    UPDATE public.tareas
    SET dias_presupuesto = dias,
        bloques_planificados = dias
    WHERE id = NEW.tarea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_socio_max_tareas()
RETURNS TRIGGER AS $$
DECLARE
  active_count integer;
BEGIN
  IF NEW.responsable_socio_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.estado = 'en_progreso' THEN
    SELECT COUNT(*) INTO active_count
    FROM public.tareas
    WHERE responsable_socio_id = NEW.responsable_socio_id
      AND estado = 'en_progreso'
      AND id <> NEW.id;

    IF active_count >= 2 THEN
      RAISE EXCEPTION 'El socio % ya tiene 2 tareas en progreso', NEW.responsable_socio_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_dias_presupuesto ON public.tareas_presupuestos;
CREATE TRIGGER trg_sync_dias_presupuesto
  AFTER INSERT OR UPDATE ON public.tareas_presupuestos
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_dias_presupuesto();

DROP TRIGGER IF EXISTS trg_enforce_socio_max_tareas ON public.tareas;
CREATE TRIGGER trg_enforce_socio_max_tareas
  BEFORE INSERT OR UPDATE OF estado, responsable_socio_id
  ON public.tareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_socio_max_tareas();

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20251210T122000_tareas_subtareas_blocks.sql

CREATE OR REPLACE FUNCTION public.inherit_subtarea_socio()
RETURNS TRIGGER AS $$
DECLARE
  tarea_socio uuid;
BEGIN
  IF NEW.socio_id IS NULL THEN
    SELECT responsable_socio_id INTO tarea_socio
    FROM public.tareas
    WHERE id = NEW.tarea_id;
    NEW.socio_id := tarea_socio;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_subtarea_count()
RETURNS TRIGGER AS $$
DECLARE
  max_bloques integer;
  total integer;
BEGIN
  SELECT bloques_planificados INTO max_bloques FROM public.tareas WHERE id = NEW.tarea_id;
  IF max_bloques IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO total
  FROM public.tareas_subtareas
  WHERE tarea_id = NEW.tarea_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000');

  IF TG_OP = 'INSERT' THEN
    total := total + 1;
  END IF;

  IF total > max_bloques THEN
    RAISE EXCEPTION 'No se pueden crear más de % bloques para la tarea %', max_bloques, NEW.tarea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_socio_max_bloques()
RETURNS TRIGGER AS $$
DECLARE
  activo integer;
  socio uuid;
BEGIN
  socio := COALESCE(NEW.socio_id, (SELECT responsable_socio_id FROM public.tareas WHERE id = NEW.tarea_id));
  IF socio IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.estado = 'en_progreso' THEN
    SELECT COUNT(*) INTO activo
    FROM public.tareas_subtareas
    WHERE socio_id = socio
      AND estado = 'en_progreso'
      AND id <> NEW.id;

    IF activo >= 2 THEN
      RAISE EXCEPTION 'El socio % ya tiene 2 bloques en progreso', socio;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inherit_subtarea_socio ON public.tareas_subtareas;
CREATE TRIGGER trg_inherit_subtarea_socio
  BEFORE INSERT OR UPDATE OF socio_id, tarea_id
  ON public.tareas_subtareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.inherit_subtarea_socio();

DROP TRIGGER IF EXISTS trg_enforce_socio_max_bloques ON public.tareas_subtareas;
CREATE TRIGGER trg_enforce_socio_max_bloques
  BEFORE INSERT OR UPDATE OF estado, socio_id
  ON public.tareas_subtareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_socio_max_bloques();

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260512013000_cliente_wallet_mvp.sql

CREATE OR REPLACE FUNCTION public.touch_cliente_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trg_touch_cliente_wallets ON public.cliente_wallets;
CREATE TRIGGER trg_touch_cliente_wallets
  BEFORE UPDATE ON public.cliente_wallets
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_cliente_wallets_updated_at();

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260526150000_socio_perfil_metodos_colaboradores.sql

CREATE OR REPLACE FUNCTION public.touch_socio_perfil_extra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.touch_socio_metodos_retiro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.touch_socio_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_socio_perfil_extra ON public.socio_perfil_extra;
CREATE TRIGGER trg_touch_socio_perfil_extra
  BEFORE UPDATE ON public.socio_perfil_extra
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_perfil_extra_updated_at();

DROP TRIGGER IF EXISTS trg_touch_socio_metodos_retiro ON public.socio_metodos_retiro;
CREATE TRIGGER trg_touch_socio_metodos_retiro
  BEFORE UPDATE ON public.socio_metodos_retiro
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_metodos_retiro_updated_at();

DROP TRIGGER IF EXISTS trg_touch_socio_colaboradores ON public.socio_colaboradores;
CREATE TRIGGER trg_touch_socio_colaboradores
  BEFORE UPDATE ON public.socio_colaboradores
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_colaboradores_updated_at();

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260526160000_socio_extensiones_v2.sql

CREATE OR REPLACE FUNCTION public.touch_socio_colab_asig_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_socio_colab_asig ON public.socio_colaborador_asignaciones;
CREATE TRIGGER trg_touch_socio_colab_asig
  BEFORE UPDATE ON public.socio_colaborador_asignaciones
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_colab_asig_updated_at();
