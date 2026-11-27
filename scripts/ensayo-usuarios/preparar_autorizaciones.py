#!/usr/bin/env python3
"""Solo preparación administrativa. Imprime SQL con hashes; nunca las claves."""
import argparse,hashlib,json,pathlib,secrets,uuid
p=argparse.ArgumentParser();p.add_argument('--credentials',required=True);p.add_argument('--sql',required=True);a=p.parse_args()
path=pathlib.Path(a.credentials);existing=json.loads(path.read_text()) if path.exists() else {};result={};sql=['begin;'];identities=json.loads(pathlib.Path(__file__).with_name('identidades.json').read_text())
quote=lambda value:"'"+value.replace("'","''")+"'"
for role in ['arquitecto','contratista1','contratista2','contratista3','inversor1','inversor2','inversor3']:
 uid=str(uuid.uuid5(uuid.NAMESPACE_URL,'grows:ensayo-usuarios:v1:'+role));gid=existing.get(role,{}).get('grant_id',identities[role]['grant_id']);token='grows_c_'+secrets.token_urlsafe(32)
 scopes=['grows:public','grows:read','grows:plan','grows:publish','grows:rounds','grows:work'] if role=='arquitecto' else ['grows:public','grows:work'] if role.startswith('contratista') else ['grows:public']
 org='null' if role.startswith('inversor') else "'948f6c0e-8f19-49db-b371-78f44ea17943'"
 sql.append(f"do $$ begin if not exists(select 1 from auth.users where id={quote(uid)} and raw_user_meta_data->>'fixture'='grows-ensayo-usuarios-v1') then raise exception 'Falta identidad ficticia preparada'; end if; end $$;")
 sql.append(f"insert into public.connector_grants(id,user_id,org_id,name,scopes,expires_at) values({quote(gid)},{quote(uid)},{org},'Ensayo usuarios 2026-11-27',ARRAY[{','.join(map(quote,scopes))}],now()+interval '1 day') on conflict(id) do update set expires_at=excluded.expires_at,revoked_at=null where connector_grants.user_id=excluded.user_id and connector_grants.name=excluded.name;")
 sql.append(f"update public.connector_tokens set revoked_at=now() where grant_id={quote(gid)} and revoked_at is null;")
 sql.append(f"insert into public.connector_tokens(grant_id,access_hash,resource,expires_at) values({quote(gid)},{quote(hashlib.sha256(token.encode()).hexdigest())},'https://growsapp2.vercel.app/api/mcp',now()+interval '1 day');")
 result[role]={'user_id':uid,'grant_id':gid,'token':token}
sql.append('commit;');path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result));path.chmod(0o600);pathlib.Path(a.sql).write_text('\n'.join(sql));print('Autorizaciones preparadas. Aplicar el SQL administrativamente antes de ejecutar. Las claves no se imprimieron.')
