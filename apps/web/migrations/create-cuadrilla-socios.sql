-- Migración: Crear tabla intermedia cuadrilla_socios
-- Fecha: 2025-01-XX
-- Objetivo: Establecer relación explícita entre socios y cuadrillas

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.cuadrilla_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID NOT NULL,
  socio_id UUID NOT NULL,
  rol TEXT DEFAULT 'integrante',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados: un socio solo puede estar una vez por cuadrilla
  CONSTRAINT unique_cuadrilla_socio UNIQUE(cuadrilla_id, socio_id),
  
  -- Foreign keys
  CONSTRAINT fk_cuadrilla_socios_cuadrilla FOREIGN KEY (cuadrilla_id) REFERENCES public.cuadrillas(id) ON DELETE CASCADE,
  CONSTRAINT fk_cuadrilla_socios_socio FOREIGN KEY (socio_id) REFERENCES public.socios(id) ON DELETE CASCADE,
  
  -- Check constraint para rol
  CONSTRAINT check_rol_valido CHECK (rol IN ('encargado', 'oficial', 'ayudante', 'integrante'))
);

-- Índices para búsquedas rápidas (después de crear la tabla)
CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_cuadrilla ON public.cuadrilla_socios(cuadrilla_id);
CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_socio ON public.cuadrilla_socios(socio_id);
CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_activo ON public.cuadrilla_socios(activo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_rol ON public.cuadrilla_socios(rol);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cuadrilla_socios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_cuadrilla_socios_updated_at ON public.cuadrilla_socios;
CREATE TRIGGER trigger_update_cuadrilla_socios_updated_at
  BEFORE UPDATE ON public.cuadrilla_socios
  FOR EACH ROW
  EXECUTE FUNCTION update_cuadrilla_socios_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.cuadrilla_socios IS 'Tabla intermedia que relaciona socios con cuadrillas. Permite que un socio pertenezca a múltiples cuadrillas y que una cuadrilla tenga múltiples socios.';
COMMENT ON COLUMN public.cuadrilla_socios.rol IS 'Rol del socio en la cuadrilla: encargado (líder), oficial, ayudante, integrante (por defecto)';
COMMENT ON COLUMN public.cuadrilla_socios.activo IS 'Indica si la relación está activa. Se usa soft delete en lugar de eliminar físicamente.';

-- ============================================================================
-- MIGRACIÓN DE DATOS EXISTENTES (OPCIONAL)
-- ============================================================================
-- Este bloque migra relaciones existentes desde cuadrillas.encargado a cuadrilla_socios
-- Si NO quieres migrar datos, puedes comentar todo este bloque DO $$ hasta el END $$
-- ============================================================================

DO $$
DECLARE
  cuadrilla_record RECORD;
  socio_record RECORD;
  tiene_email BOOLEAN;
  tiene_telefono BOOLEAN;
  tiene_nombre BOOLEAN;
  tiene_contacto BOOLEAN;
  condiciones TEXT;
  query_final TEXT;
BEGIN
  -- Verificar qué columnas existen en la tabla socios
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'socios' 
      AND column_name = 'email'
  ) INTO tiene_email;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'socios' 
      AND column_name = 'telefono'
  ) INTO tiene_telefono;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'socios' 
      AND column_name = 'nombre'
  ) INTO tiene_nombre;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'socios' 
      AND column_name = 'contacto'
  ) INTO tiene_contacto;
  
  RAISE NOTICE 'Verificando columnas en socios: email=%, telefono=%, nombre=%, contacto=%', tiene_email, tiene_telefono, tiene_nombre, tiene_contacto;
  
  -- Para cada cuadrilla, buscar socio que coincida con encargado
  FOR cuadrilla_record IN 
    SELECT id, encargado, email_encargado, telefono_encargado, org_id
    FROM public.cuadrillas
    WHERE (encargado IS NOT NULL OR email_encargado IS NOT NULL OR telefono_encargado IS NOT NULL)
  LOOP
    -- Resetear variables
    socio_record := NULL;
    condiciones := '';
    
    -- Construir condiciones basadas en columnas disponibles
    BEGIN
      IF tiene_email AND cuadrilla_record.email_encargado IS NOT NULL THEN
        -- Buscar por email
        SELECT id INTO socio_record
        FROM public.socios
        WHERE org_id = cuadrilla_record.org_id
          AND email = cuadrilla_record.email_encargado
        LIMIT 1;
      ELSIF tiene_telefono AND cuadrilla_record.telefono_encargado IS NOT NULL THEN
        -- Buscar por teléfono
        SELECT id INTO socio_record
        FROM public.socios
        WHERE org_id = cuadrilla_record.org_id
          AND telefono = cuadrilla_record.telefono_encargado
        LIMIT 1;
      ELSIF tiene_nombre AND cuadrilla_record.encargado IS NOT NULL THEN
        -- Buscar por nombre (coincidencia parcial)
        SELECT id INTO socio_record
        FROM public.socios
        WHERE org_id = cuadrilla_record.org_id
          AND nombre ILIKE '%' || cuadrilla_record.encargado || '%'
        LIMIT 1;
      ELSIF tiene_contacto AND cuadrilla_record.email_encargado IS NOT NULL THEN
        -- Buscar por contacto (fallback)
        SELECT id INTO socio_record
        FROM public.socios
        WHERE org_id = cuadrilla_record.org_id
          AND contacto = cuadrilla_record.email_encargado
        LIMIT 1;
      END IF;
      
      -- Si se encontró socio, crear relación
      IF socio_record.id IS NOT NULL THEN
        BEGIN
          INSERT INTO public.cuadrilla_socios (cuadrilla_id, socio_id, rol, activo)
          VALUES (cuadrilla_record.id, socio_record.id, 'encargado', TRUE)
          ON CONFLICT (cuadrilla_id, socio_id) DO NOTHING;
          
          RAISE NOTICE '✅ Vinculado socio % a cuadrilla % como encargado', socio_record.id, cuadrilla_record.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE '⚠️ Error al crear relación para cuadrilla %: %', cuadrilla_record.id, SQLERRM;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Si hay error, continuar sin crear relación para esta cuadrilla
      RAISE NOTICE '⚠️ Error al buscar socio para cuadrilla %: %', cuadrilla_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Migración de datos completada';
END $$;

-- Verificación: Mostrar estadísticas
DO $$
DECLARE
  total_relaciones INTEGER;
  relaciones_activas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_relaciones FROM public.cuadrilla_socios;
  SELECT COUNT(*) INTO relaciones_activas FROM public.cuadrilla_socios WHERE activo = TRUE;
  
  RAISE NOTICE 'Migración completada. Total relaciones: %, Activas: %', total_relaciones, relaciones_activas;
END $$;

