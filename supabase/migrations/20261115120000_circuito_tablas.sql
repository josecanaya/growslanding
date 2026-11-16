-- Circuito de obra de punta a punta: pliego → plan → cotización → contrato → avance →
-- certificación → pago, y financiación con MCU (rondas, suscripciones, posiciones, transferencias,
-- distribuciones). Todas las tablas son server-only: RLS activo y sin políticas; se escribe
-- exclusivamente por las funciones circ_* (migración siguiente), que validan permisos por actor.
-- Los importes son dinero FICTICIO de ensayo (USD nominales, 2 decimales).

-- ───────────────────────── Obra: estado del circuito, participantes, unidades
create table public.obra_circuito (
  obra_id uuid primary key references public.obras(id) on delete cascade,
  fecha_inicio_plan date,
  estado text not null default 'normal' check (estado in ('normal','reprogramada','en_cierre','cerrada')),
  reprogramada_hasta date,
  motivo_estado text,
  mcu_simbolo text,
  reserva_objetivo numeric(14,2) not null default 0 check (reserva_objetivo >= 0),
  updated_at timestamptz not null default now()
);
create table public.obra_participantes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null,
  rol text not null check (rol in ('coordinador','auditor')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (obra_id, user_id, rol)
);
create table public.obra_unidades (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  codigo text not null,
  descripcion text not null default '',
  m2 numeric(10,2) not null check (m2 > 0),
  created_at timestamptz not null default now(),
  unique (obra_id, codigo)
);

