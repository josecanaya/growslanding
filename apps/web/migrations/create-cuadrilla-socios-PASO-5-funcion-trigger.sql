-- ============================================================================
-- PASO 5: CREAR FUNCIÓN Y TRIGGER PARA updated_at
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 4
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cuadrilla_socios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_cuadrilla_socios_updated_at 
  ON public.cuadrilla_socios;

CREATE TRIGGER trigger_update_cuadrilla_socios_updated_at
  BEFORE UPDATE ON public.cuadrilla_socios
  FOR EACH ROW
  EXECUTE FUNCTION update_cuadrilla_socios_updated_at();

-- Verificar que la función y trigger se crearon
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND event_object_table = 'cuadrilla_socios';

