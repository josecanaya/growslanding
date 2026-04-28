-- Agenda de socios (contactos de obra): qué organización agendó a qué socio local,
-- con método y trazabilidad opcional al perfil origen del socio escaneado/buscado.

CREATE TABLE IF NOT EXISTS public.cliente_socio_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  socio_id uuid NOT NULL REFERENCES public.socios (id) ON DELETE CASCADE,
  source_socio_id uuid REFERENCES public.socios (id) ON DELETE SET NULL,
  metodo text NOT NULL CHECK (
    metodo IN ('qr', 'id_publico', 'email', 'telefono')
  ),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pendiente')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, socio_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_socio_agenda_org
  ON public.cliente_socio_agenda (org_id);

CREATE INDEX IF NOT EXISTS idx_cliente_socio_agenda_created
  ON public.cliente_socio_agenda (org_id, created_at DESC);

-- Código corto público para agendar sin escanear QR (no reemplaza al token del QR).
ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS public_codigo text;

CREATE UNIQUE INDEX IF NOT EXISTS socios_public_codigo_unique
  ON public.socios (public_codigo)
  WHERE public_codigo IS NOT NULL;
