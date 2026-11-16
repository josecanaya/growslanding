-- Funciones del circuito (parte 1): permisos, idempotencia, pliego, plan, cotización, contrato,
-- avances, certificación y pagos. Cada función recibe el usuario autenticado (p_actor) que la API
-- obtuvo de la sesión y vuelve a validar el permiso dentro de la misma transacción.
-- Códigos: 42501 = sin permiso (403) · GR404 = no existe · GR409 = conflicto de estado · GR422 = datos inválidos.

create or replace function public.circ_fail(p_code text, p_msg text) returns void
language plpgsql as $$ begin raise exception using errcode = p_code, message = p_msg; end $$;

-- Idempotencia transaccional: la clave se reserva en la misma transacción que la escritura.
-- Si la transacción se interrumpe, no queda ni la clave ni el registro; el reintento escribe una sola vez.
-- Dos pedidos simultáneos con la misma clave: el segundo espera y recibe el resultado del primero.
create or replace function public.circ_idem_begin(p_actor uuid, p_accion text, p_clave text, p_obra uuid default null)
returns jsonb language plpgsql set search_path = public as $$
declare v jsonb; v_rows int;
begin
  if p_clave is null or p_clave = '' then return null; end if;
  insert into circuito_idempotencia(actor, accion, clave, obra_id) values (p_actor, p_accion, p_clave, p_obra)
    on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 1 then return null; end if;
  select resultado into v from circuito_idempotencia where actor = p_actor and accion = p_accion and clave = p_clave;
  if v is null then perform circ_fail('GR409', 'Operación en curso con la misma clave'); end if;
  return v || jsonb_build_object('repetida', true);
end $$;
create or replace function public.circ_idem_end(p_actor uuid, p_accion text, p_clave text, p_res jsonb)
returns jsonb language plpgsql set search_path = public as $$
begin
  if p_clave is not null and p_clave <> '' then
    update circuito_idempotencia set resultado = p_res where actor = p_actor and accion = p_accion and clave = p_clave;
  end if;
  return p_res || jsonb_build_object('repetida', false);
end $$;
create or replace function public.circ_evento(p_obra uuid, p_actor uuid, p_accion text, p_entidad text, p_id uuid, p_detalle jsonb default '{}'::jsonb)
returns void language sql set search_path = public as $$
  insert into circuito_eventos(obra_id, actor, accion, entidad, entidad_id, detalle) values (p_obra, p_actor, p_accion, p_entidad, p_id, coalesce(p_detalle, '{}'::jsonb));
$$;

-- Responsable: dueño de la organización de la obra o líder con invitación aceptada (regla existente del producto).
create or replace function public.circ_es_responsable(p_obra uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from obras o join organizations g on g.id = o.org_id where o.id = p_obra and g.user_id = p_user)
      or exists (select 1 from obras o join leader_invites l on l.org_id = o.org_id
                 join auth.users u on lower(u.email) = lower(l.email)
                 where o.id = p_obra and u.id = p_user and l.status = 'accepted');
$$;
-- El coordinador de obra puede planificar, pero no adjudicar, aprobar ni pagar.
create or replace function public.circ_puede_planificar(p_obra uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select circ_es_responsable(p_obra, p_user)
      or exists (select 1 from obra_participantes where obra_id = p_obra and user_id = p_user and rol = 'coordinador');
$$;
create or replace function public.circ_req_responsable(p_obra uuid, p_user uuid) returns void
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from obras where id = p_obra) then perform circ_fail('GR404', 'Obra no encontrada'); end if;
  if not circ_es_responsable(p_obra, p_user) then perform circ_fail('42501', 'Solo el responsable de la obra puede realizar esta acción'); end if;
end $$;
create or replace function public.circ_req_planificador(p_obra uuid, p_user uuid) returns void
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from obras where id = p_obra) then perform circ_fail('GR404', 'Obra no encontrada'); end if;
  if not circ_puede_planificar(p_obra, p_user) then perform circ_fail('42501', 'Solo el responsable o el coordinador pueden planificar esta obra'); end if;
end $$;
create or replace function public.circ_caja(p_obra uuid) returns numeric
language sql stable set search_path = public as $$
  select coalesce(sum(monto), 0) from caja_movimientos where obra_id = p_obra;
$$;
create or replace function public.circ_saldo_inversor(p_user uuid) returns numeric
language sql stable set search_path = public as $$
  select coalesce(sum(monto), 0) from inversor_cuenta_movimientos where user_id = p_user;
$$;
-- Serializa las operaciones de caja de una obra.
create or replace function public.circ_lock_obra(p_obra uuid) returns public.obra_circuito
language plpgsql set search_path = public as $$
declare v obra_circuito;
begin
  insert into obra_circuito(obra_id) values (p_obra) on conflict do nothing;
  select * into v from obra_circuito where obra_id = p_obra for update;
  return v;
end $$;

-- ═════════════════════════ PLIEGO
create or replace function public.circ_pliego_crear(p_actor uuid, p_obra uuid, p_titulo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; v_pliego uuid; v_rev uuid; v_org uuid;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'pliego_crear', p_idem, p_obra); if v is not null then return v; end if;
  if coalesce(trim(p_titulo), '') = '' then perform circ_fail('GR422', 'El pliego necesita un título'); end if;
  if exists (select 1 from pliegos where obra_id = p_obra and titulo = trim(p_titulo)) then
    perform circ_fail('GR409', 'Ya existe un pliego con ese título en la obra');
  end if;
  select org_id into v_org from obras where id = p_obra;
  insert into obra_circuito(obra_id) values (p_obra) on conflict do nothing;
  insert into pliegos(obra_id, org_id, titulo, created_by) values (p_obra, v_org, trim(p_titulo), p_actor) returning id into v_pliego;
  insert into pliego_revisiones(pliego_id, obra_id, numero, created_by, motivo) values (v_pliego, p_obra, 1, p_actor, 'Emisión inicial') returning id into v_rev;
  perform circ_evento(p_obra, p_actor, 'pliego_creado', 'pliego', v_pliego, jsonb_build_object('revision_id', v_rev));
  return circ_idem_end(p_actor, 'pliego_crear', p_idem, jsonb_build_object('pliego_id', v_pliego, 'revision_id', v_rev, 'numero', 1));
end $$;

