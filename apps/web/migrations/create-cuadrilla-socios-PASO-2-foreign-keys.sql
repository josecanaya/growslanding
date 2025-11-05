-- ============================================================================
-- PASO 2: AGREGAR FOREIGN KEYS
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 1
-- ============================================================================

-- Verificar que la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'cuadrilla_socios'
  ) THEN
    RAISE EXCEPTION 'ERROR: La tabla cuadrilla_socios no existe. Debes ejecutar el PASO 1 primero.';
  END IF;
END $$;

-- Agregar foreign key a cuadrillas (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
      AND table_name = 'cuadrilla_socios'
      AND constraint_name = 'fk_cuadrilla_socios_cuadrilla'
  ) THEN
    ALTER TABLE public.cuadrilla_socios
      ADD CONSTRAINT fk_cuadrilla_socios_cuadrilla 
      FOREIGN KEY (cuadrilla_id) 
      REFERENCES public.cuadrillas(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key a cuadrillas agregada exitosamente';
  ELSE
    RAISE NOTICE '⚠️ La foreign key fk_cuadrilla_socios_cuadrilla ya existe. Saltando...';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'ERROR al agregar foreign key a cuadrillas: %', SQLERRM;
END $$;

-- Agregar foreign key a socios (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' 
      AND table_name = 'cuadrilla_socios'
      AND constraint_name = 'fk_cuadrilla_socios_socio'
  ) THEN
    ALTER TABLE public.cuadrilla_socios
      ADD CONSTRAINT fk_cuadrilla_socios_socio 
      FOREIGN KEY (socio_id) 
      REFERENCES public.socios(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key a socios agregada exitosamente';
  ELSE
    RAISE NOTICE '⚠️ La foreign key fk_cuadrilla_socios_socio ya existe. Saltando...';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'ERROR al agregar foreign key a socios: %', SQLERRM;
END $$;

-- Verificar que las foreign keys se crearon
SELECT 
  'Verificación de Foreign Keys' as resultado,
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'cuadrilla_socios'
  AND constraint_type = 'FOREIGN KEY'
ORDER BY constraint_name;
