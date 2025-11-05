-- ============================================================================
-- PASO 7: MIGRAR DATOS EXISTENTES (OPCIONAL)
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 6
-- Este paso es OPCIONAL - solo si quieres migrar relaciones existentes
-- ============================================================================

DO $$
DECLARE
  cuadrilla_record RECORD;
  socio_record RECORD;
  tiene_email BOOLEAN;
  tiene_telefono BOOLEAN;
  tiene_nombre BOOLEAN;
  tiene_contacto BOOLEAN;
  relaciones_creadas INTEGER := 0;
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
  
  RAISE NOTICE 'Verificando columnas en socios: email=%, telefono=%, nombre=%, contacto=%', 
    tiene_email, tiene_telefono, tiene_nombre, tiene_contacto;
  
  -- Para cada cuadrilla, buscar socio que coincida con encargado
  FOR cuadrilla_record IN 
    SELECT id, encargado, email_encargado, telefono_encargado, org_id
    FROM public.cuadrillas
    WHERE (encargado IS NOT NULL OR email_encargado IS NOT NULL OR telefono_encargado IS NOT NULL)
  LOOP
    -- Resetear variable
    socio_record := NULL;
    
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
          INSERT INTO public.cuadrilla_socios (cuadrilla_id, socio_id, rol_en_cuadrilla, activo)
          VALUES (cuadrilla_record.id, socio_record.id, 'encargado', TRUE)
          ON CONFLICT (cuadrilla_id, socio_id) DO NOTHING;
          
          IF FOUND THEN
            relaciones_creadas := relaciones_creadas + 1;
            RAISE NOTICE '✅ Vinculado socio % a cuadrilla % como encargado', 
              socio_record.id, cuadrilla_record.id;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE '⚠️ Error al crear relación para cuadrilla %: %', 
            cuadrilla_record.id, SQLERRM;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Si hay error, continuar sin crear relación para esta cuadrilla
      RAISE NOTICE '⚠️ Error al buscar socio para cuadrilla %: %', 
        cuadrilla_record.id, SQLERRM;
      CONTINUE;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Migración de datos completada. Relaciones creadas: %', relaciones_creadas;
END $$;

