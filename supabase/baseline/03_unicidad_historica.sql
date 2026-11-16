-- Restricciones únicas e índices únicos recuperados de migraciones históricas de otras ramas.
-- Mejor esfuerzo: las que referencian tablas o columnas que ya no existen se listan como no aplicadas.

-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20251210T120000_wallet_schema.sql
alter table public.wallet_saldos add constraint wallet_saldos_owner_tipo_owner_id_key unique (owner_tipo, owner_id);
alter table public.wallet_movimientos add constraint wallet_movimientos_subtarea_id_tipo_key unique (subtarea_id, tipo);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20251210T122000_tareas_subtareas_blocks.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_subtareas_bloque ON public.tareas_subtareas(tarea_id, bloque_index);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260424120000_cliente_socio_agenda.sql
alter table public.cliente_socio_agenda add constraint cliente_socio_agenda_org_id_socio_id_key unique (org_id, socio_id);
CREATE UNIQUE INDEX IF NOT EXISTS socios_public_codigo_unique ON public.socios (public_codigo) WHERE public_codigo IS NOT NULL;
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260502190000_qr_tokens_socio_asociacion.sql
alter table public.qr_tokens add constraint qr_tokens_token_key unique (token);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260504100000_leader_invites.sql
alter table public.leader_invites add constraint leader_invites_org_id_email_key unique (org_id, email);
alter table public.leader_invites add constraint leader_invites_token_key unique (token);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260512013000_cliente_wallet_mvp.sql
alter table public.cliente_wallets add constraint cliente_wallets_org_id_key unique (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cliente_wallet_reserva_tarea_activa ON public.cliente_wallet_movimientos(org_id, referencia_tipo, referencia_id, tipo) WHERE tipo = 'RESERVA_TAREA' AND estado IN ('pendiente', 'confirmado') AND referencia_tipo = 'tarea' AND referencia_id IS NOT NULL;
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260526150000_socio_perfil_metodos_colaboradores.sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_socio_metodos_retiro_principal ON public.socio_metodos_retiro(socio_id) WHERE es_principal AND activo;
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260625150000_canvas_task_templates.sql
alter table public.canvas_task_templates add constraint canvas_task_templates_slug_key unique (slug);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260714120000_obra_check_mvp.sql
alter table public.obra_check_sessions add constraint obra_check_sessions_session_token_key unique (session_token);
alter table public.obra_check_blocks add constraint obra_check_blocks_session_id_client_id_key unique (session_id, client_id);
alter table public.obra_check_tasks add constraint obra_check_tasks_session_id_client_id_key unique (session_id, client_id);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260716160000_obra_check_form_invites.sql
alter table public.obra_check_invites add constraint obra_check_invites_token_key unique (token);
-- ===== origin/claude/obra-check-whatsapp-share-pxm23m:apps/web/supabase/migrations/20260716180000_obra_check_fases_budget_groups.sql
alter table public.obra_check_budget_groups add constraint obra_check_budget_groups_session_id_client_id_key unique (session_id, client_id);
