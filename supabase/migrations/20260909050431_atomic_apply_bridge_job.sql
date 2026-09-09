-- Apply and cancel serialize on the same job row. A cancelled job cannot write canvas.
create or replace function public.apply_grows_bridge_job(
  p_job_id uuid, p_obra_id uuid, p_org_id uuid, p_expected_revision bigint, p_snapshot jsonb
)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_job public.grows_bridge_jobs;
  v_saved jsonb;
begin
  select * into v_job from public.grows_bridge_jobs
    where id=p_job_id and obra_id=p_obra_id and org_id=p_org_id for update;
  if not found then raise exception 'Job unavailable' using errcode='42501'; end if;
  if v_job.status='applied' then
    return jsonb_build_object('alreadyApplied',true,'revision',v_job.result->'applied_revision');
  end if;
  if v_job.status<>'completed' then raise exception 'Job not completed or was cancelled' using errcode='40001'; end if;
  v_saved := public.save_canvas_snapshot(p_obra_id,p_org_id,p_expected_revision,p_snapshot);
  update public.grows_bridge_jobs set status='applied',updated_at=now(),
    result=coalesce(result,'{}'::jsonb) || jsonb_build_object('applied_revision',v_saved->'revision')
    where id=p_job_id;
  return v_saved || jsonb_build_object('alreadyApplied',false);
end;
$$;
revoke all on function public.apply_grows_bridge_job(uuid,uuid,uuid,bigint,jsonb) from public, anon, authenticated;
grant execute on function public.apply_grows_bridge_job(uuid,uuid,uuid,bigint,jsonb) to service_role;