create or replace function public.circ_pliego_guardar_partidas(p_actor uuid, p_revision uuid, p_partidas jsonb, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r pliego_revisiones; x jsonb; v_unidad uuid; v_n int := 0;
begin
  select * into r from pliego_revisiones where id = p_revision;
  if not found then perform circ_fail('GR404', 'Revisión no encontrada'); end if;
  perform circ_req_responsable(r.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'pliego_guardar_partidas', p_idem, r.obra_id); if v is not null then return v; end if;
  if r.estado <> 'borrador' then perform circ_fail('GR409', 'La revisión ya fue publicada; creá una revisión nueva para cambiar el alcance'); end if;
  if jsonb_typeof(p_partidas) is distinct from 'array' then perform circ_fail('GR422', 'partidas debe ser una lista'); end if;
  for x in select * from jsonb_array_elements(p_partidas) loop
    if coalesce(x->>'codigo', '') = '' then perform circ_fail('GR422', 'Cada partida necesita un código'); end if;
    if (x->>'eliminar')::boolean is true then
      delete from pliego_partidas where revision_id = p_revision and codigo = x->>'codigo';
      continue;
    end if;
    v_unidad := null;
    if x ? 'unidad_codigo' and x->>'unidad_codigo' is not null then
      select id into v_unidad from obra_unidades where obra_id = r.obra_id and codigo = x->>'unidad_codigo';
      if v_unidad is null then perform circ_fail('GR422', 'Unidad inexistente: ' || (x->>'unidad_codigo')); end if;
    end if;
    insert into pliego_partidas(revision_id, pliego_id, obra_id, codigo, paquete, titulo, alcance, cantidad, unidad, fuente,
        fuente_revision, evidencia_requerida, criterio_aceptacion, responsable, es_comun, unidad_id, precio_referencia, orden)
      values (p_revision, r.pliego_id, r.obra_id, x->>'codigo', coalesce(x->>'paquete', 'general'), coalesce(x->>'titulo', x->>'codigo'),
        coalesce(x->>'alcance', ''), (x->>'cantidad')::numeric, coalesce(x->>'unidad', ''), coalesce(x->>'fuente', ''),
        coalesce(x->>'fuente_revision', ''), coalesce(x->>'evidencia_requerida', ''), coalesce(x->>'criterio_aceptacion', ''),
        coalesce(x->>'responsable', ''), coalesce((x->>'es_comun')::boolean, false), v_unidad, (x->>'precio_referencia')::numeric,
        coalesce((x->>'orden')::int, 0))
    on conflict (revision_id, codigo) do update set
      paquete = coalesce(x->>'paquete', pliego_partidas.paquete), titulo = coalesce(x->>'titulo', pliego_partidas.titulo),
      alcance = coalesce(x->>'alcance', pliego_partidas.alcance), cantidad = coalesce((x->>'cantidad')::numeric, pliego_partidas.cantidad),
      unidad = coalesce(x->>'unidad', pliego_partidas.unidad), fuente = coalesce(x->>'fuente', pliego_partidas.fuente),
      fuente_revision = coalesce(x->>'fuente_revision', pliego_partidas.fuente_revision),
      evidencia_requerida = coalesce(x->>'evidencia_requerida', pliego_partidas.evidencia_requerida),
      criterio_aceptacion = coalesce(x->>'criterio_aceptacion', pliego_partidas.criterio_aceptacion),
      responsable = coalesce(x->>'responsable', pliego_partidas.responsable),
      es_comun = coalesce((x->>'es_comun')::boolean, pliego_partidas.es_comun),
      unidad_id = case when x ? 'unidad_codigo' then v_unidad else pliego_partidas.unidad_id end,
      precio_referencia = coalesce((x->>'precio_referencia')::numeric, pliego_partidas.precio_referencia),
      orden = coalesce((x->>'orden')::int, pliego_partidas.orden);
    v_n := v_n + 1;
  end loop;
  perform circ_evento(r.obra_id, p_actor, 'partidas_guardadas', 'pliego_revision', p_revision, jsonb_build_object('cantidad', v_n));
  return circ_idem_end(p_actor, 'pliego_guardar_partidas', p_idem, jsonb_build_object('revision_id', p_revision, 'guardadas', v_n,
    'total', (select count(*) from pliego_partidas where revision_id = p_revision)));
end $$;

create or replace function public.circ_pliego_avanzar(p_actor uuid, p_revision uuid, p_etapa text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r pliego_revisiones; v_faltan text; v_huella text; v_desact int := 0;
begin
  select * into r from pliego_revisiones where id = p_revision for update;
  if not found then perform circ_fail('GR404', 'Revisión no encontrada'); end if;
  perform circ_req_responsable(r.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'pliego_avanzar', p_idem, r.obra_id); if v is not null then return v; end if;
  if r.estado <> 'borrador' then perform circ_fail('GR409', 'La revisión ya no está en borrador'); end if;
  if not exists (select 1 from pliego_partidas where revision_id = p_revision) then
    perform circ_fail('GR422', 'El pliego no tiene partidas');
  end if;
  if p_etapa = 'ingenieria_detalle' then
    if r.etapa <> 'ingenieria_general' then perform circ_fail('GR409', 'La revisión ya pasó la ingeniería general'); end if;
    select string_agg(codigo, ', ' order by codigo) into v_faltan from pliego_partidas
      where revision_id = p_revision and (trim(alcance) = '' or trim(titulo) = '' or trim(paquete) = '');
    if v_faltan is not null then perform circ_fail('GR422', 'Ingeniería general incompleta (alcance/paquete) en: ' || v_faltan); end if;
    update pliego_revisiones set etapa = 'ingenieria_detalle' where id = p_revision;
  elsif p_etapa = 'publicable' then
    if r.etapa <> 'ingenieria_detalle' then perform circ_fail('GR409', 'Primero hay que cerrar la ingeniería general'); end if;
    select string_agg(codigo, ', ' order by codigo) into v_faltan from pliego_partidas
      where revision_id = p_revision and (trim(alcance) = '' or cantidad is null or cantidad <= 0 or trim(unidad) = '' or trim(fuente) = ''
        or trim(fuente_revision) = '' or trim(evidencia_requerida) = '' or trim(criterio_aceptacion) = '' or trim(responsable) = '');
    if v_faltan is not null then
      perform circ_fail('GR422', 'No es publicable: falta alcance, cantidad, unidad, fuente y revisión, evidencia, criterio de aceptación o responsable en: ' || v_faltan);
    end if;
    select md5(string_agg(concat_ws('|', codigo, paquete, alcance, cantidad::text, unidad, fuente, fuente_revision, evidencia_requerida,
      criterio_aceptacion, responsable, es_comun::text, coalesce(unidad_id::text, '')), E'\n' order by codigo)) into v_huella
      from pliego_partidas where revision_id = p_revision;
    update pliego_revisiones set estado = 'reemplazada' where pliego_id = r.pliego_id and estado = 'publicada';
    update pliego_revisiones set etapa = 'publicable', estado = 'publicada', huella = v_huella, publicada_at = now() where id = p_revision;
    -- Las solicitudes abiertas sobre revisiones anteriores dejan de ser adjudicables.
    with s as (update solicitudes_cotizacion set estado = 'desactualizada'
      where pliego_id = r.pliego_id and revision_id <> p_revision and estado = 'abierta' returning id)
    update ofertas set estado = 'desactualizada' where solicitud_id in (select id from s) and estado = 'enviada';
    get diagnostics v_desact = row_count;
  else
    perform circ_fail('GR422', 'Etapa inválida');
  end if;
  perform circ_evento(r.obra_id, p_actor, 'pliego_' || p_etapa, 'pliego_revision', p_revision, jsonb_build_object('numero', r.numero, 'huella', v_huella));
  return circ_idem_end(p_actor, 'pliego_avanzar', p_idem, jsonb_build_object('revision_id', p_revision, 'numero', r.numero, 'etapa', p_etapa,
    'estado', case when p_etapa = 'publicable' then 'publicada' else 'borrador' end, 'huella', v_huella, 'ofertas_desactualizadas', v_desact));
end $$;

create or replace function public.circ_pliego_nueva_revision(p_actor uuid, p_pliego uuid, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; pl pliegos; base pliego_revisiones; v_rev uuid;
begin
  select * into pl from pliegos where id = p_pliego for update;
  if not found then perform circ_fail('GR404', 'Pliego no encontrado'); end if;
  perform circ_req_responsable(pl.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'pliego_nueva_revision', p_idem, pl.obra_id); if v is not null then return v; end if;
  if coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'Indicá el motivo del cambio de alcance'); end if;
  if exists (select 1 from pliego_revisiones where pliego_id = p_pliego and estado = 'borrador') then
    perform circ_fail('GR409', 'Ya hay una revisión en borrador');
  end if;
  select * into base from pliego_revisiones where pliego_id = p_pliego and estado = 'publicada';
  if not found then perform circ_fail('GR409', 'No hay una revisión publicada de la cual partir'); end if;
  insert into pliego_revisiones(pliego_id, obra_id, numero, etapa, motivo, created_by)
    values (p_pliego, pl.obra_id, base.numero + 1, 'ingenieria_detalle', trim(p_motivo), p_actor) returning id into v_rev;
  insert into pliego_partidas(revision_id, pliego_id, obra_id, codigo, paquete, titulo, alcance, cantidad, unidad, fuente, fuente_revision,
      evidencia_requerida, criterio_aceptacion, responsable, es_comun, unidad_id, precio_referencia, orden)
    select v_rev, pliego_id, obra_id, codigo, paquete, titulo, alcance, cantidad, unidad, fuente, fuente_revision,
      evidencia_requerida, criterio_aceptacion, responsable, es_comun, unidad_id, precio_referencia, orden
    from pliego_partidas where revision_id = base.id;
  perform circ_evento(pl.obra_id, p_actor, 'pliego_revision_creada', 'pliego_revision', v_rev, jsonb_build_object('numero', base.numero + 1, 'motivo', p_motivo));
  return circ_idem_end(p_actor, 'pliego_nueva_revision', p_idem, jsonb_build_object('revision_id', v_rev, 'numero', base.numero + 1));
end $$;

create or replace function public.circ_unidades_guardar(p_actor uuid, p_obra uuid, p_unidades jsonb, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; x jsonb;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'unidades_guardar', p_idem, p_obra); if v is not null then return v; end if;
  for x in select * from jsonb_array_elements(p_unidades) loop
    insert into obra_unidades(obra_id, codigo, descripcion, m2) values (p_obra, x->>'codigo', coalesce(x->>'descripcion', ''), (x->>'m2')::numeric)
    on conflict (obra_id, codigo) do update set descripcion = excluded.descripcion, m2 = excluded.m2;
  end loop;
  perform circ_evento(p_obra, p_actor, 'unidades_guardadas', 'obra', p_obra, jsonb_build_object('cantidad', jsonb_array_length(p_unidades)));
  return circ_idem_end(p_actor, 'unidades_guardar', p_idem, jsonb_build_object('unidades', (select count(*) from obra_unidades where obra_id = p_obra)));
end $$;

create or replace function public.circ_participante_agregar(p_actor uuid, p_obra uuid, p_user uuid, p_rol text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform circ_req_responsable(p_obra, p_actor);
  if not exists (select 1 from auth.users where id = p_user) then perform circ_fail('GR404', 'Usuario no encontrado'); end if;
  insert into obra_participantes(obra_id, user_id, rol, created_by) values (p_obra, p_user, p_rol, p_actor)
    on conflict (obra_id, user_id, rol) do update set rol = excluded.rol returning id into v_id;
  perform circ_evento(p_obra, p_actor, 'participante_agregado', 'participante', v_id, jsonb_build_object('rol', p_rol, 'user_id', p_user));
  return jsonb_build_object('participante_id', v_id, 'rol', p_rol);
end $$;

-- ═════════════════════════ PLAN
-- p_tareas: [{clave, titulo, partida_codigo, frente, cantidad, duracion_dias, etapa,
--             depende_de: [{clave, lag_dias}], restricciones: [{clave, tipo, descripcion, recurso_clave, fecha_disponible}]}]
create or replace function public.circ_plan_guardar(p_actor uuid, p_obra uuid, p_fecha_inicio date, p_tareas jsonb, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; x jsonb; d jsonb; v_org uuid; v_pliego uuid; v_rev uuid; v_tarea uuid; v_dep uuid; v_dur int; v_bad text; v_new int := 0; v_upd int := 0;
begin
  perform circ_req_planificador(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'plan_guardar', p_idem, p_obra); if v is not null then return v; end if;
  select org_id into v_org from obras where id = p_obra;
  select p.id into v_pliego from pliegos p where p.obra_id = p_obra order by p.created_at limit 1;
  if v_pliego is null then perform circ_fail('GR409', 'La obra todavía no tiene pliego'); end if;
  select id into v_rev from pliego_revisiones where pliego_id = v_pliego order by numero desc limit 1;
  insert into obra_circuito(obra_id, fecha_inicio_plan) values (p_obra, p_fecha_inicio)
    on conflict (obra_id) do update set fecha_inicio_plan = coalesce(p_fecha_inicio, obra_circuito.fecha_inicio_plan), updated_at = now();
  for x in select * from jsonb_array_elements(p_tareas) loop
    if coalesce(x->>'clave', '') = '' then perform circ_fail('GR422', 'Cada tarea necesita una clave'); end if;
    if not exists (select 1 from pliego_partidas where revision_id = v_rev and codigo = x->>'partida_codigo') then
      perform circ_fail('GR422', 'La tarea ' || (x->>'clave') || ' referencia una partida inexistente: ' || coalesce(x->>'partida_codigo', '∅'));
    end if;
    v_dur := greatest(1, coalesce((x->>'duracion_dias')::int, 1));
    select tarea_id into v_tarea from partida_tareas where obra_id = p_obra and clave = x->>'clave';
    if v_tarea is null then
      -- La tarea de cronograma no exige elemento de catálogo: su origen es la partida del pliego.
      insert into tareas(obra_id, org_id, title, descripcion, bloques_planificados, dias_presupuesto, etapa, source)
        values (p_obra, v_org, x->>'titulo', 'Partida ' || (x->>'partida_codigo') || ' · frente ' || coalesce(x->>'frente', 'general'),
          v_dur, v_dur, x->>'etapa', 'circuito') returning id into v_tarea;
      insert into partida_tareas(obra_id, pliego_id, partida_codigo, tarea_id, clave, frente, cantidad)
        values (p_obra, v_pliego, x->>'partida_codigo', v_tarea, x->>'clave', coalesce(x->>'frente', 'general'), (x->>'cantidad')::numeric);
      v_new := v_new + 1;
    else
      update tareas set title = coalesce(x->>'titulo', title), dias_presupuesto = v_dur, bloques_planificados = v_dur,
        etapa = coalesce(x->>'etapa', etapa), updated_at = now() where id = v_tarea;
      update partida_tareas set partida_codigo = x->>'partida_codigo', frente = coalesce(x->>'frente', frente),
        cantidad = coalesce((x->>'cantidad')::numeric, cantidad) where tarea_id = v_tarea;
      v_upd := v_upd + 1;
    end if;
  end loop;
  -- Dependencias y restricciones (segunda pasada: todas las claves ya existen).
  for x in select * from jsonb_array_elements(p_tareas) loop
    select tarea_id into v_tarea from partida_tareas where obra_id = p_obra and clave = x->>'clave';
    if x ? 'depende_de' then
      delete from tarea_precedencias where tarea_id = v_tarea;
      for d in select * from jsonb_array_elements(coalesce(x->'depende_de', '[]'::jsonb)) loop
        select tarea_id into v_dep from partida_tareas where obra_id = p_obra and clave = d->>'clave';
        if v_dep is null or v_dep = v_tarea then perform circ_fail('GR422', 'Dependencia inválida en ' || (x->>'clave') || ': ' || coalesce(d->>'clave', '∅')); end if;
        insert into tarea_precedencias(tarea_id, depende_de, tipo_dependencia, lag_dias) values (v_tarea, v_dep, 'FS', coalesce((d->>'lag_dias')::numeric, 0));
      end loop;
    end if;
    for d in select * from jsonb_array_elements(coalesce(x->'restricciones', '[]'::jsonb)) loop
      insert into plan_restricciones(obra_id, tarea_id, clave, tipo, descripcion, recurso_clave, fecha_disponible)
        values (p_obra, v_tarea, d->>'clave', d->>'tipo', coalesce(d->>'descripcion', ''), d->>'recurso_clave', (d->>'fecha_disponible')::date)
      on conflict (obra_id, clave) do update set tarea_id = excluded.tarea_id, tipo = excluded.tipo, descripcion = excluded.descripcion,
        recurso_clave = excluded.recurso_clave,
        fecha_disponible = case when plan_restricciones.estado = 'cumplida' then plan_restricciones.fecha_disponible else excluded.fecha_disponible end,
        updated_at = now();
    end loop;
  end loop;
  -- Una partida puede repartirse entre niveles o frentes, pero nunca por más de su cantidad.
  select string_agg(q.partida_codigo, ', ') into v_bad from (
    select pt.partida_codigo from partida_tareas pt join pliego_partidas pp on pp.revision_id = v_rev and pp.codigo = pt.partida_codigo
    where pt.obra_id = p_obra group by pt.partida_codigo, pp.cantidad having sum(pt.cantidad) > pp.cantidad + 0.0005) q;
  if v_bad is not null then perform circ_fail('GR422', 'Las tareas superan la cantidad de la partida: ' || v_bad); end if;
  perform circ_evento(p_obra, p_actor, 'plan_guardado', 'obra', p_obra, jsonb_build_object('nuevas', v_new, 'actualizadas', v_upd));
  return circ_idem_end(p_actor, 'plan_guardar', p_idem, jsonb_build_object('nuevas', v_new, 'actualizadas', v_upd,
    'tareas', (select jsonb_object_agg(clave, tarea_id) from partida_tareas where obra_id = p_obra)));
end $$;

-- Persiste el cálculo del cronograma (lo calcula la API con lib/circuito/cronograma.ts) y, si se pide, fija línea base.
create or replace function public.circ_plan_aplicar(p_actor uuid, p_obra uuid, p_calculo jsonb, p_fijar_linea_base boolean, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; x jsonb; v_lb uuid; v_ver int; v_n int := 0;
begin
  perform circ_req_planificador(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'plan_aplicar', p_idem, p_obra); if v is not null then return v; end if;
  for x in select * from jsonb_array_elements(p_calculo) loop
    update tareas set fecha_inicio_estimada = (x->>'inicio')::date, fecha_fin_estimada = (x->>'fin')::date,
      es = (x->>'es')::numeric, ef = (x->>'ef')::numeric, ls = (x->>'ls')::numeric, lf = (x->>'lf')::numeric,
      "float" = (x->>'holgura')::numeric, is_critical = (x->>'critica')::boolean, updated_at = now()
    where id = (x->>'tarea_id')::uuid and obra_id = p_obra and id in (select tarea_id from partida_tareas where obra_id = p_obra);
    if found then v_n := v_n + 1; end if;
  end loop;
  if p_fijar_linea_base then
    select coalesce(max(version), 0) + 1 into v_ver from plan_lineas_base where obra_id = p_obra;
    if v_ver > 1 and coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'Una nueva línea base necesita motivo'); end if;
    insert into plan_lineas_base(obra_id, version, motivo, fijada_por) values (p_obra, v_ver, coalesce(p_motivo, 'Línea base inicial'), p_actor) returning id into v_lb;
    insert into plan_linea_base_tareas(linea_base_id, tarea_id, inicio, fin, duracion, costo)
      select v_lb, (y->>'tarea_id')::uuid, (y->>'inicio')::date, (y->>'fin')::date, (y->>'duracion')::int, coalesce((y->>'costo')::numeric, 0)
      from jsonb_array_elements(p_calculo) y where (y->>'tarea_id')::uuid in (select tarea_id from partida_tareas where obra_id = p_obra);
  end if;
  perform circ_evento(p_obra, p_actor, case when p_fijar_linea_base then 'linea_base_fijada' else 'plan_recalculado' end, 'obra', p_obra,
    jsonb_build_object('tareas', v_n, 'linea_base_version', v_ver, 'motivo', p_motivo));
  return circ_idem_end(p_actor, 'plan_aplicar', p_idem, jsonb_build_object('tareas', v_n, 'linea_base_id', v_lb, 'linea_base_version', v_ver));
end $$;

create or replace function public.circ_restriccion_actualizar(p_actor uuid, p_obra uuid, p_clave text, p_fecha date, p_estado text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r plan_restricciones;
begin
  perform circ_req_planificador(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'restriccion_actualizar', p_idem, p_obra); if v is not null then return v; end if;
  select * into r from plan_restricciones where obra_id = p_obra and clave = p_clave for update;
  if not found then perform circ_fail('GR404', 'Restricción no encontrada'); end if;
  update plan_restricciones set fecha_disponible = coalesce(p_fecha, fecha_disponible), estado = coalesce(p_estado, estado), updated_at = now() where id = r.id;
  perform circ_evento(p_obra, p_actor, 'restriccion_actualizada', 'restriccion', r.id,
    jsonb_build_object('clave', p_clave, 'fecha_anterior', r.fecha_disponible, 'fecha', coalesce(p_fecha, r.fecha_disponible), 'estado', coalesce(p_estado, r.estado)));
  return circ_idem_end(p_actor, 'restriccion_actualizar', p_idem, jsonb_build_object('restriccion_id', r.id, 'fecha_disponible', coalesce(p_fecha, r.fecha_disponible), 'estado', coalesce(p_estado, r.estado)));
end $$;

-- ═════════════════════════ COTIZACIÓN
create or replace function public.circ_solicitud_crear(p_actor uuid, p_obra uuid, p_revision uuid, p_paquete text, p_titulo text, p_fecha_limite date, p_socios uuid[], p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r pliego_revisiones; v_org uuid; v_id uuid; s uuid; v_obra text;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'solicitud_crear', p_idem, p_obra); if v is not null then return v; end if;
  select * into r from pliego_revisiones where id = p_revision and obra_id = p_obra;
  if not found then perform circ_fail('GR404', 'Revisión no encontrada en la obra'); end if;
  if r.estado <> 'publicada' then perform circ_fail('GR409', 'Solo se puede pedir cotización sobre la revisión publicada vigente'); end if;
  if not exists (select 1 from pliego_partidas where revision_id = p_revision and paquete = p_paquete) then
    perform circ_fail('GR422', 'El paquete no tiene partidas en esa revisión');
  end if;
  if coalesce(cardinality(p_socios), 0) = 0 then perform circ_fail('GR422', 'Elegí al menos un contratista'); end if;
  if exists (select 1 from solicitudes_cotizacion where revision_id = p_revision and paquete = p_paquete and estado in ('abierta','adjudicada')) then
    perform circ_fail('GR409', 'Ese paquete ya tiene una solicitud vigente para esta revisión');
  end if;
  select org_id, name into v_org, v_obra from obras where id = p_obra;
  foreach s in array p_socios loop
    -- Regla existente: solo contactos de la agenda de la organización (o socios propios).
    if not exists (select 1 from socios so where so.id = s and (so.org_id = v_org
        or exists (select 1 from cliente_socio_agenda a where a.org_id = v_org and a.socio_id = s and a.estado = 'activo'))) then
      perform circ_fail('GR422', 'El contratista no está en la agenda de la organización: ' || s);
    end if;
  end loop;
  insert into solicitudes_cotizacion(obra_id, pliego_id, revision_id, paquete, titulo, fecha_limite, created_by)
    values (p_obra, r.pliego_id, p_revision, p_paquete, coalesce(nullif(trim(p_titulo), ''), 'Cotización ' || p_paquete), p_fecha_limite, p_actor) returning id into v_id;
  insert into solicitud_invitados(solicitud_id, socio_id) select v_id, unnest(p_socios) on conflict do nothing;
  insert into notificaciones(titulo, mensaje, tipo, socio_id, obra_id, org_id, remitente_id)
    select 'Pedido de cotización', 'Te invitaron a cotizar «' || p_paquete || '» (revisión ' || r.numero || ') en ' || v_obra, 'solicitud_cotizacion', x, p_obra, v_org, p_actor
    from unnest(p_socios) x;
  perform circ_evento(p_obra, p_actor, 'solicitud_creada', 'solicitud', v_id, jsonb_build_object('revision', r.numero, 'paquete', p_paquete, 'invitados', cardinality(p_socios)));
  return circ_idem_end(p_actor, 'solicitud_crear', p_idem, jsonb_build_object('solicitud_id', v_id, 'revision_id', p_revision, 'revision_numero', r.numero, 'invitados', cardinality(p_socios)));
end $$;

-- p_items: [{partida_codigo, precio_unitario}] — debe cubrir exactamente las partidas del paquete en la revisión recibida.
create or replace function public.circ_oferta_enviar(p_actor uuid, p_solicitud uuid, p_revision uuid, p_items jsonb, p_plazo int, p_condiciones text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s solicitudes_cotizacion; v_socio uuid; v_oferta uuid; v_total numeric; v_dif text;
begin
  select * into s from solicitudes_cotizacion where id = p_solicitud for share;
  if not found then perform circ_fail('GR404', 'Solicitud no encontrada'); end if;
  select so.id into v_socio from socios so join solicitud_invitados i on i.socio_id = so.id and i.solicitud_id = p_solicitud where so.user_id = p_actor limit 1;
  if v_socio is null then perform circ_fail('42501', 'No fuiste invitado a cotizar esta solicitud'); end if;
  v := circ_idem_begin(p_actor, 'oferta_enviar', p_idem, s.obra_id); if v is not null then return v; end if;
  if s.estado <> 'abierta' then perform circ_fail('GR409', 'La solicitud ya no recibe ofertas (estado: ' || s.estado || ')'); end if;
  if p_revision is distinct from s.revision_id then
    perform circ_fail('GR409', 'La oferta cotiza una revisión distinta de la que se envió en la solicitud');
  end if;
  if coalesce(p_plazo, 0) <= 0 then perform circ_fail('GR422', 'Indicá el plazo en días'); end if;
  select string_agg(coalesce(pp.codigo, i.codigo), ', ') into v_dif from
    (select codigo from pliego_partidas where revision_id = s.revision_id and paquete = s.paquete) pp
    full join (select x->>'partida_codigo' as codigo, (x->>'precio_unitario')::numeric as precio from jsonb_array_elements(p_items) x) i on i.codigo = pp.codigo
    where pp.codigo is null or i.codigo is null or coalesce(i.precio, 0) <= 0;
  if v_dif is not null then perform circ_fail('GR422', 'La oferta debe cotizar exactamente las partidas del paquete. Revisar: ' || v_dif); end if;
  select sum(round(pp.cantidad * (x->>'precio_unitario')::numeric, 2)) into v_total
    from jsonb_array_elements(p_items) x join pliego_partidas pp on pp.revision_id = s.revision_id and pp.codigo = x->>'partida_codigo';
  insert into ofertas(solicitud_id, obra_id, revision_id, socio_id, monto_total, plazo_dias, condiciones)
    values (p_solicitud, s.obra_id, s.revision_id, v_socio, v_total, p_plazo, coalesce(p_condiciones, ''))
    on conflict (solicitud_id, socio_id) do update set monto_total = excluded.monto_total, plazo_dias = excluded.plazo_dias,
      condiciones = excluded.condiciones, revision_id = excluded.revision_id, estado = 'enviada', created_at = now()
    returning id into v_oferta;
  delete from oferta_items where oferta_id = v_oferta;
  insert into oferta_items(oferta_id, partida_id, cantidad, precio_unitario, subtotal)
    select v_oferta, pp.id, pp.cantidad, (x->>'precio_unitario')::numeric, round(pp.cantidad * (x->>'precio_unitario')::numeric, 2)
    from jsonb_array_elements(p_items) x join pliego_partidas pp on pp.revision_id = s.revision_id and pp.codigo = x->>'partida_codigo';
  update solicitud_invitados set estado = 'cotizo' where solicitud_id = p_solicitud and socio_id = v_socio;
  perform circ_evento(s.obra_id, p_actor, 'oferta_enviada', 'oferta', v_oferta, jsonb_build_object('monto', v_total, 'plazo_dias', p_plazo, 'revision_id', s.revision_id));
  return circ_idem_end(p_actor, 'oferta_enviar', p_idem, jsonb_build_object('oferta_id', v_oferta, 'monto_total', v_total, 'revision_id', s.revision_id, 'socio_id', v_socio));
end $$;

create or replace function public.circ_adjudicar(p_actor uuid, p_solicitud uuid, p_oferta uuid, p_retencion_pct numeric, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s solicitudes_cotizacion; o ofertas; v_contrato uuid; v_tareas int; v_socio socios; v_org uuid;
begin
  select * into s from solicitudes_cotizacion where id = p_solicitud;
  if not found then perform circ_fail('GR404', 'Solicitud no encontrada'); end if;
  perform circ_req_responsable(s.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'adjudicar', p_idem, s.obra_id); if v is not null then return v; end if;
  -- Bloqueo de la solicitud: dos adjudicaciones simultáneas se resuelven en orden y la segunda ve el estado final.
  select * into s from solicitudes_cotizacion where id = p_solicitud for update;
  if s.estado <> 'abierta' then perform circ_fail('GR409', 'La solicitud ya no es adjudicable (estado: ' || s.estado || ')'); end if;
  select * into o from ofertas where id = p_oferta and solicitud_id = p_solicitud;
  if not found then perform circ_fail('GR404', 'La oferta no pertenece a la solicitud'); end if;
  if o.estado <> 'enviada' then perform circ_fail('GR409', 'La oferta no está vigente (estado: ' || o.estado || ')'); end if;
  if o.revision_id <> s.revision_id or not exists (select 1 from pliego_revisiones where id = s.revision_id and estado = 'publicada') then
    perform circ_fail('GR409', 'La revisión cotizada fue reemplazada; hay que volver a pedir cotización');
  end if;
  select * into v_socio from socios where id = o.socio_id;
  if v_socio.user_id = p_actor then perform circ_fail('42501', 'No podés adjudicarte tu propia oferta'); end if;
  insert into contratos(obra_id, solicitud_id, oferta_id, socio_id, pliego_id, revision_id, monto_total, retencion_pct, adjudicado_por)
    values (s.obra_id, s.id, o.id, o.socio_id, s.pliego_id, s.revision_id, o.monto_total, coalesce(p_retencion_pct, 5), p_actor) returning id into v_contrato;
  insert into contrato_items(contrato_id, obra_id, pliego_id, partida_codigo, partida_id, cantidad, precio_unitario, subtotal)
    select v_contrato, s.obra_id, s.pliego_id, pp.codigo, pp.id, oi.cantidad, oi.precio_unitario, oi.subtotal
    from oferta_items oi join pliego_partidas pp on pp.id = oi.partida_id where oi.oferta_id = o.id;
  update ofertas set estado = case when id = o.id then 'adjudicada' else 'no_adjudicada' end where solicitud_id = s.id and estado = 'enviada';
  update solicitudes_cotizacion set estado = 'adjudicada' where id = s.id;
  -- Publica las tareas del contrato: quedan asignadas al contratista con su costo contractual.
  update tareas t set responsable_socio_id = o.socio_id, responsable = coalesce(v_socio.nombre, v_socio.email),
      costo_presupuestado = round(ci.subtotal * pt.cantidad / nullif(ci.cantidad, 0), 2), published_from_canvas_at = coalesce(t.published_from_canvas_at, now()), updated_at = now()
    from partida_tareas pt join contrato_items ci on ci.pliego_id = pt.pliego_id and ci.partida_codigo = pt.partida_codigo and ci.contrato_id = v_contrato
    where t.id = pt.tarea_id;
  get diagnostics v_tareas = row_count;
  select org_id into v_org from obras where id = s.obra_id;
  insert into notificaciones(titulo, mensaje, tipo, socio_id, obra_id, org_id, remitente_id)
    values ('Adjudicación', 'Se te adjudicó «' || s.paquete || '». Tareas publicadas: ' || v_tareas, 'adjudicacion', o.socio_id, s.obra_id, v_org, p_actor);
  perform circ_evento(s.obra_id, p_actor, 'adjudicada', 'contrato', v_contrato, jsonb_build_object('solicitud_id', s.id, 'oferta_id', o.id, 'socio_id', o.socio_id, 'monto', o.monto_total, 'tareas', v_tareas));
  return circ_idem_end(p_actor, 'adjudicar', p_idem, jsonb_build_object('contrato_id', v_contrato, 'oferta_id', o.id, 'socio_id', o.socio_id, 'monto_total', o.monto_total, 'tareas_publicadas', v_tareas));
end $$;

-- Cambio de alcance con contrato vigente: adenda propuesta por el responsable y aceptada por el contratista.
create or replace function public.circ_adenda_proponer(p_actor uuid, p_contrato uuid, p_revision uuid, p_items jsonb, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; c contratos; s solicitudes_cotizacion; v_dif text; v_nuevo numeric; v_id uuid; v_bad text;
begin
  select * into c from contratos where id = p_contrato;
  if not found then perform circ_fail('GR404', 'Contrato no encontrado'); end if;
  perform circ_req_responsable(c.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'adenda_proponer', p_idem, c.obra_id); if v is not null then return v; end if;
  if c.estado <> 'vigente' then perform circ_fail('GR409', 'El contrato no está vigente'); end if;
  if not exists (select 1 from pliego_revisiones where id = p_revision and pliego_id = c.pliego_id and estado = 'publicada') or p_revision = c.revision_id then
    perform circ_fail('GR409', 'La adenda debe referir a una revisión publicada posterior a la del contrato');
  end if;
  if coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'Indicá el motivo'); end if;
  select * into s from solicitudes_cotizacion where id = c.solicitud_id;
  select string_agg(coalesce(pp.codigo, i.codigo), ', ') into v_dif from
    (select codigo from pliego_partidas where revision_id = p_revision and paquete = s.paquete) pp
    full join (select x->>'partida_codigo' as codigo, (x->>'precio_unitario')::numeric as precio from jsonb_array_elements(p_items) x) i on i.codigo = pp.codigo
    where pp.codigo is null or i.codigo is null or coalesce(i.precio, 0) <= 0;
  if v_dif is not null then perform circ_fail('GR422', 'La adenda debe valorizar exactamente las partidas del paquete en la nueva revisión. Revisar: ' || v_dif); end if;
  if exists (select 1 from contrato_items ci where ci.contrato_id = c.id and not exists (select 1 from jsonb_array_elements(p_items) x where x->>'partida_codigo' = ci.partida_codigo)) then
    perform circ_fail('GR422', 'La adenda no puede quitar partidas ya contratadas');
  end if;
  -- Nunca por debajo de lo ya certificado.
  select string_agg(ci.partida_codigo, ', ') into v_bad from contrato_items ci
    join jsonb_array_elements(p_items) x on x->>'partida_codigo' = ci.partida_codigo
    join pliego_partidas pp on pp.revision_id = p_revision and pp.codigo = ci.partida_codigo
    where ci.contrato_id = c.id and round(pp.cantidad * (x->>'precio_unitario')::numeric, 2) <
      coalesce((select sum(i.monto) from certificado_items i join certificados ce on ce.id = i.certificado_id where i.contrato_item_id = ci.id and ce.estado = 'aprobado'), 0);
  if v_bad is not null then perform circ_fail('GR409', 'El nuevo valor queda por debajo de lo ya certificado en: ' || v_bad); end if;
  select sum(round(pp.cantidad * (x->>'precio_unitario')::numeric, 2)) into v_nuevo
    from jsonb_array_elements(p_items) x join pliego_partidas pp on pp.revision_id = p_revision and pp.codigo = x->>'partida_codigo';
  insert into contrato_adendas(contrato_id, obra_id, revision_id, motivo, items, monto_anterior, monto_nuevo, propuesta_por)
    values (c.id, c.obra_id, p_revision, trim(p_motivo), p_items, c.monto_total, v_nuevo, p_actor) returning id into v_id;
  perform circ_evento(c.obra_id, p_actor, 'adenda_propuesta', 'adenda', v_id, jsonb_build_object('monto_anterior', c.monto_total, 'monto_nuevo', v_nuevo));
  return circ_idem_end(p_actor, 'adenda_proponer', p_idem, jsonb_build_object('adenda_id', v_id, 'monto_anterior', c.monto_total, 'monto_nuevo', v_nuevo));
end $$;

create or replace function public.circ_adenda_responder(p_actor uuid, p_adenda uuid, p_acepta boolean, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; a contrato_adendas; c contratos;
begin
  select * into a from contrato_adendas where id = p_adenda for update;
  if not found then perform circ_fail('GR404', 'Adenda no encontrada'); end if;
  select * into c from contratos where id = a.contrato_id for update;
  if not exists (select 1 from socios where id = c.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista del contrato puede responder la adenda');
  end if;
  v := circ_idem_begin(p_actor, 'adenda_responder', p_idem, a.obra_id); if v is not null then return v; end if;
  if a.estado <> 'propuesta' then perform circ_fail('GR409', 'La adenda ya fue respondida'); end if;
  if not exists (select 1 from pliego_revisiones where id = a.revision_id and estado = 'publicada') then
    perform circ_fail('GR409', 'La revisión de la adenda ya fue reemplazada');
  end if;
  update contrato_adendas set estado = case when p_acepta then 'aceptada' else 'rechazada' end, respondida_por = p_actor, respondida_at = now() where id = a.id;
  if p_acepta then
    update contrato_items ci set partida_id = pp.id, cantidad = pp.cantidad, precio_unitario = (x->>'precio_unitario')::numeric,
        subtotal = round(pp.cantidad * (x->>'precio_unitario')::numeric, 2)
      from jsonb_array_elements(a.items) x join pliego_partidas pp on pp.revision_id = a.revision_id and pp.codigo = x->>'partida_codigo'
      where ci.contrato_id = c.id and ci.partida_codigo = pp.codigo;
    insert into contrato_items(contrato_id, obra_id, pliego_id, partida_codigo, partida_id, cantidad, precio_unitario, subtotal)
      select c.id, c.obra_id, c.pliego_id, pp.codigo, pp.id, pp.cantidad, (x->>'precio_unitario')::numeric, round(pp.cantidad * (x->>'precio_unitario')::numeric, 2)
      from jsonb_array_elements(a.items) x join pliego_partidas pp on pp.revision_id = a.revision_id and pp.codigo = x->>'partida_codigo'
      where not exists (select 1 from contrato_items ci where ci.contrato_id = c.id and ci.partida_codigo = pp.codigo);
    update contratos set revision_id = a.revision_id, monto_total = a.monto_nuevo where id = c.id;
    update tareas t set responsable_socio_id = c.socio_id, costo_presupuestado = round(ci.subtotal * pt.cantidad / nullif(ci.cantidad, 0), 2), updated_at = now()
      from partida_tareas pt join contrato_items ci on ci.pliego_id = pt.pliego_id and ci.partida_codigo = pt.partida_codigo and ci.contrato_id = c.id
      where t.id = pt.tarea_id;
  end if;
  perform circ_evento(a.obra_id, p_actor, case when p_acepta then 'adenda_aceptada' else 'adenda_rechazada' end, 'adenda', a.id,
    jsonb_build_object('contrato_id', c.id, 'monto_anterior', a.monto_anterior, 'monto_nuevo', a.monto_nuevo));
  return circ_idem_end(p_actor, 'adenda_responder', p_idem, jsonb_build_object('adenda_id', a.id, 'estado', case when p_acepta then 'aceptada' else 'rechazada' end,
    'monto_contrato', case when p_acepta then a.monto_nuevo else c.monto_total end));
end $$;

-- ═════════════════════════ AVANCES Y EVIDENCIA
create or replace function public.circ_contrato_de_tarea(p_tarea uuid) returns public.contratos
language sql stable set search_path = public as $$
  select c.* from partida_tareas pt join contrato_items ci on ci.pliego_id = pt.pliego_id and ci.partida_codigo = pt.partida_codigo
    join contratos c on c.id = ci.contrato_id where pt.tarea_id = p_tarea limit 1;
$$;
-- Motivo por el que una tarea NO está habilitada (null = habilitada).
create or replace function public.circ_tarea_bloqueo(p_tarea uuid, p_fecha date) returns text
language plpgsql stable set search_path = public as $$
declare t tareas; oc obra_circuito; c contratos; v text;
begin
  select * into t from tareas where id = p_tarea;
  select * into oc from obra_circuito where obra_id = t.obra_id;
  c := circ_contrato_de_tarea(p_tarea);
  if c.id is null then return 'La tarea no tiene contrato adjudicado'; end if;
  if c.estado <> 'vigente' then return 'El contrato no está vigente'; end if;
  if oc.estado in ('en_cierre', 'cerrada') then return 'La obra está en proceso de cierre'; end if;
  if oc.estado = 'reprogramada' and oc.reprogramada_hasta is not null and p_fecha < oc.reprogramada_hasta then
    return 'La obra está reprogramada hasta ' || oc.reprogramada_hasta;
  end if;
  select string_agg(d.title, ', ') into v from tarea_precedencias p join tareas d on d.id = p.depende_de where p.tarea_id = p_tarea and coalesce(d.avance, 0) < 100;
  if v is not null then return 'Predecesoras sin terminar: ' || v; end if;
  select string_agg(r.descripcion, ', ') into v from plan_restricciones r where r.tarea_id = p_tarea and r.tipo in ('compra', 'inspeccion') and r.estado = 'pendiente';
  if v is not null then return 'Compras o inspecciones pendientes: ' || v; end if;
  return null;
end $$;

create or replace function public.circ_avance_informar(p_actor uuid, p_tarea uuid, p_fecha date, p_porcentaje numeric, p_nota text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; t tareas; c contratos; v_bloqueo text; v_id uuid;
begin
  select * into t from tareas where id = p_tarea for update;
  if not found then perform circ_fail('GR404', 'Tarea no encontrada'); end if;
  c := circ_contrato_de_tarea(p_tarea);
  if c.id is null or not exists (select 1 from socios where id = c.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista adjudicado puede informar avance de esta tarea');
  end if;
  v := circ_idem_begin(p_actor, 'avance_informar', p_idem, t.obra_id); if v is not null then return v; end if;
  v_bloqueo := circ_tarea_bloqueo(p_tarea, p_fecha);
  if v_bloqueo is not null then perform circ_fail('GR409', 'Tarea no habilitada. ' || v_bloqueo); end if;
  if exists (select 1 from avances where tarea_id = p_tarea and estado in ('informado', 'observado')) then
    perform circ_fail('GR409', 'Ya hay un avance pendiente de revisión o corrección en esta tarea');
  end if;
  if p_porcentaje is null or p_porcentaje <= coalesce(t.avance, 0) or p_porcentaje > 100 then
    perform circ_fail('GR422', 'El avance acumulado debe superar el aceptado (' || coalesce(t.avance, 0) || '%) y no pasar de 100%');
  end if;
  insert into avances(obra_id, tarea_id, contrato_id, socio_id, fecha, porcentaje, nota, created_by)
    values (t.obra_id, p_tarea, c.id, c.socio_id, p_fecha, p_porcentaje, coalesce(p_nota, ''), p_actor) returning id into v_id;
  perform circ_evento(t.obra_id, p_actor, 'avance_informado', 'avance', v_id, jsonb_build_object('tarea_id', p_tarea, 'porcentaje', p_porcentaje, 'fecha', p_fecha));
  return circ_idem_end(p_actor, 'avance_informar', p_idem, jsonb_build_object('avance_id', v_id, 'tarea_id', p_tarea, 'porcentaje', p_porcentaje));
end $$;

create or replace function public.circ_avance_corregir(p_actor uuid, p_avance uuid, p_porcentaje numeric, p_nota text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; a avances; t tareas;
begin
  select * into a from avances where id = p_avance for update;
  if not found then perform circ_fail('GR404', 'Avance no encontrado'); end if;
  if a.created_by <> p_actor and not exists (select 1 from socios where id = a.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista que informó puede corregir');
  end if;
  v := circ_idem_begin(p_actor, 'avance_corregir', p_idem, a.obra_id); if v is not null then return v; end if;
  if a.estado <> 'observado' then perform circ_fail('GR409', 'Solo se corrige un avance observado'); end if;
  select * into t from tareas where id = a.tarea_id;
  if coalesce(p_porcentaje, a.porcentaje) <= coalesce(t.avance, 0) or coalesce(p_porcentaje, a.porcentaje) > 100 then
    perform circ_fail('GR422', 'Porcentaje inválido');
  end if;
  update avances set porcentaje = coalesce(p_porcentaje, porcentaje), nota = coalesce(p_nota, nota), version = version + 1, estado = 'informado' where id = a.id;
  perform circ_evento(a.obra_id, p_actor, 'avance_corregido', 'avance', a.id, jsonb_build_object('version', a.version + 1, 'porcentaje', coalesce(p_porcentaje, a.porcentaje)));
  return circ_idem_end(p_actor, 'avance_corregir', p_idem, jsonb_build_object('avance_id', a.id, 'version', a.version + 1, 'estado', 'informado'));
end $$;

create or replace function public.circ_evidencia_registrar(p_actor uuid, p_entidad text, p_entidad_id uuid, p_path text, p_nombre text, p_sha text, p_bytes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_obra uuid; v_socio uuid; v_version int; v_estado text; v_id uuid; v_nueva boolean := true;
begin
  if p_entidad = 'avance' then
    select obra_id, socio_id, version, estado into v_obra, v_socio, v_version, v_estado from avances where id = p_entidad_id;
    if not found then perform circ_fail('GR404', 'Avance no encontrado'); end if;
    if v_estado = 'aceptado' then perform circ_fail('GR409', 'El avance ya fue aceptado'); end if;
    if v_estado = 'observado' then v_version := v_version + 1; end if;
  elsif p_entidad = 'certificado' then
    select ce.obra_id, c.socio_id, ce.version, ce.estado into v_obra, v_socio, v_version, v_estado
      from certificados ce join contratos c on c.id = ce.contrato_id where ce.id = p_entidad_id;
    if not found then perform circ_fail('GR404', 'Certificado no encontrado'); end if;
    if v_estado = 'aprobado' then perform circ_fail('GR409', 'El certificado ya fue aprobado'); end if;
    if v_estado = 'rechazado' then v_version := v_version + 1; end if;
  else
    perform circ_fail('GR422', 'Entidad inválida');
  end if;
  if not exists (select 1 from socios where id = v_socio and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista puede adjuntar evidencia a su trabajo');
  end if;
  insert into evidencias_obra(obra_id, entidad, entidad_id, version, storage_path, nombre, sha256, bytes, subido_por)
    values (v_obra, p_entidad, p_entidad_id, v_version, p_path, p_nombre, p_sha, p_bytes, p_actor)
    on conflict (entidad, entidad_id, version, sha256) do nothing returning id into v_id;
  if v_id is null then
    v_nueva := false;
    select id into v_id from evidencias_obra where entidad = p_entidad and entidad_id = p_entidad_id and version = v_version and sha256 = p_sha;
  else
    perform circ_evento(v_obra, p_actor, 'evidencia_registrada', p_entidad, p_entidad_id, jsonb_build_object('evidencia_id', v_id, 'version', v_version, 'sha256', p_sha));
  end if;
  return jsonb_build_object('evidencia_id', v_id, 'version', v_version, 'repetida', not v_nueva);
end $$;

create or replace function public.circ_avance_revisar(p_actor uuid, p_avance uuid, p_decision text, p_observacion text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; a avances; t tareas; v_estado_nuevo public.tarea_estado_oficial;
begin
  select * into a from avances where id = p_avance for update;
  if not found then perform circ_fail('GR404', 'Avance no encontrado'); end if;
  perform circ_req_responsable(a.obra_id, p_actor);
  if exists (select 1 from socios where id = a.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Un contratista no puede validar su propio avance');
  end if;
  v := circ_idem_begin(p_actor, 'avance_revisar', p_idem, a.obra_id); if v is not null then return v; end if;
  if a.estado <> 'informado' then perform circ_fail('GR409', 'El avance no está pendiente de revisión (estado: ' || a.estado || ')'); end if;
  if p_decision = 'observar' then
    if coalesce(trim(p_observacion), '') = '' then perform circ_fail('GR422', 'Indicá qué hay que corregir'); end if;
    update avances set estado = 'observado', observacion = trim(p_observacion), revisado_por = p_actor, revisado_at = now() where id = a.id;
  elsif p_decision = 'aceptar' then
    if not exists (select 1 from evidencias_obra where entidad = 'avance' and entidad_id = a.id and version = a.version) then
      perform circ_fail('GR422', 'No se puede aceptar un avance sin evidencia en su versión vigente');
    end if;
    select * into t from tareas where id = a.tarea_id for update;
    v_estado_nuevo := case when a.porcentaje >= 100 then 'validada' else 'en_progreso' end;
    update avances set estado = 'aceptado', revisado_por = p_actor, revisado_at = now() where id = a.id;
    update tareas set avance = a.porcentaje, estado = v_estado_nuevo, fecha_inicio_real = coalesce(fecha_inicio_real, a.fecha::timestamptz),
      fecha_fin_real = case when a.porcentaje >= 100 then a.fecha::timestamptz else null end,
      fecha_validacion = case when a.porcentaje >= 100 then now() else fecha_validacion end,
      validado_por = case when a.porcentaje >= 100 then p_actor else validado_por end, updated_at = now() where id = t.id;
    insert into tareas_eventos(tarea_id, actor_id, actor_tipo, estado_anterior, estado_nuevo, metadata)
      values (t.id, p_actor, 'CLIENTE', t.estado::text, v_estado_nuevo::text, jsonb_build_object('avance_id', a.id, 'porcentaje', a.porcentaje, 'origen', 'circuito'));
  else
    perform circ_fail('GR422', 'Decisión inválida');
  end if;
  perform circ_evento(a.obra_id, p_actor, 'avance_' || case when p_decision = 'aceptar' then 'aceptado' else 'observado' end, 'avance', a.id,
    jsonb_build_object('tarea_id', a.tarea_id, 'porcentaje', a.porcentaje, 'observacion', p_observacion));
  return circ_idem_end(p_actor, 'avance_revisar', p_idem, jsonb_build_object('avance_id', a.id, 'estado', case when p_decision = 'aceptar' then 'aceptado' else 'observado' end, 'porcentaje', a.porcentaje));
end $$;

-- ═════════════════════════ CERTIFICACIÓN Y PAGO
-- Avance físico aceptado de un ítem de contrato: promedio de sus tareas ponderado por cantidad.
create or replace function public.circ_avance_fisico_item(p_item uuid) returns numeric
language sql stable set search_path = public as $$
  select coalesce(round(sum(pt.cantidad * coalesce(t.avance, 0)) / nullif(sum(pt.cantidad), 0), 2), 0)
  from contrato_items ci join partida_tareas pt on pt.pliego_id = ci.pliego_id and pt.partida_codigo = ci.partida_codigo
    join tareas t on t.id = pt.tarea_id where ci.id = p_item;
$$;
create or replace function public.circ_certificado_cargar_items(p_certificado uuid, p_contrato uuid, p_items jsonb) returns numeric
language plpgsql set search_path = public as $$
declare x jsonb; ci contrato_items; v_prev numeric; v_fis numeric; v_pct numeric; v_bruto numeric := 0; v_monto numeric; v_cert numeric;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then perform circ_fail('GR422', 'El certificado necesita ítems'); end if;
  delete from certificado_items where certificado_id = p_certificado;
  for x in select * from jsonb_array_elements(p_items) loop
    select * into ci from contrato_items where id = (x->>'contrato_item_id')::uuid and contrato_id = p_contrato;
    if not found then perform circ_fail('GR422', 'Ítem ajeno al contrato'); end if;
    v_pct := (x->>'porcentaje_acumulado')::numeric;
    select coalesce(max(i.porcentaje_acumulado), 0), coalesce(sum(i.monto), 0) into v_prev, v_cert from certificado_items i
      join certificados ce on ce.id = i.certificado_id where i.contrato_item_id = ci.id and ce.estado = 'aprobado';
    v_fis := circ_avance_fisico_item(ci.id);
    if v_pct is null or v_pct <= v_prev then perform circ_fail('GR422', 'Partida ' || ci.partida_codigo || ': ya está certificado ' || v_prev || '%'); end if;
    if v_pct > v_fis then perform circ_fail('GR422', 'Partida ' || ci.partida_codigo || ': se quiere certificar ' || v_pct || '% pero el avance físico aceptado es ' || v_fis || '%'); end if;
    -- Acumulado a valor vigente menos lo ya certificado: absorbe adendas sin duplicar ni perder importes.
    v_monto := greatest(round(ci.subtotal * v_pct / 100, 2) - v_cert, 0);
    insert into certificado_items(certificado_id, contrato_item_id, porcentaje_acumulado, porcentaje_anterior, monto) values (p_certificado, ci.id, v_pct, v_prev, v_monto);
    v_bruto := v_bruto + v_monto;
  end loop;
  if v_bruto <= 0 then perform circ_fail('GR422', 'El certificado no tiene importe'); end if;
  return v_bruto;
end $$;

create or replace function public.circ_certificado_presentar(p_actor uuid, p_contrato uuid, p_fecha date, p_items jsonb, p_nota text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; c contratos; v_id uuid; v_num int; v_bruto numeric; v_ret numeric;
begin
  select * into c from contratos where id = p_contrato for update;
  if not found then perform circ_fail('GR404', 'Contrato no encontrado'); end if;
  if not exists (select 1 from socios where id = c.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista del contrato puede presentar certificados');
  end if;
  v := circ_idem_begin(p_actor, 'certificado_presentar', p_idem, c.obra_id); if v is not null then return v; end if;
  if c.estado <> 'vigente' then perform circ_fail('GR409', 'El contrato no está vigente'); end if;
  if exists (select 1 from certificados where contrato_id = c.id and estado in ('presentado', 'rechazado')) then
    perform circ_fail('GR409', 'Ya hay un certificado abierto para este contrato; corregilo o esperá su revisión');
  end if;
  select coalesce(max(numero), 0) + 1 into v_num from certificados where contrato_id = c.id;
  insert into certificados(obra_id, contrato_id, numero, fecha, monto_bruto, retencion, monto_neto, nota, presentado_por)
    values (c.obra_id, c.id, v_num, p_fecha, 0, 0, 0, coalesce(p_nota, ''), p_actor) returning id into v_id;
  v_bruto := circ_certificado_cargar_items(v_id, c.id, p_items);
  v_ret := round(v_bruto * c.retencion_pct / 100, 2);
  update certificados set monto_bruto = v_bruto, retencion = v_ret, monto_neto = v_bruto - v_ret where id = v_id;
  insert into certificado_historial(certificado_id, version, accion, actor, nota, snapshot)
    values (v_id, 1, 'presentado', p_actor, coalesce(p_nota, ''), jsonb_build_object('items', p_items, 'monto_bruto', v_bruto, 'monto_neto', v_bruto - v_ret));
  perform circ_evento(c.obra_id, p_actor, 'certificado_presentado', 'certificado', v_id, jsonb_build_object('numero', v_num, 'monto_neto', v_bruto - v_ret));
  return circ_idem_end(p_actor, 'certificado_presentar', p_idem, jsonb_build_object('certificado_id', v_id, 'numero', v_num, 'version', 1,
    'monto_bruto', v_bruto, 'retencion', v_ret, 'monto_neto', v_bruto - v_ret));
end $$;

create or replace function public.circ_certificado_corregir(p_actor uuid, p_certificado uuid, p_items jsonb, p_nota text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; ce certificados; c contratos; v_bruto numeric; v_ret numeric;
begin
  select * into ce from certificados where id = p_certificado for update;
  if not found then perform circ_fail('GR404', 'Certificado no encontrado'); end if;
  select * into c from contratos where id = ce.contrato_id;
  if not exists (select 1 from socios where id = c.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Solo el contratista del contrato puede corregir el certificado');
  end if;
  v := circ_idem_begin(p_actor, 'certificado_corregir', p_idem, ce.obra_id); if v is not null then return v; end if;
  if ce.estado <> 'rechazado' then perform circ_fail('GR409', 'Solo se corrige un certificado rechazado (estado: ' || ce.estado || ')'); end if;
  v_bruto := circ_certificado_cargar_items(ce.id, c.id, p_items);
  v_ret := round(v_bruto * c.retencion_pct / 100, 2);
  update certificados set estado = 'presentado', version = version + 1, monto_bruto = v_bruto, retencion = v_ret, monto_neto = v_bruto - v_ret,
    nota = coalesce(p_nota, nota), updated_at = now() where id = ce.id;
  insert into certificado_historial(certificado_id, version, accion, actor, nota, snapshot)
    values (ce.id, ce.version + 1, 'corregido', p_actor, coalesce(p_nota, ''), jsonb_build_object('items', p_items, 'monto_bruto', v_bruto, 'monto_neto', v_bruto - v_ret,
      'motivo_rechazo_previo', ce.motivo_rechazo));
  perform circ_evento(ce.obra_id, p_actor, 'certificado_corregido', 'certificado', ce.id, jsonb_build_object('version', ce.version + 1));
  return circ_idem_end(p_actor, 'certificado_corregir', p_idem, jsonb_build_object('certificado_id', ce.id, 'version', ce.version + 1, 'estado', 'presentado', 'monto_neto', v_bruto - v_ret));
end $$;

create or replace function public.circ_certificado_revisar(p_actor uuid, p_certificado uuid, p_decision text, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; ce certificados; c contratos; v_estado text;
begin
  select * into ce from certificados where id = p_certificado for update;
  if not found then perform circ_fail('GR404', 'Certificado no encontrado'); end if;
  select * into c from contratos where id = ce.contrato_id;
  -- Primero la incompatibilidad: quien ejecuta no certifica su propio trabajo, tenga el rol que tenga.
  if exists (select 1 from socios where id = c.socio_id and user_id = p_actor) then
    perform circ_fail('42501', 'Un contratista no puede aprobar ni rechazar su propio certificado');
  end if;
  perform circ_req_responsable(ce.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'certificado_revisar', p_idem, ce.obra_id); if v is not null then return v; end if;
  if ce.estado <> 'presentado' then perform circ_fail('GR409', 'El certificado no está pendiente de revisión (estado: ' || ce.estado || ')'); end if;
  if p_decision = 'rechazar' then
    if coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'El rechazo necesita un motivo'); end if;
    v_estado := 'rechazado';
  elsif p_decision = 'aprobar' then
    if not exists (select 1 from evidencias_obra where entidad = 'certificado' and entidad_id = ce.id and version = ce.version) then
      perform circ_fail('GR422', 'No se puede aprobar un certificado sin evidencia en su versión vigente');
    end if;
    v_estado := 'aprobado';
  else
    perform circ_fail('GR422', 'Decisión inválida');
  end if;
  update certificados set estado = v_estado, motivo_rechazo = case when v_estado = 'rechazado' then trim(p_motivo) else motivo_rechazo end,
    revisado_por = p_actor, updated_at = now() where id = ce.id;
  insert into certificado_historial(certificado_id, version, accion, actor, nota, snapshot)
    values (ce.id, ce.version, v_estado, p_actor, coalesce(p_motivo, ''), jsonb_build_object('monto_neto', ce.monto_neto,
      'evidencias', (select count(*) from evidencias_obra where entidad = 'certificado' and entidad_id = ce.id and version = ce.version)));
  perform circ_evento(ce.obra_id, p_actor, 'certificado_' || v_estado, 'certificado', ce.id, jsonb_build_object('version', ce.version, 'motivo', p_motivo));
  return circ_idem_end(p_actor, 'certificado_revisar', p_idem, jsonb_build_object('certificado_id', ce.id, 'estado', v_estado, 'version', ce.version));
end $$;

create or replace function public.circ_pago_certificado(p_actor uuid, p_certificado uuid, p_idem text default null, p_fecha date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; ce certificados; c contratos; oc obra_circuito; v_caja numeric; v_pago uuid;
begin
  select * into ce from certificados where id = p_certificado;
  if not found then perform circ_fail('GR404', 'Certificado no encontrado'); end if;
  perform circ_req_responsable(ce.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'pago_certificado', p_idem, ce.obra_id); if v is not null then return v; end if;
  oc := circ_lock_obra(ce.obra_id);
  select * into ce from certificados where id = p_certificado for update;
  select * into c from contratos where id = ce.contrato_id;
  if ce.estado <> 'aprobado' then perform circ_fail('GR409', 'Solo se paga un certificado aprobado (estado: ' || ce.estado || ')'); end if;
  -- Un certificado, un pago: si ya existe se devuelve el mismo, sin mover caja.
  select id into v_pago from pagos_obra where certificado_id = ce.id;
  if v_pago is not null then
    return circ_idem_end(p_actor, 'pago_certificado', p_idem, jsonb_build_object('pago_id', v_pago, 'certificado_id', ce.id, 'monto', ce.monto_neto, 'ya_pagado', true));
  end if;
  v_caja := circ_caja(ce.obra_id);
  if v_caja - ce.monto_neto < oc.reserva_objetivo then
    perform circ_fail('GR409', 'FONDOS_INSUFICIENTES: caja ' || v_caja || ', reserva ' || oc.reserva_objetivo || ', pago ' || ce.monto_neto);
  end if;
  insert into pagos_obra(obra_id, certificado_id, contrato_id, socio_id, monto, pagado_por, fecha) values (ce.obra_id, ce.id, c.id, c.socio_id, ce.monto_neto, p_actor, coalesce(p_fecha, current_date)) returning id into v_pago;
  insert into caja_movimientos(obra_id, tipo, monto, ref_id, descripcion, fecha) values (ce.obra_id, 'pago_certificado', -ce.monto_neto, ce.id, 'Certificado N° ' || ce.numero, coalesce(p_fecha, current_date));
  insert into certificado_historial(certificado_id, version, accion, actor, snapshot) values (ce.id, ce.version, 'pagado', p_actor, jsonb_build_object('pago_id', v_pago, 'monto', ce.monto_neto));
  perform circ_evento(ce.obra_id, p_actor, 'certificado_pagado', 'pago', v_pago, jsonb_build_object('certificado_id', ce.id, 'monto', ce.monto_neto, 'caja_despues', v_caja - ce.monto_neto));
  return circ_idem_end(p_actor, 'pago_certificado', p_idem, jsonb_build_object('pago_id', v_pago, 'certificado_id', ce.id, 'monto', ce.monto_neto, 'ya_pagado', false, 'caja_despues', v_caja - ce.monto_neto));
end $$;

create or replace function public.circ_costo_registrar(p_actor uuid, p_obra uuid, p_tipo text, p_descripcion text, p_monto numeric, p_fecha date, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; v_id uuid;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'costo_registrar', p_idem, p_obra); if v is not null then return v; end if;
  insert into obra_costos(obra_id, tipo, descripcion, monto, fecha_prevista, created_by) values (p_obra, p_tipo, trim(p_descripcion), p_monto, p_fecha, p_actor)
    on conflict (obra_id, tipo, descripcion) do update set monto = excluded.monto, fecha_prevista = excluded.fecha_prevista
    where obra_costos.estado = 'previsto' returning id into v_id;
  if v_id is null then perform circ_fail('GR409', 'Ese costo ya fue pagado y no se puede modificar'); end if;
  perform circ_evento(p_obra, p_actor, 'costo_registrado', 'costo', v_id, jsonb_build_object('tipo', p_tipo, 'monto', p_monto));
  return circ_idem_end(p_actor, 'costo_registrar', p_idem, jsonb_build_object('costo_id', v_id, 'tipo', p_tipo, 'monto', p_monto));
end $$;

create or replace function public.circ_costo_pagar(p_actor uuid, p_costo uuid, p_idem text default null, p_fecha date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; k obra_costos; oc obra_circuito; v_caja numeric;
begin
  select * into k from obra_costos where id = p_costo;
  if not found then perform circ_fail('GR404', 'Costo no encontrado'); end if;
  perform circ_req_responsable(k.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'costo_pagar', p_idem, k.obra_id); if v is not null then return v; end if;
  oc := circ_lock_obra(k.obra_id);
  select * into k from obra_costos where id = p_costo for update;
  if k.estado = 'pagado' then
    return circ_idem_end(p_actor, 'costo_pagar', p_idem, jsonb_build_object('costo_id', k.id, 'monto', k.monto, 'ya_pagado', true));
  end if;
  v_caja := circ_caja(k.obra_id);
  if v_caja - k.monto < oc.reserva_objetivo then
    perform circ_fail('GR409', 'FONDOS_INSUFICIENTES: caja ' || v_caja || ', reserva ' || oc.reserva_objetivo || ', pago ' || k.monto);
  end if;
  update obra_costos set estado = 'pagado', pagado_at = now() where id = k.id;
  insert into caja_movimientos(obra_id, tipo, monto, ref_id, descripcion, fecha) values (k.obra_id, 'pago_costo', -k.monto, k.id, k.tipo || ': ' || k.descripcion, coalesce(p_fecha, current_date));
  perform circ_evento(k.obra_id, p_actor, 'costo_pagado', 'costo', k.id, jsonb_build_object('tipo', k.tipo, 'monto', k.monto, 'caja_despues', v_caja - k.monto));
  return circ_idem_end(p_actor, 'costo_pagar', p_idem, jsonb_build_object('costo_id', k.id, 'monto', k.monto, 'ya_pagado', false, 'caja_despues', v_caja - k.monto));
end $$;

create or replace function public.circ_reserva_ajustar(p_actor uuid, p_obra uuid, p_monto numeric, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; oc obra_circuito;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'reserva_ajustar', p_idem, p_obra); if v is not null then return v; end if;
  if p_monto is null or p_monto < 0 or coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'Monto y motivo son obligatorios'); end if;
  oc := circ_lock_obra(p_obra);
  update obra_circuito set reserva_objetivo = p_monto, updated_at = now() where obra_id = p_obra;
  perform circ_evento(p_obra, p_actor, 'reserva_ajustada', 'obra', p_obra, jsonb_build_object('anterior', oc.reserva_objetivo, 'nueva', p_monto, 'motivo', p_motivo));
  return circ_idem_end(p_actor, 'reserva_ajustar', p_idem, jsonb_build_object('reserva_anterior', oc.reserva_objetivo, 'reserva', p_monto));
end $$;
