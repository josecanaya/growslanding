-- Extensiones socio v2: MP, colaboradores enriquecidos, nombre comercial, asignaciones futuras

ALTER TABLE public.socio_perfil_extra
  ADD COLUMN IF NOT EXISTS nombre_comercial text;

ALTER TABLE public.socio_metodos_retiro
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'transferencia';

ALTER TABLE public.socio_metodos_retiro
  ADD COLUMN IF NOT EXISTS mercado_pago_cvu text;

ALTER TABLE public.socio_metodos_retiro
  ADD COLUMN IF NOT EXISTS mercado_pago_alias text;

ALTER TABLE public.socio_colaboradores
  ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.socio_colaboradores
  ADD COLUMN IF NOT EXISTS categoria text;

-- Estructura preparatoria para futura asignación de tareas (sin lógica de negocio aún)
CREATE TABLE IF NOT EXISTS public.socio_colaborador_asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.socio_colaboradores(id) ON DELETE CASCADE,
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  tarea_id uuid REFERENCES public.tareas(id) ON DELETE SET NULL,
  subtarea_id uuid REFERENCES public.tareas_subtareas(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT socio_colab_asig_estado_check
    CHECK (estado IN ('pendiente', 'asignada', 'en_progreso', 'completada', 'cancelada'))
);

CREATE INDEX IF NOT EXISTS idx_socio_colab_asig_colaborador
  ON public.socio_colaborador_asignaciones(colaborador_id);

CREATE INDEX IF NOT EXISTS idx_socio_colab_asig_tarea
  ON public.socio_colaborador_asignaciones(tarea_id)
  WHERE tarea_id IS NOT NULL;

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