-- ───────────────────────── Pliego con revisiones
create table public.pliegos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  org_id uuid not null,
  titulo text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (obra_id, titulo)
);
create table public.pliego_revisiones (
  id uuid primary key default gen_random_uuid(),
  pliego_id uuid not null references public.pliegos(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  numero integer not null check (numero >= 1),
  etapa text not null default 'ingenieria_general' check (etapa in ('ingenieria_general','ingenieria_detalle','publicable')),
  estado text not null default 'borrador' check (estado in ('borrador','publicada','reemplazada')),
  motivo text not null default '',
  huella text,
  publicada_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (pliego_id, numero)
);
create unique index pliego_revisiones_un_borrador on public.pliego_revisiones (pliego_id) where estado = 'borrador';
create unique index pliego_revisiones_una_publicada on public.pliego_revisiones (pliego_id) where estado = 'publicada';
create table public.pliego_partidas (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.pliego_revisiones(id) on delete cascade,
  pliego_id uuid not null references public.pliegos(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  codigo text not null,
  paquete text not null default 'general',
  titulo text not null,
  alcance text not null default '',
  cantidad numeric(14,3),
  unidad text not null default '',
  fuente text not null default '',
  fuente_revision text not null default '',
  evidencia_requerida text not null default '',
  criterio_aceptacion text not null default '',
  responsable text not null default '',
  -- Estructura/paquete común del edificio: existe una sola vez, nunca por unidad.
  es_comun boolean not null default false,
  unidad_id uuid references public.obra_unidades(id),
  precio_referencia numeric(14,2),
  orden integer not null default 0,
  unique (revision_id, codigo),
  check (not (es_comun and unidad_id is not null))
);

-- ───────────────────────── Planificación (las tareas viven en public.tareas)
create table public.partida_tareas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  pliego_id uuid not null references public.pliegos(id) on delete cascade,
  partida_codigo text not null,
  tarea_id uuid not null unique references public.tareas(id) on delete cascade,
  clave text not null,
  frente text not null default 'general',
  cantidad numeric(14,3) not null check (cantidad > 0),
  unique (obra_id, clave)
);
create table public.plan_restricciones (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  clave text not null,
  tipo text not null check (tipo in ('recurso','compra','inspeccion')),
  descripcion text not null default '',
  recurso_clave text,
  fecha_disponible date,
  estado text not null default 'pendiente' check (estado in ('pendiente','cumplida')),
  updated_at timestamptz not null default now(),
  unique (obra_id, clave),
  check ((tipo = 'recurso' and recurso_clave is not null) or (tipo <> 'recurso' and fecha_disponible is not null))
);
create table public.plan_lineas_base (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  version integer not null,
  motivo text not null default '',
  fijada_por uuid not null,
  created_at timestamptz not null default now(),
  unique (obra_id, version)
);
create table public.plan_linea_base_tareas (
  linea_base_id uuid not null references public.plan_lineas_base(id) on delete cascade,
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  inicio date not null,
  fin date not null,
  duracion integer not null,
  costo numeric(14,2) not null default 0,
  primary key (linea_base_id, tarea_id)
);

-- ───────────────────────── Cotización y contrato
create table public.solicitudes_cotizacion (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  pliego_id uuid not null references public.pliegos(id),
  revision_id uuid not null references public.pliego_revisiones(id),
  paquete text not null,
  titulo text not null,
  fecha_limite date,
  estado text not null default 'abierta' check (estado in ('abierta','adjudicada','cancelada','desactualizada')),
  created_by uuid not null,
  created_at timestamptz not null default now()
);
-- Un paquete de una revisión se licita una sola vez mientras la solicitud esté viva.
create unique index solicitudes_un_paquete_vivo on public.solicitudes_cotizacion (revision_id, paquete) where estado in ('abierta','adjudicada');
create table public.solicitud_invitados (
  solicitud_id uuid not null references public.solicitudes_cotizacion(id) on delete cascade,
  socio_id uuid not null references public.socios(id),
  estado text not null default 'invitado' check (estado in ('invitado','cotizo','declino')),
  primary key (solicitud_id, socio_id)
);
create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes_cotizacion(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  -- Revisión del alcance que el contratista recibió y cotizó.
  revision_id uuid not null references public.pliego_revisiones(id),
  socio_id uuid not null references public.socios(id),
  monto_total numeric(14,2) not null check (monto_total > 0),
  plazo_dias integer not null check (plazo_dias > 0),
  condiciones text not null default '',
  estado text not null default 'enviada' check (estado in ('enviada','adjudicada','no_adjudicada','desactualizada')),
  created_at timestamptz not null default now(),
  unique (solicitud_id, socio_id)
);
create table public.oferta_items (
  oferta_id uuid not null references public.ofertas(id) on delete cascade,
  partida_id uuid not null references public.pliego_partidas(id),
  cantidad numeric(14,3) not null,
  precio_unitario numeric(14,2) not null check (precio_unitario > 0),
  subtotal numeric(14,2) not null,
  primary key (oferta_id, partida_id)
);
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  solicitud_id uuid not null unique references public.solicitudes_cotizacion(id),
  oferta_id uuid not null unique references public.ofertas(id),
  socio_id uuid not null references public.socios(id),
  pliego_id uuid not null references public.pliegos(id),
  revision_id uuid not null references public.pliego_revisiones(id),
  monto_total numeric(14,2) not null,
  retencion_pct numeric(5,2) not null default 5 check (retencion_pct >= 0 and retencion_pct <= 20),
  estado text not null default 'vigente' check (estado in ('vigente','cerrado','rescindido')),
  adjudicado_por uuid not null,
  created_at timestamptz not null default now()
);
create table public.contrato_items (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  pliego_id uuid not null references public.pliegos(id),
  partida_codigo text not null,
  partida_id uuid not null references public.pliego_partidas(id),
  cantidad numeric(14,3) not null,
  precio_unitario numeric(14,2) not null,
  subtotal numeric(14,2) not null,
  -- Una partida (incluida la estructura común) se contrata una sola vez por pliego.
  unique (pliego_id, partida_codigo)
);
create table public.contrato_adendas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  revision_id uuid not null references public.pliego_revisiones(id),
  motivo text not null,
  items jsonb not null,
  monto_anterior numeric(14,2) not null,
  monto_nuevo numeric(14,2) not null,
  estado text not null default 'propuesta' check (estado in ('propuesta','aceptada','rechazada')),
  propuesta_por uuid not null,
  respondida_por uuid,
  created_at timestamptz not null default now(),
  respondida_at timestamptz
);
create unique index contrato_adendas_una_abierta on public.contrato_adendas (contrato_id) where estado = 'propuesta';

