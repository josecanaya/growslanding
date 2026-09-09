-- Run against a disposable database with migrations loaded. Every fixture rolls back.
begin;
do $$
declare
 o uuid := gen_random_uuid(); org uuid := gen_random_uuid(); u uuid := gen_random_uuid();
 d uuid := gen_random_uuid(); other_d uuid := gen_random_uuid(); j uuid := gen_random_uuid(); r jsonb; previous_token text;
begin
 insert into public.obras(id,org_id) values(o,org);
 insert into public.grows_bridge_devices(id,obra_id,org_id,user_id,token_hash) values
   (d,o,org,u,d::text),(other_d,o,org,gen_random_uuid(),other_d::text);
 insert into public.grows_bridge_jobs(id,obra_id,org_id,user_id,prompt) values(j,o,org,u,'Local test');
 if public.claim_grows_bridge_job(other_d) is not null then raise exception 'Cross actor access'; end if;
 r := public.claim_grows_bridge_job(d);
 if r->>'id' <> j::text or r->>'status' <> 'running' or (r->>'attempts')::int <> 1 then raise exception 'Claim failed'; end if;
 previous_token := r->>'lease_token';
 if public.claim_grows_bridge_job(d) is not null then raise exception 'Duplicate claim'; end if;
 update public.grows_bridge_jobs set lease_until=now()-interval '1 second' where id=j;
 r := public.claim_grows_bridge_job(d);
 if (r->>'attempts')::int <> 2 or r->>'lease_token'=previous_token then raise exception 'Lease recovery failed'; end if;
 update public.grows_bridge_jobs set attempts=3, lease_until=now()-interval '1 second' where id=j;
 if public.claim_grows_bridge_job(d) is not null then raise exception 'Exhausted claim'; end if;
 if (select status from public.grows_bridge_jobs where id=j) <> 'failed' then raise exception 'Failure invisible'; end if;
 update public.grows_bridge_devices set revoked_at=now() where id=d;
 begin
   perform public.claim_grows_bridge_job(d);
   raise exception 'Revoked device accepted';
 exception when insufficient_privilege then null;
 end;
 if has_table_privilege('anon','public.grows_bridge_jobs','select') or has_function_privilege('authenticated','public.claim_grows_bridge_job(uuid)','execute') then raise exception 'Public grants'; end if;
 raise notice 'PASS bridge: isolation, lease, duplicate, recovery, exhaustion, revocation, grants';
end;
$$;
rollback;
