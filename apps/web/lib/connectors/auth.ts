import type { User } from '@supabase/supabase-js';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { ConnectorError, hash, resource, type Scope } from './core';
export type Grant = { id:string;user_id:string;org_id:string|null;name:string;scopes:Scope[];expires_at:string;revoked_at:string|null;client_id:string|null };
export type Principal = {user:User;grant:Grant;db:any;planner:boolean};
export async function isPlanner(db:any,user:Pick<User,'id'|'email'>,org:string){
 const owner=await db.from('organizations').select('id').eq('id',org).eq('user_id',user.id).maybeSingle();if(owner.error)throw new ConnectorError(503,'No se pudo verificar el responsable.');if(owner.data)return true;
 if(!user.email)return false;
 const leaders=await db.from('leader_invites').select('org_id').eq('org_id',org).eq('email',user.email).eq('status','accepted').limit(1);if(leaders.error)throw new ConnectorError(503,'No se pudo verificar el coordinador.');return Boolean(leaders.data?.length);
}
export async function validateGrant(user:User,org:string|null,scopes:Scope[],db:any){
 if(!org){if(scopes.some(s=>s!=='grows:public'))throw new ConnectorError(403,'Elegí una organización para autorizar datos privados.');return false;}
 const ids=await listAccessibleOrgIds(db,user.id,user.email);if(!ids.includes(org))throw new ConnectorError(403,'Ya no tenés acceso a esta organización.');
 const planner=await isPlanner(db,user,org);
 if(!planner&&scopes.some(s=>['grows:read','grows:plan','grows:publish','grows:rounds'].includes(s)))throw new ConnectorError(403,'Estos permisos corresponden al responsable o coordinador.');
 return planner;
}
export async function authenticateConnector(request:Request):Promise<Principal>{
 const raw=request.headers.get('authorization')?.match(/^Bearer (grows_c_[A-Za-z0-9_-]{43})$/i)?.[1];
 if(!raw)throw new ConnectorError(401,'Conectá tu cuenta de GROWS.','invalid_token');
 const db=createServiceSupabaseClient() as any;
 const token=await db.from('connector_tokens').select('grant_id,expires_at,revoked_at,resource').eq('access_hash',hash(raw)).maybeSingle();
 if(token.error)throw new ConnectorError(503,'No se pudo verificar la conexión.');
 if(!token.data||token.data.revoked_at||Date.parse(token.data.expires_at)<=Date.now()||token.data.resource!==resource())throw new ConnectorError(401,'Token vencido o revocado.','invalid_token');
 const grant=await db.from('connector_grants').select('*').eq('id',token.data.grant_id).maybeSingle();
 if(grant.error)throw new ConnectorError(503,'No se pudo verificar la autorización.');
 if(!grant.data||grant.data.revoked_at||Date.parse(grant.data.expires_at)<=Date.now())throw new ConnectorError(401,'Autorización vencida o revocada.','invalid_token');
 const current=await db.auth.admin.getUserById(grant.data.user_id);
 if(current.error||!current.data?.user||(current.data.user.banned_until&&Date.parse(current.data.user.banned_until)>Date.now()))throw new ConnectorError(401,'Usuario no disponible.','invalid_token');
 const user=current.data.user;
 const planner=await validateGrant(user,grant.data.org_id,grant.data.scopes,db);
 return {db,user,grant:grant.data,planner};
}
export function requireScope(principal:Principal,scope:Scope,planner=false){if(!principal.grant.scopes.includes(scope)||(planner&&!principal.planner))throw new ConnectorError(403,'La conexión no tiene este permiso.','insufficient_scope');}
