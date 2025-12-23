-- ============================================
-- MIGRACIÓN: Agregar obra_id a tablas eventos y elementos
-- ============================================
-- Ejecutar estos comandos en Supabase SQL Editor

-- 1. Agregar obra_id a la tabla eventos
-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'eventos' 
        AND column_name = 'obra_id'
    ) THEN
        ALTER TABLE eventos 
        ADD COLUMN obra_id UUID REFERENCES obras(id) ON DELETE CASCADE;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS idx_eventos_obra_id ON eventos(obra_id);
        
        RAISE NOTICE 'Columna obra_id agregada a la tabla eventos';
    ELSE
        RAISE NOTICE 'La columna obra_id ya existe en la tabla eventos';
    END IF;
END $$;

-- 2. Agregar obra_id a la tabla elementos (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'elementos' 
        AND column_name = 'obra_id'
    ) THEN
        ALTER TABLE elementos 
        ADD COLUMN obra_id UUID REFERENCES obras(id) ON DELETE CASCADE;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS idx_elementos_obra_id ON elementos(obra_id);
        
        RAISE NOTICE 'Columna obra_id agregada a la tabla elementos';
    ELSE
        RAISE NOTICE 'La columna obra_id ya existe en la tabla elementos';
    END IF;
END $$;

-- 3. Verificar que org_id existe en eventos (debería existir según el error)
-- Si no existe, agregarlo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'eventos' 
        AND column_name = 'org_id'
    ) THEN
        ALTER TABLE eventos 
        ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS idx_eventos_org_id ON eventos(org_id);
        
        RAISE NOTICE 'Columna org_id agregada a la tabla eventos';
    ELSE
        RAISE NOTICE 'La columna org_id ya existe en la tabla eventos';
    END IF;
END $$;

-- 4. (Opcional) Poblar obra_id en eventos existentes basándose en tarea_id
-- Esto actualiza los eventos existentes con el obra_id de su tarea asociada
UPDATE eventos e
SET obra_id = t.obra_id
FROM tareas t
WHERE e.tarea_id = t.id 
  AND e.obra_id IS NULL
  AND t.obra_id IS NOT NULL;

-- 5. (Opcional) Poblar org_id en eventos existentes basándose en tarea_id
-- Esto actualiza los eventos existentes con el org_id de su tarea asociada
UPDATE eventos e
SET org_id = t.org_id
FROM tareas t
WHERE e.tarea_id = t.id 
  AND e.org_id IS NULL
  AND t.org_id IS NOT NULL;

-- Verificar resultados
SELECT 
    'eventos' as tabla,
    COUNT(*) FILTER (WHERE obra_id IS NOT NULL) as con_obra_id,
    COUNT(*) FILTER (WHERE obra_id IS NULL) as sin_obra_id,
    COUNT(*) FILTER (WHERE org_id IS NOT NULL) as con_org_id,
    COUNT(*) FILTER (WHERE org_id IS NULL) as sin_org_id,
    COUNT(*) as total
FROM eventos
UNION ALL
SELECT 
    'elementos' as tabla,
    COUNT(*) FILTER (WHERE obra_id IS NOT NULL) as con_obra_id,
    COUNT(*) FILTER (WHERE obra_id IS NULL) as sin_obra_id,
    NULL as con_org_id,
    NULL as sin_org_id,
    COUNT(*) as total
FROM elementos;


