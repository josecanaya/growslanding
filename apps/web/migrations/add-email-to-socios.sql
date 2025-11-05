-- Migration: Agregar columna email a la tabla socios
-- Ejecutar en Supabase SQL Editor

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'socios' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.socios 
        ADD COLUMN email TEXT;
        
        COMMENT ON COLUMN public.socios.email IS 'Email del socio para autenticación y contacto';
        
        RAISE NOTICE 'Columna email agregada exitosamente a la tabla socios';
    ELSE
        RAISE NOTICE 'La columna email ya existe en la tabla socios';
    END IF;
END $$;

-- Opcional: Agregar índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_socios_email ON public.socios(email) WHERE email IS NOT NULL;

-- Opcional: Agregar constraint para validar formato de email (opcional, puede ser demasiado restrictivo)
-- ALTER TABLE public.socios 
-- ADD CONSTRAINT check_email_format 
-- CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

