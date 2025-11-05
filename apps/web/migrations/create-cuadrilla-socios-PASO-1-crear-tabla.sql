-- ============================================================================
-- PASO 1: CREAR TABLA cuadrilla_socios
-- ============================================================================
-- Ejecutar SOLO este paso primero
-- ============================================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.cuadrilla_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID NOT NULL,
  socio_id UUID NOT NULL,
  rol_en_cuadrilla TEXT DEFAULT 'integrante',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados: un socio solo puede estar una vez por cuadrilla
  CONSTRAINT unique_cuadrilla_socio UNIQUE(cuadrilla_id, socio_id)
);

-- Verificar que la tabla se creó correctamente
SELECT 
  'Tabla creada exitosamente' as resultado,
  COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'cuadrilla_socios';

