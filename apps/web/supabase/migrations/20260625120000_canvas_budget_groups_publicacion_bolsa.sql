-- Publicación única del pliego + bolsa (todos los socios pueden postularse)
ALTER TABLE canvas_budget_groups
  ADD COLUMN IF NOT EXISTS bolsa_publicada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publicado_a_agenda boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pliego_publicado_at timestamptz;

COMMENT ON COLUMN canvas_budget_groups.bolsa_publicada IS 'Pliego visible en bolsa para socios no invitados por agenda';
COMMENT ON COLUMN canvas_budget_groups.publicado_a_agenda IS 'Se envió invitación directa a socios de agenda';
COMMENT ON COLUMN canvas_budget_groups.pliego_publicado_at IS 'Primera publicación del pliego; bloquea re-envíos salvo ventana de cambio';
