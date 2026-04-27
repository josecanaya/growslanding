-- Permite que un socio constructor genere su QR antes de estar asociado a una
-- organización cliente. La asociación con org_id se completa luego al escanear
-- el QR desde el cliente/arquitecto.

ALTER TABLE public.socios
  ALTER COLUMN org_id DROP NOT NULL;
