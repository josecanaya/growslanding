-- Agregar columna obra_id a la tabla mensajes si no existe
ALTER TABLE mensajes
ADD COLUMN IF NOT EXISTS obra_id uuid;

-- Index para acelerar búsquedas por obra y usuario
CREATE INDEX IF NOT EXISTS idx_mensajes_obra_usuario
ON mensajes (obra_id, remitente_id, destinatario_id);

-- Comentario: Esta migración agrega la columna obra_id a la tabla mensajes
-- para permitir filtrar mensajes por obra, como en un chat tipo WhatsApp por grupo.

