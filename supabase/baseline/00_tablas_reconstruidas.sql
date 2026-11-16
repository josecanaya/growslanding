-- GENERADO por scripts/entorno-pruebas/generar-baseline.mjs — no editar a mano.
-- Línea base RECONSTRUIDA desde apps/web/lib/types/supabase.gen.ts (ver README.md de esta carpeta).
-- Sirve para levantar la instancia de pruebas; no es un volcado de producción.
create extension if not exists pgcrypto;
create type public.cliente_wallet_movimiento_estado as enum ('pendiente', 'confirmado', 'rechazado', 'cancelado', 'revertido');
create type public.cliente_wallet_movimiento_tipo as enum ('CARGA_SALDO', 'RESERVA_TAREA', 'LIBERACION_PAGO', 'DEVOLUCION_RESERVA', 'COMISION_GROWS', 'AJUSTE_MANUAL');
create type public.escrow_estado as enum ('pendiente', 'retenido', 'liberado', 'reembolsado', 'cancelado', 'fallido', 'expirado');
create type public.tarea_estado as enum ('pendiente', 'en_ejecucion', 'finalizado', 'validado', 'rechazado');
create type public.tarea_estado_oficial as enum ('pendiente', 'en_progreso', 'para_validar', 'validada', 'rechazada');
create type public.tarea_subtarea_estado_oficial as enum ('pendiente', 'en_progreso', 'para_validar', 'validado', 'rechazado');
create type public.wallet_metodo_pago as enum ('EFECTIVO', 'ONLINE');
create type public.wallet_movimiento_estado as enum ('pendiente', 'completado', 'cancelado');
create type public.wallet_movimiento_tipo as enum ('CREDITO', 'DEBITO');
create type public.wallet_owner_tipo as enum ('SOCIO', 'ORG');

create table public.canvas_budget_group_tasks (
  budget_group_id uuid not null,
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  obra_id uuid not null,
  org_id uuid,
  task_node_id uuid not null
);

create table public.canvas_budget_groups (
  approved_at timestamptz,
  bolsa_publicada boolean not null default false,
  change_window_notes text,
  change_window_opened_at timestamptz,
  change_window_status text not null default 'pendiente',
  created_at timestamptz not null default now(),
  description text,
  id uuid not null default gen_random_uuid() primary key,
  mensaje_socio_borrador text,
  name text not null,
  obra_id uuid not null,
  org_id uuid,
  pliego_publicado_at timestamptz,
  publicado_a_agenda boolean not null default false,
  scheduled_socio_id uuid,
  status text not null default 'pendiente',
  updated_at timestamptz not null default now()
);

create table public.canvas_edges (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  is_critical boolean not null default false,
  lag_days numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  obra_id uuid not null,
  org_id uuid,
  source_node_id uuid not null,
  target_node_id uuid not null,
  type text not null default '',
  updated_at timestamptz not null default now()
);

create table public.canvas_nodes (
  budget_group_id uuid,
  created_at timestamptz not null default now(),
  description text,
  executor_kind text,
  executor_ref text,
  from_node_id uuid,
  graph_status text,
  id uuid not null default gen_random_uuid() primary key,
  is_critical boolean not null default false,
  is_summary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  obra_id uuid not null,
  org_id uuid,
  parent_id uuid,
  planned_duration_days numeric,
  position_x numeric,
  position_y numeric,
  progress numeric,
  project_outline_level integer,
  project_outline_number text,
  project_source text,
  project_uid text,
  sort_order integer,
  status text,
  t_components jsonb,
  t_formula_id uuid,
  t_value numeric,
  title text not null,
  to_node_id uuid,
  transform_kind text,
  type text not null,
  updated_at timestamptz not null default now()
);

create table public.canvas_task_checklist_items (
  created_at timestamptz not null default now(),
  done boolean not null default false,
  id uuid not null default gen_random_uuid() primary key,
  obra_id uuid not null,
  org_id uuid,
  sort_order integer,
  task_node_id uuid not null,
  title text not null,
  updated_at timestamptz not null default now()
);

