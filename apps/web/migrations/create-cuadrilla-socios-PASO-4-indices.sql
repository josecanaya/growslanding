-- ============================================================================
-- PASO 4: CREAR ÍNDICES
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 3
-- ============================================================================

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_cuadrilla 
  ON public.cuadrilla_socios(cuadrilla_id);

CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_socio 
  ON public.cuadrilla_socios(socio_id);

CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_activo 
  ON public.cuadrilla_socios(activo) 
  WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_cuadrilla_socios_rol 
  ON public.cuadrilla_socios(rol_en_cuadrilla);

-- Verificar que los índices se crearon
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'cuadrilla_socios'
ORDER BY indexname;

