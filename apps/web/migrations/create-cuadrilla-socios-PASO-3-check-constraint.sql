-- ============================================================================
-- PASO 3: AGREGAR CHECK CONSTRAINT PARA ROL
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 1
-- IMPORTANTE: Este paso verifica que la columna 'rol' existe antes de continuar
-- ============================================================================

-- Primero verificar que la tabla existe
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

-- Verificar que la columna 'rol_en_cuadrilla' existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'cuadrilla_socios' 
      AND column_name = 'rol_en_cuadrilla'
  ) THEN
    RAISE EXCEPTION 'ERROR: La columna "rol_en_cuadrilla" no existe en la tabla cuadrilla_socios. Verifica que el PASO 1 se ejecutó correctamente.';
  END IF;
  
  RAISE NOTICE '✅ Columna "rol_en_cuadrilla" encontrada. Procediendo a agregar constraint...';
END $$;

-- Agregar check constraint para rol (solo si no existe)
DO $$
BEGIN
  -- Verificar si el constraint ya existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public' 
      AND constraint_name = 'check_rol_valido'
  ) THEN
    -- Agregar el constraint
    ALTER TABLE public.cuadrilla_socios
      ADD CONSTRAINT check_rol_valido 
      CHECK (rol_en_cuadrilla IN ('encargado', 'oficial', 'ayudante', 'integrante'));
    
    RAISE NOTICE '✅ Constraint check_rol_valido agregado exitosamente';
  ELSE
    RAISE NOTICE '⚠️ El constraint check_rol_valido ya existe. Saltando...';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'ERROR al agregar constraint: %', SQLERRM;
END $$;

-- Verificar que el constraint se creó
SELECT 
  'Verificación del constraint' as resultado,
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public' 
  AND constraint_name = 'check_rol_valido';

-- Verificar también las columnas de la tabla para debug
SELECT 
  'Columnas de la tabla' as verificacion,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cuadrilla_socios'
ORDER BY ordinal_position;