-- ───────────────────────── Avances, evidencia, certificación y pagos
create table public.avances (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  contrato_id uuid not null references public.contratos(id),
  socio_id uuid not null references public.socios(id),
  fecha date not null,
  porcentaje numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  nota text not null default '',
  version integer not null default 1,
  estado text not null default 'informado' check (estado in ('informado','observado','aceptado')),
  observacion text,
  revisado_por uuid,
  revisado_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table public.evidencias_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  entidad text not null check (entidad in ('avance','certificado')),
  entidad_id uuid not null,
  version integer not null default 1,
  storage_path text not null,
  nombre text not null,
  sha256 text not null,
  bytes integer not null check (bytes > 0),
  subido_por uuid not null,
  created_at timestamptz not null default now(),
  -- El mismo archivo no se adjunta dos veces a la misma versión de la misma entidad.
  unique (entidad, entidad_id, version, sha256)
);
create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  contrato_id uuid not null references public.contratos(id),
  numero integer not null,
  fecha date not null,
  estado text not null default 'presentado' check (estado in ('presentado','rechazado','aprobado')),
  version integer not null default 1,
  monto_bruto numeric(14,2) not null,
  retencion numeric(14,2) not null,
  monto_neto numeric(14,2) not null,
  nota text not null default '',
  motivo_rechazo text,
  presentado_por uuid not null,
  revisado_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, numero)
);
create unique index certificados_uno_abierto on public.certificados (contrato_id) where estado in ('presentado','rechazado');
create table public.certificado_items (
  certificado_id uuid not null references public.certificados(id) on delete cascade,
  contrato_item_id uuid not null references public.contrato_items(id),
  porcentaje_acumulado numeric(5,2) not null check (porcentaje_acumulado > 0 and porcentaje_acumulado <= 100),
  porcentaje_anterior numeric(5,2) not null default 0,
  monto numeric(14,2) not null check (monto >= 0),
  primary key (certificado_id, contrato_item_id)
);
create table public.certificado_historial (
  id uuid primary key default gen_random_uuid(),
  certificado_id uuid not null references public.certificados(id) on delete cascade,
  version integer not null,
  accion text not null check (accion in ('presentado','rechazado','corregido','aprobado','pagado')),
  actor uuid not null,
  nota text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.pagos_obra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  -- Un certificado genera, como máximo, un pago.
  certificado_id uuid not null unique references public.certificados(id),
  contrato_id uuid not null references public.contratos(id),
  socio_id uuid not null references public.socios(id),
  monto numeric(14,2) not null check (monto > 0),
  fecha date not null default current_date,
  pagado_por uuid not null,
  created_at timestamptz not null default now()
);
create table public.obra_costos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null check (tipo in ('terreno','honorarios','otros')),
  descripcion text not null,
  monto numeric(14,2) not null check (monto > 0),
  fecha_prevista date not null,
  estado text not null default 'previsto' check (estado in ('previsto','pagado')),
  pagado_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (obra_id, tipo, descripcion)
);
-- Libro de caja de la obra. Solo entra dinero efectivamente integrado; lo prometido no figura.
create table public.caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null check (tipo in ('aporte_ronda','pago_certificado','pago_costo','distribucion')),
  monto numeric(14,2) not null check (monto <> 0),
  ref_id uuid not null,
  descripcion text not null default '',
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  unique (tipo, ref_id)
);

