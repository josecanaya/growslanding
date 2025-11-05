-- ============================================================================
-- PASO 8: VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecutar al final para verificar que todo está correcto
-- ============================================================================

-- Verificar estructura de la tabla
SELECT 
  'Estructura de la tabla' as verificacion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cuadrilla_socios'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
  'Constraints' as verificacion,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'cuadrilla_socios';

-- Verificar índices
SELECT 
  'Índices' as verificacion,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'cuadrilla_socios'
ORDER BY indexname;

-- Verificar trigger
SELECT 
  'Trigger' as verificacion,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND event_object_table = 'cuadrilla_socios';

-- Estadísticas de relaciones
SELECT 
  'Estadísticas' as verificacion,
  COUNT(*) as total_relaciones,
  COUNT(*) FILTER (WHERE activo = TRUE) as relaciones_activas,
  COUNT(*) FILTER (WHERE activo = FALSE) as relaciones_inactivas,
  COUNT(DISTINCT cuadrilla_id) as cuadrillas_vinculadas,
  COUNT(DISTINCT socio_id) as socios_vinculados
FROM public.cuadrilla_socios;

-- Distribución por rol
SELECT 
  'Distribución por rol' as verificacion,
  rol_en_cuadrilla,
  COUNT(*) as cantidad,
  COUNT(*) FILTER (WHERE activo = TRUE) as activas
FROM public.cuadrilla_socios
GROUP BY rol_en_cuadrilla
ORDER BY cantidad DESC;