create table public.canvas_task_templates (
  autor_user_id uuid,
  created_at timestamptz not null default now(),
  descripcion text,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  obra_product_kind text not null,
  org_id uuid,
  slug text not null,
  updated_at timestamptz not null default now(),
  visibilidad text not null default ''
);

create table public.canvas_template_connections (
  id uuid not null default gen_random_uuid() primary key,
  source_task_id uuid not null,
  target_task_id uuid not null,
  template_id uuid not null,
  tipo_conexion text not null default ''
);

create table public.canvas_template_tasks (
  descripcion text,
  duracion_estimada_dias numeric not null default 0,
  id uuid not null default gen_random_uuid() primary key,
  metadata jsonb not null default '{}'::jsonb,
  orden integer not null,
  template_id uuid not null,
  tipo text not null default '',
  titulo text not null
);

create table public.categorias_legajo (
  descripcion text,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  orden integer not null
);

create table public.cliente_socio_agenda (
  alias text,
  created_at timestamptz not null default now(),
  estado text not null default 'activo',
  id uuid not null default gen_random_uuid() primary key,
  metodo text not null,
  notas text,
  org_id uuid not null,
  socio_id uuid not null,
  source_socio_id uuid,
  updated_at timestamptz not null default now()
);

create table public.cliente_wallet_movimientos (
  created_at timestamptz not null default now(),
  descripcion text,
  estado public.cliente_wallet_movimiento_estado not null default 'pendiente',
  id uuid not null default gen_random_uuid() primary key,
  metadata jsonb not null default '{}'::jsonb,
  monto numeric not null,
  mp_payment_id text,
  mp_preference_id uuid,
  org_id uuid not null,
  referencia_id uuid,
  referencia_tipo text,
  tipo public.cliente_wallet_movimiento_tipo not null,
  wallet_id uuid not null
);

