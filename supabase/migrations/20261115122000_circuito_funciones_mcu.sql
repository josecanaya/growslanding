-- Funciones del circuito (parte 2): rondas MCU, suscripciones, posiciones, mercado secundario,
-- distribuciones y estado financiero de la obra. Dinero FICTICIO de ensayo.
-- Reglas que este archivo garantiza:
--   · Lo prometido no es caja: solo una suscripción integrada y una ronda cerrada con éxito aportan a la obra.
--   · Comprar una MCU existente transfiere la posición y el dinero va al vendedor; la caja de obra no cambia.
--   · No hay salida garantizada: una orden de venta queda abierta hasta que exista comprador.

create or replace function public.circ_mcu_emitidas(p_obra uuid) returns integer
language sql stable set search_path = public as $$
  select coalesce(sum(cantidad), 0)::int from mcu_posiciones where obra_id = p_obra;
$$;

create or replace function public.circ_ronda_crear(p_actor uuid, p_obra uuid, p_datos jsonb, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; oc obra_circuito; v_id uuid; v_num int; v_prev int;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'ronda_crear', p_idem, p_obra); if v is not null then return v; end if;
  oc := circ_lock_obra(p_obra);
  if oc.estado in ('en_cierre', 'cerrada') then perform circ_fail('GR409', 'La obra está en cierre: no admite rondas nuevas'); end if;
  if exists (select 1 from mcu_rondas where obra_id = p_obra and estado in ('programada', 'abierta')) then
    perform circ_fail('GR409', 'Ya hay una ronda programada o abierta');
  end if;
  if coalesce(p_datos->>'condiciones_salida', '') = '' or coalesce(p_datos->>'que_se_compra', '') = '' or jsonb_typeof(p_datos->'destino_fondos') is distinct from 'array' then
    perform circ_fail('GR422', 'La ronda debe declarar qué se compra, el destino de los fondos y las condiciones de salida');
  end if;
  if p_datos ? 'simbolo' then update obra_circuito set mcu_simbolo = coalesce(mcu_simbolo, p_datos->>'simbolo') where obra_id = p_obra; end if;
  select coalesce(max(numero), 0) + 1 into v_num from mcu_rondas where obra_id = p_obra;
  v_prev := circ_mcu_emitidas(p_obra);
  insert into mcu_rondas(obra_id, numero, valuacion_pre, precio_mcu, mcu_ofrecidas, minimo_mcu, umbral_mcu, fecha_apertura, fecha_cierre,
      destino_fondos, que_se_compra, condiciones_salida, necesidad_fondos, mcu_previas, created_by)
    values (p_obra, v_num, (p_datos->>'valuacion_pre')::numeric, (p_datos->>'precio_mcu')::numeric, (p_datos->>'mcu_ofrecidas')::int,
      coalesce((p_datos->>'minimo_mcu')::int, 1), (p_datos->>'umbral_mcu')::int, (p_datos->>'fecha_apertura')::date, (p_datos->>'fecha_cierre')::date,
      p_datos->'destino_fondos', p_datos->>'que_se_compra', p_datos->>'condiciones_salida', coalesce(p_datos->'necesidad_fondos', '{}'::jsonb), v_prev, p_actor)
    returning id into v_id;
  perform circ_evento(p_obra, p_actor, 'ronda_creada', 'ronda', v_id, jsonb_build_object('numero', v_num, 'precio_mcu', p_datos->'precio_mcu', 'mcu_ofrecidas', p_datos->'mcu_ofrecidas', 'mcu_previas', v_prev));
  return circ_idem_end(p_actor, 'ronda_crear', p_idem, jsonb_build_object('ronda_id', v_id, 'numero', v_num, 'mcu_previas', v_prev));
end $$;

