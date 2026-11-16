-- Lecturas auxiliares del circuito (solo backend).
create or replace function public.circ_tareas_bloqueos(p_obra uuid, p_fecha date)
returns table (tarea_id uuid, bloqueo text) language sql stable security definer set search_path = public as $$
  select pt.tarea_id, circ_tarea_bloqueo(pt.tarea_id, p_fecha) from partida_tareas pt where pt.obra_id = p_obra;
$$;
create or replace function public.circ_roles(p_obra uuid, p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'responsable', circ_es_responsable(p_obra, p_user),
    'coordinador', exists (select 1 from obra_participantes where obra_id = p_obra and user_id = p_user and rol = 'coordinador'),
    'auditor', exists (select 1 from obra_participantes where obra_id = p_obra and user_id = p_user and rol = 'auditor'),
    'socio_ids', coalesce((select jsonb_agg(id) from socios where user_id = p_user), '[]'::jsonb),
    'contratista', exists (select 1 from socios s where s.user_id = p_user and (
        exists (select 1 from contratos c where c.obra_id = p_obra and c.socio_id = s.id)
        or exists (select 1 from solicitud_invitados i join solicitudes_cotizacion q on q.id = i.solicitud_id where q.obra_id = p_obra and i.socio_id = s.id))),
    'inversor', exists (select 1 from mcu_posiciones where obra_id = p_obra and user_id = p_user)
        or exists (select 1 from mcu_suscripciones where obra_id = p_obra and user_id = p_user));
$$;
revoke all on function public.circ_tareas_bloqueos(uuid, date) from public, anon, authenticated;
revoke all on function public.circ_roles(uuid, uuid) from public, anon, authenticated;
grant execute on function public.circ_tareas_bloqueos(uuid, date) to service_role;
grant execute on function public.circ_roles(uuid, uuid) to service_role;
