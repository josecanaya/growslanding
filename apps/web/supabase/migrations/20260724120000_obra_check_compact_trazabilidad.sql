-- Obra Check — compactación de tablas + trazabilidad + validación de contacto.
--
-- 1) FUSIÓN wa_messages → invites: obra_check_wa_messages era write-only (ninguna ruta la leía)
--    y duplicaba session/contact/block/tipo que ya viven en obra_check_invites. Se agrega el
--    texto del mensaje al invite y se elimina la tabla. (10 tablas → 9)
-- 2) VALIDACIÓN: el contratista valida con teléfono O email. La columna telefono era NOT NULL
--    y rompía el guardado cuando validaba solo con email (bug). Se relaja a nivel columna y se
--    exige a nivel fila: al menos uno de los dos.
-- 3) TRAZABILIDAD: vista obra_check_trazabilidad — un solo SELECT responde:
--    ¿qué email hizo el ETL? → ¿a qué contacto le envió qué grupo y cuándo? → ¿quién completó
--    el formulario y con qué teléfono/email validó?

-- ── 1. invites absorbe el payload del mensaje ────────────────────────────────
ALTER TABLE public.obra_check_invites
  ADD COLUMN IF NOT EXISTS texto text,
  ADD COLUMN IF NOT EXISTS wa_link text;

-- Migrar el último texto histórico por (session, block, contact, tipo) — best effort.
UPDATE public.obra_check_invites i
SET texto = w.texto
FROM (
  SELECT DISTINCT ON (session_id, block_client_id, contact_id, tipo)
    session_id, block_client_id, contact_id, tipo, texto
  FROM public.obra_check_wa_messages
  ORDER BY session_id, block_client_id, contact_id, tipo, generado_at DESC
) w
WHERE i.texto IS NULL
  AND i.session_id = w.session_id
  AND i.block_client_id = w.block_client_id
  AND i.tipo = w.tipo
  AND (i.contact_id = w.contact_id OR (i.contact_id IS NULL AND w.contact_id IS NULL));

DROP TABLE IF EXISTS public.obra_check_wa_messages;

-- ── 2. Validación de contacto del contratista (teléfono O email) ─────────────
ALTER TABLE public.obra_check_form_responses
  ALTER COLUMN telefono DROP NOT NULL;

ALTER TABLE public.obra_check_form_responses
  DROP CONSTRAINT IF EXISTS obra_check_form_responses_contacto_valido;
ALTER TABLE public.obra_check_form_responses
  ADD CONSTRAINT obra_check_form_responses_contacto_valido
  CHECK (
    (telefono IS NOT NULL AND btrim(telefono) <> '')
    OR (email IS NOT NULL AND btrim(email) <> '')
  );

-- ── 3. Vista de trazabilidad (registro pedido por marketing) ─────────────────
-- security_invoker: la vista respeta el RLS deny-all de las tablas base — solo el
-- service role (API routes) puede leerla, igual que todo obra_check_*.
CREATE OR REPLACE VIEW public.obra_check_trazabilidad
WITH (security_invoker = true) AS
SELECT
  s.id                AS session_id,
  s.email             AS solicitante_email,
  s.empresa           AS solicitante_empresa,
  s.tipo_obra,
  s.created_at        AS sesion_creada,
  s.consent_patrones,
  i.id                AS invite_id,
  i.tipo              AS tipo_envio,
  i.block_client_id,
  i.created_at        AS enviado_at,
  i.responded_at,
  c.nombre            AS contacto_nombre,
  c.rubro             AS contacto_rubro,
  c.telefono          AS contacto_telefono,
  r.id                AS respuesta_id,
  r.nombre            AS respondio_nombre,
  r.telefono          AS respondio_telefono,
  r.email             AS respondio_email,
  r.acepta_contacto,
  r.created_at        AS respondido_at
FROM public.obra_check_sessions s
LEFT JOIN public.obra_check_invites i ON i.session_id = s.id
LEFT JOIN public.obra_check_contacts c ON c.id = i.contact_id
LEFT JOIN public.obra_check_form_responses r ON r.invite_id = i.id;

CREATE INDEX IF NOT EXISTS idx_obra_check_invites_contact ON public.obra_check_invites(contact_id);
CREATE INDEX IF NOT EXISTS idx_obra_check_form_responses_invite ON public.obra_check_form_responses(invite_id);