create table public.cliente_wallets (
  cliente_user_id uuid,
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  metadata jsonb not null default '{}'::jsonb,
  moneda text not null default 'ARS',
  org_id uuid not null,
  saldo_disponible numeric not null default 0,
  saldo_reservado numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table public.cuadrilla_socios (
  activo boolean,
  cuadrilla_id uuid not null,
  fecha_ingreso timestamptz,
  id uuid not null default gen_random_uuid() primary key,
  rol_en_cuadrilla text,
  socio_id uuid not null
);

create table public.cuadrillas (
  created_at timestamptz default now(),
  email_encargado text,
  encargado text,
  especialidad text not null,
  estado text,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  obra_id uuid,
  org_id uuid not null,
  telefono_encargado text,
  updated_at timestamptz default now(),
  whatsapp_encargado text
);

create table public.documentos_legajo (
  categoria text not null,
  created_at timestamptz default now(),
  descripcion text,
  id uuid not null default gen_random_uuid() primary key,
  nombre_archivo text not null,
  obra_id uuid not null,
  url text not null
);

create table public.elementos (
  cantidad numeric not null default 0,
  categoria text not null,
  costo_unitario numeric,
  created_at timestamptz default now(),
  descripcion text,
  duracion_estimada numeric,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  obra_id uuid not null,
  orden integer,
  plantilla_elemento_id uuid,
  subcategoria text,
  unidad text not null,
  updated_at timestamptz default now()
);

create table public.escrow_transacciones (
  cliente_id uuid,
  created_at timestamptz not null default now(),
  estado public.escrow_estado not null default 'pendiente',
  fecha_deposito timestamptz,
  fecha_liberacion timestamptz,
  fecha_reembolso timestamptz,
  id uuid not null default gen_random_uuid() primary key,
  moneda text not null default 'ARS',
  monto_comision numeric not null,
  monto_socio numeric not null,
  monto_total numeric not null,
  mp_payment_id text,
  mp_preference_id uuid,
  mp_raw_payload jsonb,
  mp_status text,
  org_id uuid not null,
  origen text,
  proveedor text not null default '',
  socio_id uuid not null,
  tarea_id uuid not null,
  updated_at timestamptz not null default now()
);

create table public.eventos (
  actor_method text,
  actor_name text,
  actor_role text,
  checklist jsonb,
  created_at timestamptz default now(),
  descripcion text,
  fecha timestamptz,
  gps_lat numeric,
  gps_lon numeric,
  has_nc boolean,
  id uuid not null default gen_random_uuid() primary key,
  nc_deadline text,
  nc_responsable text,
  notas text,
  nuevo_estado text,
  obra_id uuid,
  org_id uuid not null,
  pdf_path text,
  snapshot_json jsonb,
  tarea_id uuid,
  tipo text
);

create table public.jornadas_socio (
  created_at timestamptz not null default now(),
  fecha timestamptz not null default now(),
  hora_fin text,
  hora_inicio text,
  id uuid not null default gen_random_uuid() primary key,
  obra_id uuid not null,
  socio_id uuid not null,
  updated_at timestamptz not null default now()
);

create table public.leader_invites (
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  email text not null,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null default '',
  org_id uuid not null,
  rol text not null default '',
  status text not null default 'pendiente',
  token text not null default ''
);

create table public.media (
  created_at timestamptz default now(),
  evento_id uuid not null,
  id uuid not null default gen_random_uuid() primary key,
  idx integer not null default 0,
  kind text not null,
  path text not null
);

create table public.mensajes (
  contenido text not null,
  created_at timestamptz default now(),
  destinatario_id uuid,
  destinatario_tipo text,
  id uuid not null default gen_random_uuid() primary key,
  leido boolean,
  obra_id uuid,
  org_id uuid,
  remitente_id uuid,
  remitente_tipo text,
  tipo text
);

create table public.notificaciones (
  created_at timestamptz default now(),
  destinatario_id uuid,
  id uuid not null default gen_random_uuid() primary key,
  leida boolean,
  mensaje text not null,
  obra_id uuid,
  org_id uuid,
  remitente_id uuid,
  socio_id uuid,
  tarea_id uuid,
  tipo text,
  titulo text not null
);

create table public.obra_check_blocks (
  budget_group_client_id uuid,
  client_id uuid not null,
  contact_id uuid,
  created_at timestamptz not null default now(),
  fase text,
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  orden integer not null default 0,
  rubro text,
  session_id uuid not null
);

create table public.obra_check_budget_groups (
  client_id uuid not null,
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  kind text not null default '',
  nombre text not null,
  orden integer not null default 0,
  parent_client_id uuid,
  session_id uuid not null
);

create table public.obra_check_contacts (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  nombre text not null,
  rubro text,
  session_id uuid not null,
  telefono text
);

create table public.obra_check_events (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  payload jsonb not null default '{}'::jsonb,
  session_id uuid,
  tipo text not null
);

create table public.obra_check_form_responses (
  acepta_contacto boolean not null default false,
  created_at timestamptz not null default now(),
  detalle_json jsonb,
  email text,
  empresa text,
  id uuid not null default gen_random_uuid() primary key,
  invite_id uuid not null,
  mensaje text,
  nombre text not null,
  notified_requester_at timestamptz,
  rubro text,
  session_id uuid not null,
  telefono text,
  view_token text
);

create table public.obra_check_invites (
  block_client_id uuid not null,
  contact_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  responded_at timestamptz,
  session_id uuid not null,
  tipo text not null,
  token text not null
);

create table public.obra_check_planos (
  created_at timestamptz not null default now(),
  file_name text not null,
  id uuid not null default gen_random_uuid() primary key,
  mime text not null,
  session_id uuid not null,
  size_bytes numeric not null default 0,
  storage_path text not null
);

create table public.obra_check_sessions (
  completion_email_sent_at timestamptz,
  consent_patrones boolean not null default false,
  consent_procesamiento boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now(),
  email text,
  empresa text,
  id uuid not null default gen_random_uuid() primary key,
  inbox_token text,
  last_activity_at timestamptz not null default now(),
  metros_cuadrados numeric,
  session_token text not null default '',
  tipo_obra text
);

create table public.obra_check_tasks (
  block_client_id uuid,
  cantidad numeric,
  client_id uuid not null,
  contact_id uuid,
  created_at timestamptz not null default now(),
  duracion_dias numeric,
  es_critica boolean,
  fase text,
  fila_origen numeric,
  fin timestamptz,
  id uuid not null default gen_random_uuid() primary key,
  inicio timestamptz,
  nombre text not null,
  orden integer not null default 0,
  origen text not null default '',
  predecesoras text[] not null,
  responsable_label text,
  rubro text,
  session_id uuid not null,
  unidad text
);

create table public.obra_check_wa_messages (
  block_client_id uuid,
  contact_id uuid,
  generado_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  session_id uuid not null,
  texto text not null,
  tipo text not null
);

create table public.obras (
  activation_discount_usd numeric,
  activation_m2 numeric,
  activation_payment_plan text,
  activation_price_per_m2_usd numeric,
  activation_status text,
  activation_total_usd numeric,
  address text,
  canvas_depth_config jsonb,
  canvas_project_kind text,
  canvas_template_slug text,
  canvas_ui jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  estado text,
  graph_mode text not null default 'obra_plan',
  id uuid not null default gen_random_uuid() primary key,
  latitud numeric,
  longitud numeric,
  m2_estimados numeric,
  name text not null,
  objetivo_texto text,
  obra_product_kind text,
  org_id uuid not null,
  plantas integer,
  propietario text,
  superficies jsonb,
  terreno numeric,
  tipo_obra text,
  updated_at timestamptz default now()
);

create table public.organizations (
  address text,
  avatar_url text,
  created_at timestamptz default now(),
  cuit text,
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  plan_actual text not null default 'FREE',
  user_id uuid
);

create table public.presupuesto_solicitudes_cambio (
  created_at timestamptz not null default now(),
  estado text not null default 'pendiente',
  id uuid not null default gen_random_uuid() primary key,
  monto_actual numeric not null,
  monto_propuesto numeric not null,
  motivo text not null,
  presupuesto_id uuid not null,
  respuesta_cliente text,
  socio_id uuid not null,
  updated_at timestamptz not null default now()
);

create table public.qr_tokens (
  created_at timestamptz not null default now(),
  enabled boolean not null default false,
  id uuid not null default gen_random_uuid() primary key,
  ref_id uuid not null,
  scope text not null,
  token text not null,
  updated_at timestamptz not null default now()
);

create table public.socio_metodos_retiro (
  activo boolean not null default false,
  alias text,
  banco text,
  cbu text,
  created_at timestamptz not null default now(),
  cvu text,
  es_principal boolean not null default false,
  id uuid not null default gen_random_uuid() primary key,
  mercado_pago_alias text,
  mercado_pago_cvu text,
  socio_id uuid not null,
  tipo text not null default '',
  titular text not null,
  updated_at timestamptz not null default now()
);

create table public.socio_retiros (
  created_at timestamptz not null default now(),
  estado text not null default 'pendiente',
  id uuid not null default gen_random_uuid() primary key,
  metadata jsonb,
  metodo_retiro_id uuid,
  monto numeric not null,
  processed_at timestamptz,
  socio_id uuid not null,
  tipo text not null,
  wallet_movimiento_id uuid
);

create table public.socio_suspensiones (
  fin timestamptz,
  id uuid not null default gen_random_uuid() primary key,
  inicio timestamptz not null default now(),
  motivo text not null default '',
  saldo_al_momento numeric not null,
  socio_id uuid not null,
  wallet_saldo_id uuid not null
);

create table public.socios (
  created_at timestamptz default now(),
  email text,
  especialidad text,
  estado text,
  id uuid not null default gen_random_uuid() primary key,
  nombre text,
  org_id uuid,
  public_codigo text,
  telefono text,
  user_id uuid
);

create table public.tarea_precedencias (
  created_at timestamptz default now(),
  depende_de uuid,
  id uuid not null default gen_random_uuid() primary key,
  lag_dias numeric,
  pos_x numeric,
  pos_y numeric,
  tarea_id uuid,
  tipo_dependencia text
);

create table public.tareas (
  avance numeric,
  bloques_planificados integer not null,
  canvas_node_id uuid,
  costo_presupuestado numeric,
  created_at timestamptz default now(),
  cuadrilla_id uuid,
  descripcion text,
  dias_presupuesto integer not null,
  ef numeric,
  elemento_id uuid,
  es numeric,
  estado public.tarea_estado_oficial not null default 'pendiente',
  etapa text,
  fecha_fin timestamptz,
  fecha_fin_estimada timestamptz,
  fecha_fin_real timestamptz,
  fecha_inicio timestamptz,
  fecha_inicio_estimada timestamptz,
  fecha_inicio_real timestamptz,
  fecha_validacion timestamptz,
  float numeric,
  id uuid not null default gen_random_uuid() primary key,
  is_critical boolean,
  lf numeric,
  ls numeric,
  obra_id uuid not null,
  org_id uuid not null,
  prioridad text,
  published_from_canvas_at timestamptz,
  responsable text,
  responsable_socio_id uuid,
  source text,
  title text not null,
  updated_at timestamptz default now(),
  validado_por uuid
);

create table public.tareas_estados (
  actor_id uuid,
  actor_tipo text,
  created_at timestamptz not null default now(),
  estado_anterior text,
  estado_nuevo text,
  id uuid not null default gen_random_uuid() primary key,
  motivo text,
  tarea_id uuid not null
);

create table public.tareas_eventos (
  actor_id uuid,
  actor_tipo text,
  created_at timestamptz not null default now(),
  estado_anterior text,
  estado_nuevo text,
  id uuid not null default gen_random_uuid() primary key,
  metadata jsonb,
  tarea_id uuid not null
);

create table public.tareas_presupuestos (
  cantidad numeric,
  created_at timestamptz default now(),
  dias_reales integer,
  estado text,
  id uuid not null default gen_random_uuid() primary key,
  moneda text,
  monto numeric not null,
  notas text,
  socio_id uuid,
  tarea_id uuid,
  unidad text,
  updated_at timestamptz default now()
);

create table public.tareas_subtareas (
  bloque_index numeric not null,
  cantidad numeric not null,
  created_at timestamptz not null default now(),
  estado public.tarea_subtarea_estado_oficial not null default 'pendiente',
  evidencia_cargada boolean not null default false,
  evidencia_obligatoria boolean not null default false,
  evidencia_url text,
  fecha timestamptz,
  fecha_validacion timestamptz,
  hora_fin text,
  hora_inicio text,
  id uuid not null default gen_random_uuid() primary key,
  monto_estimado numeric,
  monto_validado numeric,
  orden integer not null,
  presupuesto_id uuid,
  problemas text,
  socio_id uuid,
  tarea_id uuid not null,
  unidad text not null,
  updated_at timestamptz not null default now(),
  validado_en_obra_at timestamptz,
  validado_en_obra_por text,
  validado_por uuid,
  video_url text
);

create table public.wallet_movimientos (
  concepto text not null,
  created_at timestamptz not null default now(),
  escrow_id uuid,
  estado text not null default 'pendiente',
  id uuid not null default gen_random_uuid() primary key,
  monto numeric not null,
  origen text not null default '',
  owner_id uuid not null,
  owner_tipo text not null,
  presupuesto_id uuid,
  tarea_id uuid,
  tipo text not null
);

create table public.wallet_saldos (
  id uuid not null default gen_random_uuid() primary key,
  limite_sobregiro numeric not null default 0,
  moneda text not null default 'ARS',
  owner_id uuid not null,
  owner_tipo text not null,
  proxima_liquidacion_at timestamptz,
  saldo_actual numeric not null default 0,
  saldo_pendiente numeric not null default 0,
  suspendido boolean not null default false,
  suspendido_desde text,
  ultima_liquidacion_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Claves foráneas (tomadas de Relationships en los tipos generados)
alter table public.canvas_budget_group_tasks add constraint canvas_budget_group_tasks_budget_group_id_fkey foreign key (budget_group_id) references public.canvas_budget_groups(id);
alter table public.canvas_budget_group_tasks add constraint canvas_budget_group_tasks_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.canvas_budget_group_tasks add constraint canvas_budget_group_tasks_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_budget_group_tasks add constraint canvas_budget_group_tasks_task_node_id_fkey foreign key (task_node_id) references public.canvas_nodes(id);
alter table public.canvas_budget_groups add constraint canvas_budget_groups_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.canvas_budget_groups add constraint canvas_budget_groups_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_budget_groups add constraint canvas_budget_groups_scheduled_socio_id_fkey foreign key (scheduled_socio_id) references public.socios(id);
alter table public.canvas_edges add constraint canvas_edges_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.canvas_edges add constraint canvas_edges_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_edges add constraint canvas_edges_source_node_id_fkey foreign key (source_node_id) references public.canvas_nodes(id);
alter table public.canvas_edges add constraint canvas_edges_target_node_id_fkey foreign key (target_node_id) references public.canvas_nodes(id);
alter table public.canvas_nodes add constraint canvas_nodes_budget_group_id_fkey foreign key (budget_group_id) references public.canvas_budget_groups(id);
alter table public.canvas_nodes add constraint canvas_nodes_from_node_id_fkey foreign key (from_node_id) references public.canvas_nodes(id);
alter table public.canvas_nodes add constraint canvas_nodes_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.canvas_nodes add constraint canvas_nodes_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_nodes add constraint canvas_nodes_parent_id_fkey foreign key (parent_id) references public.canvas_nodes(id);
alter table public.canvas_nodes add constraint canvas_nodes_to_node_id_fkey foreign key (to_node_id) references public.canvas_nodes(id);
alter table public.canvas_task_checklist_items add constraint canvas_task_checklist_items_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.canvas_task_checklist_items add constraint canvas_task_checklist_items_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_task_checklist_items add constraint canvas_task_checklist_items_task_node_id_fkey foreign key (task_node_id) references public.canvas_nodes(id);
alter table public.canvas_task_templates add constraint canvas_task_templates_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.canvas_template_connections add constraint canvas_template_connections_source_task_id_fkey foreign key (source_task_id) references public.canvas_template_tasks(id);
alter table public.canvas_template_connections add constraint canvas_template_connections_target_task_id_fkey foreign key (target_task_id) references public.canvas_template_tasks(id);
alter table public.canvas_template_connections add constraint canvas_template_connections_template_id_fkey foreign key (template_id) references public.canvas_task_templates(id);
alter table public.canvas_template_tasks add constraint canvas_template_tasks_template_id_fkey foreign key (template_id) references public.canvas_task_templates(id);
alter table public.cliente_socio_agenda add constraint cliente_socio_agenda_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.cliente_socio_agenda add constraint cliente_socio_agenda_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.cliente_socio_agenda add constraint cliente_socio_agenda_source_socio_id_fkey foreign key (source_socio_id) references public.socios(id);
alter table public.cliente_wallet_movimientos add constraint cliente_wallet_movimientos_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.cliente_wallet_movimientos add constraint cliente_wallet_movimientos_wallet_id_fkey foreign key (wallet_id) references public.cliente_wallets(id);
alter table public.cliente_wallets add constraint cliente_wallets_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.cuadrilla_socios add constraint cuadrilla_socios_cuadrilla_id_fkey foreign key (cuadrilla_id) references public.cuadrillas(id);
alter table public.cuadrilla_socios add constraint cuadrilla_socios_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.cuadrilla_socios add constraint fk_cuadrilla_socios_cuadrilla foreign key (cuadrilla_id) references public.cuadrillas(id);
alter table public.cuadrilla_socios add constraint fk_cuadrilla_socios_socio foreign key (socio_id) references public.socios(id);
alter table public.cuadrillas add constraint cuadrillas_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.cuadrillas add constraint cuadrillas_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.elementos add constraint elementos_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.escrow_transacciones add constraint escrow_org_fk foreign key (org_id) references public.organizations(id);
alter table public.escrow_transacciones add constraint escrow_socio_fk foreign key (socio_id) references public.socios(id);
alter table public.escrow_transacciones add constraint escrow_tarea_fk foreign key (tarea_id) references public.tareas(id);
alter table public.eventos add constraint eventos_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.eventos add constraint eventos_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.eventos add constraint eventos_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.jornadas_socio add constraint jornadas_socio_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.jornadas_socio add constraint jornadas_socio_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.leader_invites add constraint leader_invites_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.media add constraint media_evento_id_fkey foreign key (evento_id) references public.eventos(id);
alter table public.mensajes add constraint mensajes_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.notificaciones add constraint notificaciones_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.notificaciones add constraint notificaciones_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.notificaciones add constraint notificaciones_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.notificaciones add constraint notificaciones_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.obra_check_blocks add constraint obra_check_blocks_contact_id_fkey foreign key (contact_id) references public.obra_check_contacts(id);
alter table public.obra_check_blocks add constraint obra_check_blocks_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_budget_groups add constraint obra_check_budget_groups_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_contacts add constraint obra_check_contacts_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_events add constraint obra_check_events_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_form_responses add constraint obra_check_form_responses_invite_id_fkey foreign key (invite_id) references public.obra_check_invites(id);
alter table public.obra_check_form_responses add constraint obra_check_form_responses_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_invites add constraint obra_check_invites_contact_id_fkey foreign key (contact_id) references public.obra_check_contacts(id);
alter table public.obra_check_invites add constraint obra_check_invites_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_planos add constraint obra_check_planos_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_tasks add constraint obra_check_tasks_contact_id_fkey foreign key (contact_id) references public.obra_check_contacts(id);
alter table public.obra_check_tasks add constraint obra_check_tasks_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obra_check_wa_messages add constraint obra_check_wa_messages_contact_id_fkey foreign key (contact_id) references public.obra_check_contacts(id);
alter table public.obra_check_wa_messages add constraint obra_check_wa_messages_session_id_fkey foreign key (session_id) references public.obra_check_sessions(id);
alter table public.obras add constraint obras_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.presupuesto_solicitudes_cambio add constraint presupuesto_solicitudes_cambio_presupuesto_id_fkey foreign key (presupuesto_id) references public.tareas_presupuestos(id);
alter table public.presupuesto_solicitudes_cambio add constraint presupuesto_solicitudes_cambio_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.socio_metodos_retiro add constraint socio_metodos_retiro_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.socio_retiros add constraint socio_retiros_metodo_retiro_id_fkey foreign key (metodo_retiro_id) references public.socio_metodos_retiro(id);
alter table public.socio_retiros add constraint socio_retiros_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.socio_retiros add constraint socio_retiros_wallet_movimiento_id_fkey foreign key (wallet_movimiento_id) references public.wallet_movimientos(id);
alter table public.socio_suspensiones add constraint socio_suspensiones_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.socio_suspensiones add constraint socio_suspensiones_wallet_saldo_id_fkey foreign key (wallet_saldo_id) references public.wallet_saldos(id);
alter table public.socios add constraint socios_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.tarea_precedencias add constraint tarea_precedencias_depende_de_fkey foreign key (depende_de) references public.tareas(id);
alter table public.tarea_precedencias add constraint tarea_precedencias_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.tareas add constraint tareas_canvas_node_id_fkey foreign key (canvas_node_id) references public.canvas_nodes(id);
alter table public.tareas add constraint tareas_elemento_id_fkey foreign key (elemento_id) references public.elementos(id);
alter table public.tareas add constraint tareas_obra_id_fkey foreign key (obra_id) references public.obras(id);
alter table public.tareas add constraint tareas_org_id_fkey foreign key (org_id) references public.organizations(id);
alter table public.tareas add constraint tareas_responsable_socio_id_fkey foreign key (responsable_socio_id) references public.socios(id);
alter table public.tareas_estados add constraint tareas_estados_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.tareas_eventos add constraint tareas_eventos_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.tareas_presupuestos add constraint tareas_presupuestos_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.tareas_subtareas add constraint tareas_subtareas_presupuesto_id_fkey foreign key (presupuesto_id) references public.tareas_presupuestos(id);
alter table public.tareas_subtareas add constraint tareas_subtareas_socio_id_fkey foreign key (socio_id) references public.socios(id);
alter table public.tareas_subtareas add constraint tareas_subtareas_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);
alter table public.wallet_movimientos add constraint wallet_movimientos_escrow_fk foreign key (escrow_id) references public.escrow_transacciones(id);
alter table public.wallet_movimientos add constraint wallet_movimientos_presupuesto_id_fkey foreign key (presupuesto_id) references public.tareas_presupuestos(id);
alter table public.wallet_movimientos add constraint wallet_movimientos_tarea_id_fkey foreign key (tarea_id) references public.tareas(id);

create view public.organizaciones with (security_invoker = true) as
  select id, name as nombre, name, cuit, address, created_at, avatar_url, plan_actual, user_id, user_id as owner_user_id from public.organizations;