create or replace function public.circ_ronda_abrir(p_actor uuid, p_ronda uuid, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r mcu_rondas;
begin
  select * into r from mcu_rondas where id = p_ronda for update;
  if not found then perform circ_fail('GR404', 'Ronda no encontrada'); end if;
  perform circ_req_responsable(r.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'ronda_abrir', p_idem, r.obra_id); if v is not null then return v; end if;
  if r.estado <> 'programada' then perform circ_fail('GR409', 'La ronda no está programada (estado: ' || r.estado || ')'); end if;
  update mcu_rondas set estado = 'abierta' where id = r.id;
  perform circ_evento(r.obra_id, p_actor, 'ronda_abierta', 'ronda', r.id, jsonb_build_object('numero', r.numero));
  return circ_idem_end(p_actor, 'ronda_abrir', p_idem, jsonb_build_object('ronda_id', r.id, 'estado', 'abierta'));
end $$;

-- Suscripción: compromiso SIN dinero. No reserva cupo ni cuenta como caja.
create or replace function public.circ_suscribir(p_actor uuid, p_ronda uuid, p_mcu int, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r mcu_rondas; v_id uuid;
begin
  select * into r from mcu_rondas where id = p_ronda;
  if not found then perform circ_fail('GR404', 'Ronda no encontrada'); end if;
  v := circ_idem_begin(p_actor, 'suscribir', p_idem, r.obra_id); if v is not null then return v; end if;
  if r.estado <> 'abierta' then perform circ_fail('GR409', 'La ronda no está abierta (estado: ' || r.estado || ')'); end if;
  if circ_es_responsable(r.obra_id, p_actor) then perform circ_fail('42501', 'El responsable de la obra no puede suscribir su propia ronda'); end if;
  if coalesce(p_mcu, 0) < r.minimo_mcu then perform circ_fail('GR422', 'El aporte mínimo es de ' || r.minimo_mcu || ' MCU (' || r.minimo_mcu * r.precio_mcu || ')'); end if;
  if p_mcu > r.mcu_ofrecidas then perform circ_fail('GR422', 'La ronda ofrece ' || r.mcu_ofrecidas || ' MCU'); end if;
  insert into mcu_suscripciones(ronda_id, obra_id, user_id, mcu, monto) values (r.id, r.obra_id, p_actor, p_mcu, p_mcu * r.precio_mcu) returning id into v_id;
  perform circ_evento(r.obra_id, p_actor, 'suscripcion_prometida', 'suscripcion', v_id, jsonb_build_object('mcu', p_mcu, 'monto', p_mcu * r.precio_mcu));
  return circ_idem_end(p_actor, 'suscribir', p_idem, jsonb_build_object('suscripcion_id', v_id, 'estado', 'prometida', 'mcu', p_mcu, 'monto', p_mcu * r.precio_mcu));
end $$;

-- Integración: el dinero ficticio sale de la cuenta del inversor y queda en custodia de la ronda.
create or replace function public.circ_suscripcion_integrar(p_actor uuid, p_suscripcion uuid, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s mcu_suscripciones; r mcu_rondas; v_int int; v_saldo numeric;
begin
  select * into s from mcu_suscripciones where id = p_suscripcion;
  if not found then perform circ_fail('GR404', 'Suscripción no encontrada'); end if;
  if s.user_id <> p_actor then perform circ_fail('42501', 'La suscripción es de otro inversor'); end if;
  v := circ_idem_begin(p_actor, 'suscripcion_integrar', p_idem, s.obra_id); if v is not null then return v; end if;
  select * into r from mcu_rondas where id = s.ronda_id for update;
  select * into s from mcu_suscripciones where id = p_suscripcion for update;
  if s.estado <> 'prometida' then perform circ_fail('GR409', 'La suscripción no está pendiente de integración (estado: ' || s.estado || ')'); end if;
  if r.estado <> 'abierta' then perform circ_fail('GR409', 'La ronda ya no está abierta'); end if;
  select coalesce(sum(mcu), 0) into v_int from mcu_suscripciones where ronda_id = r.id and estado = 'integrada';
  if v_int + s.mcu > r.mcu_ofrecidas then perform circ_fail('GR409', 'CUPO_AGOTADO: quedan ' || (r.mcu_ofrecidas - v_int) || ' MCU en la ronda'); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text, 7));
  v_saldo := circ_saldo_inversor(p_actor);
  if v_saldo < s.monto then perform circ_fail('GR409', 'SALDO_INSUFICIENTE: saldo ' || v_saldo || ', a integrar ' || s.monto); end if;
  insert into inversor_cuenta_movimientos(user_id, tipo, monto, obra_id, ref_id, descripcion) values (p_actor, 'integracion', -s.monto, s.obra_id, s.id, 'Integración ronda ' || r.numero);
  update mcu_suscripciones set estado = 'integrada', integrada_at = now() where id = s.id;
  perform circ_evento(s.obra_id, p_actor, 'suscripcion_integrada', 'suscripcion', s.id, jsonb_build_object('mcu', s.mcu, 'monto', s.monto));
  return circ_idem_end(p_actor, 'suscripcion_integrar', p_idem, jsonb_build_object('suscripcion_id', s.id, 'estado', 'integrada', 'monto', s.monto, 'saldo_despues', v_saldo - s.monto));
end $$;

create or replace function public.circ_suscripcion_cancelar(p_actor uuid, p_suscripcion uuid, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; s mcu_suscripciones;
begin
  select * into s from mcu_suscripciones where id = p_suscripcion for update;
  if not found then perform circ_fail('GR404', 'Suscripción no encontrada'); end if;
  if s.user_id <> p_actor then perform circ_fail('42501', 'La suscripción es de otro inversor'); end if;
  v := circ_idem_begin(p_actor, 'suscripcion_cancelar', p_idem, s.obra_id); if v is not null then return v; end if;
  -- Supuesto de ensayo: lo integrado queda en custodia hasta que la ronda se resuelva.
  if s.estado <> 'prometida' then perform circ_fail('GR409', 'Solo se cancela un compromiso no integrado (estado: ' || s.estado || ')'); end if;
  update mcu_suscripciones set estado = 'cancelada', resuelta_at = now() where id = s.id;
  perform circ_evento(s.obra_id, p_actor, 'suscripcion_cancelada', 'suscripcion', s.id);
  return circ_idem_end(p_actor, 'suscripcion_cancelar', p_idem, jsonb_build_object('suscripcion_id', s.id, 'estado', 'cancelada'));
end $$;

-- Resolución de una ronda (uso interno): éxito si lo INTEGRADO alcanza el umbral; si no, falla y se devuelve todo.
create or replace function public.circ_ronda_resolver(p_actor uuid, p_ronda uuid, p_forzar_falla boolean, p_fecha date default null) returns jsonb
language plpgsql set search_path = public as $$
declare r mcu_rondas; s mcu_suscripciones; v_int int; v_monto numeric; v_prom int; v_exito boolean;
begin
  select * into r from mcu_rondas where id = p_ronda for update;
  select coalesce(sum(mcu), 0), coalesce(sum(monto), 0) into v_int, v_monto from mcu_suscripciones where ronda_id = r.id and estado = 'integrada';
  select coalesce(sum(mcu), 0) into v_prom from mcu_suscripciones where ronda_id = r.id and estado = 'prometida';
  v_exito := not p_forzar_falla and v_int >= r.umbral_mcu;
  if v_exito then
    for s in select * from mcu_suscripciones where ronda_id = r.id and estado = 'integrada' order by integrada_at, id loop
      insert into mcu_posiciones(obra_id, user_id, cantidad, costo_total) values (r.obra_id, s.user_id, s.mcu, s.monto)
        on conflict (obra_id, user_id) do update set cantidad = mcu_posiciones.cantidad + excluded.cantidad,
          costo_total = mcu_posiciones.costo_total + excluded.costo_total, updated_at = now();
      insert into mcu_movimientos(obra_id, user_id, tipo, cantidad, precio_mcu, ref_id) values (r.obra_id, s.user_id, 'emision', s.mcu, r.precio_mcu, s.id);
      update mcu_suscripciones set estado = 'asignada', resuelta_at = now() where id = s.id;
    end loop;
    -- Recién acá el dinero pasa a ser caja de la obra.
    insert into caja_movimientos(obra_id, tipo, monto, ref_id, descripcion, fecha) values (r.obra_id, 'aporte_ronda', v_monto, r.id, 'Cierre ronda ' || r.numero, coalesce(p_fecha, current_date));
    update mcu_rondas set estado = 'cerrada_exitosa', cerrada_at = now() where id = r.id;
  else
    for s in select * from mcu_suscripciones where ronda_id = r.id and estado = 'integrada' loop
      insert into inversor_cuenta_movimientos(user_id, tipo, monto, obra_id, ref_id, descripcion) values (s.user_id, 'devolucion', s.monto, r.obra_id, s.id, 'Devolución ronda ' || r.numero || ' fallida');
      update mcu_suscripciones set estado = 'devuelta', resuelta_at = now() where id = s.id;
    end loop;
    update mcu_rondas set estado = case when p_forzar_falla then 'cancelada' else 'fallida' end, cerrada_at = now() where id = r.id;
  end if;
  update mcu_suscripciones set estado = 'cancelada', resuelta_at = now() where ronda_id = r.id and estado = 'prometida';
  perform circ_evento(r.obra_id, p_actor, case when v_exito then 'ronda_cerrada_exitosa' else 'ronda_fallida' end, 'ronda', r.id,
    jsonb_build_object('numero', r.numero, 'mcu_integradas', v_int, 'umbral_mcu', r.umbral_mcu, 'mcu_ofrecidas', r.mcu_ofrecidas,
      'monto_integrado', v_monto, 'mcu_prometidas_sin_integrar', v_prom));
  return jsonb_build_object('ronda_id', r.id, 'numero', r.numero, 'resultado', case when v_exito then 'cerrada_exitosa' when p_forzar_falla then 'cancelada' else 'fallida' end,
    'mcu_asignadas', case when v_exito then v_int else 0 end, 'caja_aportada', case when v_exito then v_monto else 0 end,
    'devuelto', case when v_exito then 0 else v_monto end, 'mcu_prometidas_no_contadas', v_prom, 'mcu_sin_colocar', r.mcu_ofrecidas - v_int,
    'completa', v_exito and v_int = r.mcu_ofrecidas);
end $$;

create or replace function public.circ_ronda_cerrar(p_actor uuid, p_ronda uuid, p_idem text default null, p_fecha date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; r mcu_rondas;
begin
  select * into r from mcu_rondas where id = p_ronda;
  if not found then perform circ_fail('GR404', 'Ronda no encontrada'); end if;
  perform circ_req_responsable(r.obra_id, p_actor);
  v := circ_idem_begin(p_actor, 'ronda_cerrar', p_idem, r.obra_id); if v is not null then return v; end if;
  perform circ_lock_obra(r.obra_id);
  select * into r from mcu_rondas where id = p_ronda for update;
  if r.estado <> 'abierta' then perform circ_fail('GR409', 'La ronda no está abierta (estado: ' || r.estado || ')'); end if;
  return circ_idem_end(p_actor, 'ronda_cerrar', p_idem, circ_ronda_resolver(p_actor, p_ronda, false, p_fecha));
end $$;

-- ═════════════════════════ MERCADO SECUNDARIO (transferencia entre inversores)
create or replace function public.circ_orden_venta_crear(p_actor uuid, p_obra uuid, p_cantidad int, p_precio numeric, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; p mcu_posiciones; v_ofrecidas int; v_id uuid;
begin
  v := circ_idem_begin(p_actor, 'orden_venta_crear', p_idem, p_obra); if v is not null then return v; end if;
  select * into p from mcu_posiciones where obra_id = p_obra and user_id = p_actor for update;
  if not found or p.cantidad = 0 then perform circ_fail('42501', 'No tenés MCU de esta obra'); end if;
  select coalesce(sum(cantidad), 0) into v_ofrecidas from mcu_ordenes_venta where obra_id = p_obra and vendedor = p_actor and estado = 'abierta';
  if coalesce(p_cantidad, 0) <= 0 or p_cantidad > p.cantidad - v_ofrecidas then
    perform circ_fail('GR422', 'Podés ofrecer hasta ' || (p.cantidad - v_ofrecidas) || ' MCU');
  end if;
  if coalesce(p_precio, 0) <= 0 then perform circ_fail('GR422', 'Precio inválido'); end if;
  insert into mcu_ordenes_venta(obra_id, vendedor, cantidad, precio_mcu) values (p_obra, p_actor, p_cantidad, p_precio) returning id into v_id;
  perform circ_evento(p_obra, p_actor, 'orden_venta_creada', 'orden_venta', v_id, jsonb_build_object('cantidad', p_cantidad, 'precio_mcu', p_precio));
  return circ_idem_end(p_actor, 'orden_venta_crear', p_idem, jsonb_build_object('orden_id', v_id, 'estado', 'abierta', 'cantidad', p_cantidad, 'precio_mcu', p_precio,
    'aviso', 'La venta depende de que exista un comprador; no hay salida garantizada.'));
end $$;

create or replace function public.circ_orden_venta_cancelar(p_actor uuid, p_orden uuid, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; o mcu_ordenes_venta;
begin
  select * into o from mcu_ordenes_venta where id = p_orden for update;
  if not found then perform circ_fail('GR404', 'Orden no encontrada'); end if;
  if o.vendedor <> p_actor then perform circ_fail('42501', 'La orden es de otro inversor'); end if;
  v := circ_idem_begin(p_actor, 'orden_venta_cancelar', p_idem, o.obra_id); if v is not null then return v; end if;
  if o.estado <> 'abierta' then perform circ_fail('GR409', 'La orden ya no está abierta'); end if;
  update mcu_ordenes_venta set estado = 'cancelada', resuelta_at = now() where id = o.id;
  perform circ_evento(o.obra_id, p_actor, 'orden_venta_cancelada', 'orden_venta', o.id);
  return circ_idem_end(p_actor, 'orden_venta_cancelar', p_idem, jsonb_build_object('orden_id', o.id, 'estado', 'cancelada'));
end $$;

create or replace function public.circ_orden_venta_comprar(p_actor uuid, p_orden uuid, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; o mcu_ordenes_venta; pv mcu_posiciones; v_monto numeric; v_saldo numeric; v_costo numeric; v_caja_antes numeric;
begin
  select * into o from mcu_ordenes_venta where id = p_orden;
  if not found then perform circ_fail('GR404', 'Orden no encontrada'); end if;
  v := circ_idem_begin(p_actor, 'orden_venta_comprar', p_idem, o.obra_id); if v is not null then return v; end if;
  select * into o from mcu_ordenes_venta where id = p_orden for update;
  if o.estado <> 'abierta' then perform circ_fail('GR409', 'La orden ya no está disponible (estado: ' || o.estado || ')'); end if;
  if o.vendedor = p_actor then perform circ_fail('GR422', 'No podés comprar tu propia orden'); end if;
  if circ_es_responsable(o.obra_id, p_actor) then perform circ_fail('42501', 'El responsable de la obra no opera MCU de su propia obra'); end if;
  -- Bloqueos en orden estable para evitar interbloqueos entre compras cruzadas.
  perform pg_advisory_xact_lock(hashtextextended(least(o.vendedor, p_actor)::text, 7));
  perform pg_advisory_xact_lock(hashtextextended(greatest(o.vendedor, p_actor)::text, 7));
  select * into pv from mcu_posiciones where obra_id = o.obra_id and user_id = o.vendedor for update;
  if pv.cantidad < o.cantidad then perform circ_fail('GR409', 'El vendedor ya no tiene esas MCU'); end if;
  v_monto := o.cantidad * o.precio_mcu;
  v_saldo := circ_saldo_inversor(p_actor);
  if v_saldo < v_monto then perform circ_fail('GR409', 'SALDO_INSUFICIENTE: saldo ' || v_saldo || ', compra ' || v_monto); end if;
  v_caja_antes := circ_caja(o.obra_id);
  v_costo := round(pv.costo_total * o.cantidad / pv.cantidad, 2);
  -- La posición cambia de titular…
  update mcu_posiciones set cantidad = cantidad - o.cantidad, costo_total = costo_total - v_costo,
    unidad_id = case when cantidad - o.cantidad = 0 then null else unidad_id end, updated_at = now() where id = pv.id;
  insert into mcu_posiciones(obra_id, user_id, cantidad, costo_total) values (o.obra_id, p_actor, o.cantidad, v_monto)
    on conflict (obra_id, user_id) do update set cantidad = mcu_posiciones.cantidad + excluded.cantidad, costo_total = mcu_posiciones.costo_total + excluded.costo_total, updated_at = now();
  insert into mcu_movimientos(obra_id, user_id, tipo, cantidad, precio_mcu, ref_id) values
    (o.obra_id, o.vendedor, 'transferencia_salida', -o.cantidad, o.precio_mcu, o.id), (o.obra_id, p_actor, 'transferencia_entrada', o.cantidad, o.precio_mcu, o.id);
  -- …y el dinero va del comprador al vendedor. No hay movimiento de caja de obra.
  insert into inversor_cuenta_movimientos(user_id, tipo, monto, obra_id, ref_id, descripcion) values
    (p_actor, 'compra_mcu', -v_monto, o.obra_id, o.id, 'Compra de ' || o.cantidad || ' MCU a otro inversor'),
    (o.vendedor, 'venta_mcu', v_monto, o.obra_id, o.id, 'Venta de ' || o.cantidad || ' MCU a otro inversor');
  update mcu_ordenes_venta set estado = 'ejecutada', comprador = p_actor, resuelta_at = now() where id = o.id;
  perform circ_evento(o.obra_id, p_actor, 'mcu_transferidas', 'orden_venta', o.id, jsonb_build_object('vendedor', o.vendedor, 'comprador', p_actor, 'cantidad', o.cantidad, 'monto', v_monto));
  return circ_idem_end(p_actor, 'orden_venta_comprar', p_idem, jsonb_build_object('orden_id', o.id, 'estado', 'ejecutada', 'cantidad', o.cantidad, 'monto', v_monto,
    'vendedor', o.vendedor, 'comprador', p_actor, 'caja_obra_antes', v_caja_antes, 'caja_obra_despues', circ_caja(o.obra_id)));
end $$;

create or replace function public.circ_posicion_vincular_unidad(p_actor uuid, p_obra uuid, p_unidad_codigo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; p mcu_posiciones; u obra_unidades;
begin
  v := circ_idem_begin(p_actor, 'posicion_vincular_unidad', p_idem, p_obra); if v is not null then return v; end if;
  select * into p from mcu_posiciones where obra_id = p_obra and user_id = p_actor for update;
  if not found or p.cantidad = 0 then perform circ_fail('42501', 'No tenés MCU de esta obra'); end if;
  select * into u from obra_unidades where obra_id = p_obra and codigo = p_unidad_codigo;
  if not found then perform circ_fail('GR404', 'Unidad no encontrada'); end if;
  if exists (select 1 from mcu_posiciones where unidad_id = u.id and id <> p.id) then perform circ_fail('GR409', 'La unidad ya está vinculada a otra posición'); end if;
  update mcu_posiciones set unidad_id = u.id, updated_at = now() where id = p.id;
  perform circ_evento(p_obra, p_actor, 'posicion_vinculada_unidad', 'posicion', p.id, jsonb_build_object('unidad', p_unidad_codigo));
  return circ_idem_end(p_actor, 'posicion_vincular_unidad', p_idem, jsonb_build_object('posicion_id', p.id, 'unidad_id', u.id, 'unidad', p_unidad_codigo));
end $$;

-- ═════════════════════════ DISTRIBUCIONES Y ESTADO FINANCIERO
-- Reparto a prorrata de MCU; los centavos sobrantes se asignan por mayor resto (orden estable).
create or replace function public.circ_distribucion_crear(p_actor uuid, p_obra uuid, p_monto numeric, p_concepto text, p_nota text, p_idem text default null, p_fecha date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; oc obra_circuito; v_total int; v_caja numeric; v_id uuid; v_resto int;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'distribucion_crear', p_idem, p_obra); if v is not null then return v; end if;
  oc := circ_lock_obra(p_obra);
  perform 1 from mcu_posiciones where obra_id = p_obra for update;
  v_total := circ_mcu_emitidas(p_obra);
  if v_total = 0 then perform circ_fail('GR409', 'No hay MCU emitidas'); end if;
  v_caja := circ_caja(p_obra);
  if coalesce(p_monto, 0) <= 0 then perform circ_fail('GR422', 'Monto inválido'); end if;
  if p_concepto = 'liquidacion' then
    if oc.estado <> 'en_cierre' then perform circ_fail('GR409', 'La liquidación solo procede con la obra en cierre'); end if;
    if exists (select 1 from certificados ce where ce.obra_id = p_obra and ce.estado = 'aprobado' and not exists (select 1 from pagos_obra pg where pg.certificado_id = ce.id)) then
      perform circ_fail('GR409', 'Hay certificados aprobados sin pagar: los contratistas cobran antes que los inversores');
    end if;
    if p_monto > v_caja then perform circ_fail('GR409', 'FONDOS_INSUFICIENTES: caja ' || v_caja); end if;
  elsif p_concepto = 'resultado' then
    if v_caja - p_monto < oc.reserva_objetivo then perform circ_fail('GR409', 'FONDOS_INSUFICIENTES: caja ' || v_caja || ', reserva ' || oc.reserva_objetivo); end if;
  else
    perform circ_fail('GR422', 'Concepto inválido');
  end if;
  insert into mcu_distribuciones(obra_id, concepto, monto_total, mcu_base, nota, created_by) values (p_obra, p_concepto, p_monto, v_total, coalesce(p_nota, ''), p_actor) returning id into v_id;
  insert into mcu_distribucion_pagos(distribucion_id, user_id, mcu, monto)
    select v_id, user_id, cantidad, floor(p_monto * 100 * cantidad / v_total) / 100 from mcu_posiciones where obra_id = p_obra and cantidad > 0;
  select round((p_monto - sum(monto)) * 100)::int into v_resto from mcu_distribucion_pagos where distribucion_id = v_id;
  update mcu_distribucion_pagos dp set monto = dp.monto + 0.01 from (
    select user_id from mcu_posiciones where obra_id = p_obra and cantidad > 0
    order by (p_monto * 100 * cantidad / v_total) - floor(p_monto * 100 * cantidad / v_total) desc, user_id limit v_resto) q
    where dp.distribucion_id = v_id and dp.user_id = q.user_id;
  insert into inversor_cuenta_movimientos(user_id, tipo, monto, obra_id, ref_id, descripcion)
    select user_id, 'distribucion', monto, p_obra, v_id, initcap(p_concepto) || ' a prorrata de MCU' from mcu_distribucion_pagos where distribucion_id = v_id and monto > 0;
  insert into caja_movimientos(obra_id, tipo, monto, ref_id, descripcion, fecha) values (p_obra, 'distribucion', -p_monto, v_id, initcap(p_concepto), coalesce(p_fecha, current_date));
  perform circ_evento(p_obra, p_actor, 'distribucion_' || p_concepto, 'distribucion', v_id, jsonb_build_object('monto', p_monto, 'mcu_base', v_total));
  return circ_idem_end(p_actor, 'distribucion_crear', p_idem, jsonb_build_object('distribucion_id', v_id, 'monto', p_monto, 'mcu_base', v_total,
    'pagos', (select jsonb_agg(jsonb_build_object('user_id', user_id, 'mcu', mcu, 'monto', monto) order by user_id) from mcu_distribucion_pagos where distribucion_id = v_id),
    'caja_despues', v_caja - p_monto));
end $$;

-- Cambios de estado de la obra ante falta de capital: reprogramar, entrar en cierre, cerrar o normalizar.
create or replace function public.circ_obra_estado(p_actor uuid, p_obra uuid, p_estado text, p_hasta date, p_motivo text, p_idem text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb; oc obra_circuito; r record; v_rondas jsonb := '[]'::jsonb;
begin
  perform circ_req_responsable(p_obra, p_actor);
  v := circ_idem_begin(p_actor, 'obra_estado', p_idem, p_obra); if v is not null then return v; end if;
  oc := circ_lock_obra(p_obra);
  if coalesce(trim(p_motivo), '') = '' then perform circ_fail('GR422', 'Indicá el motivo'); end if;
  if oc.estado = 'cerrada' then perform circ_fail('GR409', 'La obra ya está cerrada'); end if;
  if p_estado = 'reprogramada' then
    if p_hasta is null then perform circ_fail('GR422', 'Indicá hasta cuándo se reprograma'); end if;
    if oc.estado = 'en_cierre' then perform circ_fail('GR409', 'La obra está en cierre'); end if;
  elsif p_estado = 'en_cierre' then
    -- Las rondas vivas se cancelan y se devuelve lo integrado.
    for r in select id from mcu_rondas where obra_id = p_obra and estado in ('abierta', 'programada') loop
      v_rondas := v_rondas || circ_ronda_resolver(p_actor, r.id, true);
    end loop;
    update mcu_ordenes_venta set estado = 'cancelada', resuelta_at = now() where obra_id = p_obra and estado = 'abierta';
  elsif p_estado = 'cerrada' then
    if oc.estado <> 'en_cierre' then perform circ_fail('GR409', 'Primero hay que pasar por el proceso de cierre'); end if;
    if exists (select 1 from certificados ce where ce.obra_id = p_obra and (ce.estado in ('presentado', 'rechazado')
        or (ce.estado = 'aprobado' and not exists (select 1 from pagos_obra pg where pg.certificado_id = ce.id)))) then
      perform circ_fail('GR409', 'Quedan certificados sin resolver o sin pagar');
    end if;
    if circ_caja(p_obra) <> 0 then perform circ_fail('GR409', 'Queda caja sin liquidar: ' || circ_caja(p_obra)); end if;
    update contratos set estado = 'rescindido' where obra_id = p_obra and estado = 'vigente';
  elsif p_estado <> 'normal' then
    perform circ_fail('GR422', 'Estado inválido');
  elsif oc.estado = 'en_cierre' then
    perform circ_fail('GR409', 'Una obra en cierre no vuelve a estado normal');
  end if;
  update obra_circuito set estado = p_estado, reprogramada_hasta = case when p_estado = 'reprogramada' then p_hasta else null end,
    motivo_estado = trim(p_motivo), reserva_objetivo = case when p_estado = 'en_cierre' then 0 else reserva_objetivo end, updated_at = now() where obra_id = p_obra;
  perform circ_evento(p_obra, p_actor, 'obra_' || p_estado, 'obra', p_obra, jsonb_build_object('anterior', oc.estado, 'hasta', p_hasta, 'motivo', p_motivo, 'rondas', v_rondas));
  return circ_idem_end(p_actor, 'obra_estado', p_idem, jsonb_build_object('estado', p_estado, 'anterior', oc.estado, 'reprogramada_hasta', p_hasta, 'rondas_canceladas', v_rondas));
end $$;

-- ═════════════════════════ Limpieza selectiva (solo administración del entorno de pruebas)
create or replace function public.sim_limpiar_obra(p_obra uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_tareas int; v_nombre text;
begin
  select name into v_nombre from obras where id = p_obra;
  if v_nombre is null then return jsonb_build_object('obra_id', p_obra, 'existia', false); end if;
  if v_nombre not like '[SIM]%' then raise exception 'Solo se limpian obras de simulación (nombre con prefijo [SIM])'; end if;
  delete from circuito_idempotencia where obra_id = p_obra;
  delete from pagos_obra where obra_id = p_obra;
  delete from certificados where obra_id = p_obra;
  delete from avances where obra_id = p_obra;
  delete from contrato_adendas where obra_id = p_obra;
  delete from contrato_items where obra_id = p_obra;
  delete from contratos where obra_id = p_obra;
  delete from ofertas where obra_id = p_obra;
  delete from solicitudes_cotizacion where obra_id = p_obra;
  delete from mcu_posiciones where obra_id = p_obra;
  delete from pliego_partidas where obra_id = p_obra;
  delete from notificaciones where obra_id = p_obra;
  delete from tarea_precedencias where tarea_id in (select id from tareas where obra_id = p_obra) or depende_de in (select id from tareas where obra_id = p_obra);
  delete from tareas_eventos where tarea_id in (select id from tareas where obra_id = p_obra);
  delete from tareas_estados where tarea_id in (select id from tareas where obra_id = p_obra);
  delete from tareas where obra_id = p_obra;
  get diagnostics v_tareas = row_count;
  delete from obras where id = p_obra;
  return jsonb_build_object('obra_id', p_obra, 'existia', true, 'tareas_borradas', v_tareas);
end $$;

-- Las funciones solo son ejecutables por el backend (service_role); la API valida la sesión y pasa el actor.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'circ\_%' or p.proname like 'sim\_%') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;
