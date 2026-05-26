-- =====================================================================
-- Socio: perfil extendido, métodos de retiro y colaboradores (cuadrilla)
-- =====================================================================
-- Notas:
--  * No modifica la tabla `socios` existente (se respeta su esquema actual).
--  * Almacena datos en tablas paralelas vinculadas por `socio_id` (FK).
--  * Todas las tablas usan RLS deshabilitado en este MVP: el acceso se
--    controla desde las route handlers (service-role) tras autenticar al
--    socio (mismo patrón que `tareas_subtareas`).

-- ---------------------------------------------------------------------
-- 1) Perfil extendido del socio
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.socio_perfil_extra (
  socio_id uuid PRIMARY KEY REFERENCES public.socios(id) ON DELETE CASCADE,
  apellido text,
  especialidades_secundarias text[] DEFAULT ARRAY[]::text[],
  descripcion text,
  localidad text,
  experiencia text,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_socio_perfil_extra_updated_at()
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

-- ---------------------------------------------------------------------
-- 2) Métodos de retiro (CVU / CBU / Alias)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.socio_metodos_retiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  titular text NOT NULL,
  banco text,
  cvu text,
  cbu text,
  alias text,
  es_principal boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT socio_metodos_retiro_min_check
    CHECK (
      COALESCE(NULLIF(cvu, ''), NULLIF(cbu, ''), NULLIF(alias, '')) IS NOT NULL
    ),
  CONSTRAINT socio_metodos_retiro_cvu_format
    CHECK (cvu IS NULL OR cvu ~ '^[0-9]{22}$'),
  CONSTRAINT socio_metodos_retiro_cbu_format
    CHECK (cbu IS NULL OR cbu ~ '^[0-9]{22}$'),
  CONSTRAINT socio_metodos_retiro_alias_format
    CHECK (alias IS NULL OR char_length(alias) BETWEEN 6 AND 40)
);

CREATE INDEX IF NOT EXISTS idx_socio_metodos_retiro_socio
  ON public.socio_metodos_retiro(socio_id)
  WHERE activo;

-- Asegurar un único principal por socio
CREATE UNIQUE INDEX IF NOT EXISTS uq_socio_metodos_retiro_principal
  ON public.socio_metodos_retiro(socio_id)
  WHERE es_principal AND activo;

CREATE OR REPLACE FUNCTION public.touch_socio_metodos_retiro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_socio_metodos_retiro ON public.socio_metodos_retiro;
CREATE TRIGGER trg_touch_socio_metodos_retiro
  BEFORE UPDATE ON public.socio_metodos_retiro
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_metodos_retiro_updated_at();

-- ---------------------------------------------------------------------
-- 3) Colaboradores de cuadrilla (registro libre del socio)
-- ---------------------------------------------------------------------
-- Independiente de `cuadrilla_socios` (que requiere socio_id real).
-- Acá el socio puede listar integrantes de su equipo sin necesidad de
-- darlos de alta como usuarios.
CREATE TABLE IF NOT EXISTS public.socio_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id uuid NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  apellido text,
  dni text,
  telefono text,
  especialidad text,
  observaciones text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_socio_colaboradores_socio
  ON public.socio_colaboradores(socio_id)
  WHERE activo;

CREATE OR REPLACE FUNCTION public.touch_socio_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_socio_colaboradores ON public.socio_colaboradores;
CREATE TRIGGER trg_touch_socio_colaboradores
  BEFORE UPDATE ON public.socio_colaboradores
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_socio_colaboradores_updated_at();
