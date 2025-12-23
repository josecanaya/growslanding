-- FSM oficial y constraints para tareas_subtareas (bloques pagables)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tarea_subtarea_estado_oficial') THEN
    CREATE TYPE tarea_subtarea_estado_oficial AS ENUM ('pendiente', 'en_progreso', 'para_validar', 'validado', 'rechazado');
  END IF;
END $$;

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS estado_tmp tarea_subtarea_estado_oficial NOT NULL DEFAULT 'pendiente';

UPDATE public.tareas_subtareas
SET estado_tmp = CASE
  WHEN lower(coalesce(estado,'')) IN ('en_ejecucion','en progreso','en_progreso') THEN 'en_progreso'
  WHEN lower(coalesce(estado,'')) IN ('finalizada','finalizado') THEN 'para_validar'
  WHEN lower(coalesce(estado,'')) IN ('validada','validado') THEN 'validado'
  WHEN lower(coalesce(estado,'')) IN ('rechazado','rechazada') THEN 'rechazado'
  ELSE 'pendiente'
END;

ALTER TABLE public.tareas_subtareas DROP COLUMN IF EXISTS estado;
ALTER TABLE public.tareas_subtareas RENAME COLUMN estado_tmp TO estado;
ALTER TABLE public.tareas_subtareas ALTER COLUMN estado SET DEFAULT 'pendiente';

-- Nuevas columnas -------------------------------------------------------------

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS bloque_index integer,
  ADD COLUMN IF NOT EXISTS socio_id uuid REFERENCES public.socios(id),
  ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES public.tareas_presupuestos(id),
  ADD COLUMN IF NOT EXISTS evidencia_cargada boolean NOT NULL DEFAULT false;

UPDATE public.tareas_subtareas
SET bloque_index = COALESCE(bloque_index, orden, orden_pago, 1);

ALTER TABLE public.tareas_subtareas
  ALTER COLUMN bloque_index SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_subtareas_bloque
  ON public.tareas_subtareas(tarea_id, bloque_index);

ALTER TABLE public.tareas_subtareas
  ALTER COLUMN evidencia_obligatoria SET DEFAULT true,
  ALTER COLUMN evidencia_obligatoria SET NOT NULL;

ALTER TABLE public.tareas_subtareas
  ADD CONSTRAINT tareas_subtareas_evidencia_check
    CHECK (estado <> 'validado' OR evidencia_cargada);

ALTER TABLE public.tareas_subtareas
  ADD CONSTRAINT tareas_subtareas_monto_not_null
    CHECK (monto_estimado IS NOT NULL);

-- Trigger: hereda socio_id desde la tarea -------------------------------------

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

DROP TRIGGER IF EXISTS trg_inherit_subtarea_socio ON public.tareas_subtareas;
CREATE TRIGGER trg_inherit_subtarea_socio
  BEFORE INSERT OR UPDATE OF socio_id, tarea_id
  ON public.tareas_subtareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.inherit_subtarea_socio();

-- Trigger: limita cantidad de bloques por tarea -------------------------------

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

DROP TRIGGER IF EXISTS trg_enforce_subtarea_count ON public.tareas_subtareas;
CREATE CONSTRAINT TRIGGER trg_enforce_subtarea_count
  AFTER INSERT ON public.tareas_subtareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_subtarea_count();

-- Trigger: máximo 2 bloques/tareas simultáneos en progreso por socio ----------

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

DROP TRIGGER IF EXISTS trg_enforce_socio_max_bloques ON public.tareas_subtareas;
CREATE TRIGGER trg_enforce_socio_max_bloques
  BEFORE INSERT OR UPDATE OF estado, socio_id
  ON public.tareas_subtareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_socio_max_bloques();

