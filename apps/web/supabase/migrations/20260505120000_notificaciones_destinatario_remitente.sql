-- Notificaciones: alinear con API (GET filtra por destinatario_id; inserts usan remitente/destinatario).
-- Idempotente: si ya existen, ADD COLUMN no falla en Postgres 9.1+ con IF NOT EXISTS.

ALTER TABLE public.notificaciones
  ADD COLUMN IF NOT EXISTS destinatario_id uuid,
  ADD COLUMN IF NOT EXISTS remitente_id uuid;

COMMENT ON COLUMN public.notificaciones.destinatario_id IS 'UUID destinatario: auth.users.id (cliente) o id de fila socios (panel socio legado vía header).';
COMMENT ON COLUMN public.notificaciones.remitente_id IS 'UUID de quien genera la notificación (auth.users.id cuando aplica).';
