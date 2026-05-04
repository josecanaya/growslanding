-- Tokens para QR de socio (scope socio_asociacion). Requerido por /api/socios/mi-qr.
-- Si esta tabla no existe, el insert falla y la cuenta socio no puede generar QR.

CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  ref_id uuid NOT NULL,
  scope text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_scope_ref
  ON public.qr_tokens (scope, ref_id)
  WHERE enabled = true;