-- ───────────────────────── Inversión ficticia con MCU
create table public.inversor_cuenta_movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tipo text not null check (tipo in ('deposito_ficticio','integracion','devolucion','compra_mcu','venta_mcu','distribucion')),
  monto numeric(14,2) not null check (monto <> 0),
  obra_id uuid references public.obras(id) on delete cascade,
  ref_id uuid not null,
  descripcion text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, tipo, ref_id)
);
create table public.mcu_rondas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  numero integer not null,
  estado text not null default 'programada' check (estado in ('programada','abierta','cerrada_exitosa','fallida','cancelada')),
  -- Tres magnitudes separadas: valuación previa, precio ofrecido por MCU y cantidad ofrecida.
  valuacion_pre numeric(14,2) not null check (valuacion_pre >= 0),
  precio_mcu numeric(14,2) not null check (precio_mcu > 0),
  mcu_ofrecidas integer not null check (mcu_ofrecidas > 0),
  minimo_mcu integer not null default 1 check (minimo_mcu >= 1),
  umbral_mcu integer not null check (umbral_mcu >= 1),
  fecha_apertura date not null,
  fecha_cierre date not null,
  destino_fondos jsonb not null default '[]'::jsonb,
  que_se_compra text not null default '',
  condiciones_salida text not null default '',
  necesidad_fondos jsonb not null default '{}'::jsonb,
  mcu_previas integer not null default 0,
  cerrada_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (obra_id, numero),
  check (umbral_mcu <= mcu_ofrecidas and fecha_cierre >= fecha_apertura)
);
create unique index mcu_rondas_una_abierta on public.mcu_rondas (obra_id) where estado = 'abierta';
create table public.mcu_suscripciones (
  id uuid primary key default gen_random_uuid(),
  ronda_id uuid not null references public.mcu_rondas(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null,
  mcu integer not null check (mcu > 0),
  monto numeric(14,2) not null check (monto > 0),
  -- prometida: compromiso sin dinero. integrada: dinero en custodia de la ronda (todavía no es caja de obra).
  estado text not null default 'prometida' check (estado in ('prometida','integrada','asignada','devuelta','cancelada')),
  created_at timestamptz not null default now(),
  integrada_at timestamptz,
  resuelta_at timestamptz
);
create table public.mcu_posiciones (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null,
  cantidad integer not null default 0 check (cantidad >= 0),
  costo_total numeric(14,2) not null default 0,
  -- Vínculo opcional a una unidad: una unidad admite una sola posición vinculada.
  unidad_id uuid unique references public.obra_unidades(id),
  updated_at timestamptz not null default now(),
  unique (obra_id, user_id)
);
create table public.mcu_movimientos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null,
  tipo text not null check (tipo in ('emision','transferencia_entrada','transferencia_salida')),
  cantidad integer not null check (cantidad <> 0),
  precio_mcu numeric(14,2) not null,
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, tipo, ref_id)
);
create table public.mcu_ordenes_venta (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  vendedor uuid not null,
  cantidad integer not null check (cantidad > 0),
  precio_mcu numeric(14,2) not null check (precio_mcu > 0),
  estado text not null default 'abierta' check (estado in ('abierta','ejecutada','cancelada')),
  comprador uuid,
  created_at timestamptz not null default now(),
  resuelta_at timestamptz
);
create table public.mcu_distribuciones (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  concepto text not null check (concepto in ('resultado','liquidacion')),
  monto_total numeric(14,2) not null check (monto_total > 0),
  mcu_base integer not null,
  nota text not null default '',
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table public.mcu_distribucion_pagos (
  distribucion_id uuid not null references public.mcu_distribuciones(id) on delete cascade,
  user_id uuid not null,
  mcu integer not null,
  monto numeric(14,2) not null,
  primary key (distribucion_id, user_id)
);

-- ───────────────────────── Historial e idempotencia
create table public.circuito_eventos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references public.obras(id) on delete cascade,
  actor uuid,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index circuito_eventos_obra_idx on public.circuito_eventos (obra_id, created_at);
create table public.circuito_idempotencia (
  actor uuid not null,
  accion text not null,
  clave text not null,
  obra_id uuid,
  resultado jsonb,
  created_at timestamptz not null default now(),
  primary key (actor, accion, clave)
);

do $$
declare t text;
begin
  foreach t in array array['obra_circuito','obra_participantes','obra_unidades','pliegos','pliego_revisiones','pliego_partidas',
    'partida_tareas','plan_restricciones','plan_lineas_base','plan_linea_base_tareas','solicitudes_cotizacion','solicitud_invitados',
    'ofertas','oferta_items','contratos','contrato_items','contrato_adendas','avances','evidencias_obra','certificados',
    'certificado_items','certificado_historial','pagos_obra','obra_costos','caja_movimientos','inversor_cuenta_movimientos',
    'mcu_rondas','mcu_suscripciones','mcu_posiciones','mcu_movimientos','mcu_ordenes_venta','mcu_distribuciones',
    'mcu_distribucion_pagos','circuito_eventos','circuito_idempotencia'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
