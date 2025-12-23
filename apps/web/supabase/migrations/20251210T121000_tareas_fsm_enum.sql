-- FSM oficial para tareas + columnas auxiliares

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tarea_estado_oficial') THEN
    CREATE TYPE tarea_estado_oficial AS ENUM ('pendiente', 'en_progreso', 'para_validar', 'validada', 'rechazada');
  END IF;
END $$;

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS estado_tmp tarea_estado_oficial NOT NULL DEFAULT 'pendiente';

UPDATE public.tareas
SET estado_tmp = CASE
  WHEN lower(coalesce(estado, '')) IN ('en_ejecucion','en progreso','en_progreso') THEN 'en_progreso'
  WHEN lower(coalesce(estado, '')) IN ('finalizado','terminada','terminado','en_revision','para_validar') THEN 'para_validar'
  WHEN lower(coalesce(estado, '')) IN ('validada','validado') THEN 'validada'
  WHEN lower(coalesce(estado, '')) IN ('rechazada','rechazado') THEN 'rechazada'
  ELSE 'pendiente'
END;

ALTER TABLE public.tareas DROP COLUMN IF EXISTS estado;
ALTER TABLE public.tareas RENAME COLUMN estado_tmp TO estado;
ALTER TABLE public.tareas ALTER COLUMN estado SET DEFAULT 'pendiente';

-- Bloques/días planificados ---------------------------------------------------

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS bloques_planificados integer;

UPDATE public.tareas
SET bloques_planificados = COALESCE(bloques_planificados, 1);

ALTER TABLE public.tareas
  ALTER COLUMN bloques_planificados SET NOT NULL,
  ALTER COLUMN bloques_planificados SET DEFAULT 1,
  ADD CONSTRAINT tareas_bloques_planificados_check CHECK (bloques_planificados >= 1);

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS dias_presupuesto integer;

WITH ultimo_presupuesto AS (
  SELECT DISTINCT ON (tarea_id)
    tarea_id,
    COALESCE(dias_reales, 1) AS dias_efectivos
  FROM public.tareas_presupuestos
  WHERE estado = 'APROBADO'
  ORDER BY tarea_id, created_at DESC
)
UPDATE public.tareas t
SET dias_presupuesto = COALESCE(up.dias_efectivos, t.bloques_planificados, 1)
FROM ultimo_presupuesto up
WHERE up.tarea_id = t.id;

UPDATE public.tareas
SET dias_presupuesto = COALESCE(dias_presupuesto, bloques_planificados, 1);

ALTER TABLE public.tareas
  ALTER COLUMN dias_presupuesto SET NOT NULL,
  ADD CONSTRAINT tareas_bloques_dias_match CHECK (bloques_planificados = dias_presupuesto);

-- Responsable socio -----------------------------------------------------------

ALTER TABLE public.tareas
  ADD COLUMN IF NOT EXISTS responsable_socio_id uuid REFERENCES public.socios(id);

-- Trigger para sincronizar días cuando se aprueba un presupuesto --------------

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

DROP TRIGGER IF EXISTS trg_sync_dias_presupuesto ON public.tareas_presupuestos;
CREATE TRIGGER trg_sync_dias_presupuesto
  AFTER INSERT OR UPDATE ON public.tareas_presupuestos
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_dias_presupuesto();

-- Trigger para máximo 2 tareas simultáneas ------------------------------------

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

DROP TRIGGER IF EXISTS trg_enforce_socio_max_tareas ON public.tareas;
CREATE TRIGGER trg_enforce_socio_max_tareas
  BEFORE INSERT OR UPDATE OF estado, responsable_socio_id
  ON public.tareas
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_socio_max_tareas();
