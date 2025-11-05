-- ============================================================================
-- PASO 6: AGREGAR COMENTARIOS (OPCIONAL)
-- ============================================================================
-- Ejecutar DESPUÉS del PASO 5
-- ============================================================================

-- Comentarios para documentación
COMMENT ON TABLE public.cuadrilla_socios IS 
  'Tabla intermedia que relaciona socios con cuadrillas. Permite que un socio pertenezca a múltiples cuadrillas y que una cuadrilla tenga múltiples socios.';

COMMENT ON COLUMN public.cuadrilla_socios.rol_en_cuadrilla IS 
  'Rol del socio en la cuadrilla: encargado (líder), oficial, ayudante, integrante (por defecto)';

COMMENT ON COLUMN public.cuadrilla_socios.activo IS 
  'Indica si la relación está activa. Se usa soft delete en lugar de eliminar físicamente.';

-- Verificar comentarios
SELECT 
  obj_description('public.cuadrilla_socios'::regclass, 'pg_class') as tabla_comentario;

SELECT 
  col_description('public.cuadrilla_socios'::regclass, 
    (SELECT ordinal_position FROM information_schema.columns 
     WHERE table_schema = 'public' 
       AND table_name = 'cuadrilla_socios' 
       AND column_name = 'rol_en_cuadrilla')) as rol_comentario;

