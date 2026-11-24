import type { User } from '@supabase/supabase-js';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { isPlanner,validateGrant } from './auth';
import { ConnectorError,hash,resource,SCOPES,secret,type Scope } from './core';

/** A short-lived, cookie-bound console authorization; never a transferable API key. */
export async function issueConsoleSession(user:User,db:any,orgId:string|null){
 const allowed=await listAccessibleOrgIds(db,user.id,user.email);
 if(orgId&&!allowed.includes(orgId))throw new ConnectorError(403,'No tenés acceso a esta organización.');
 const planner=orgId?await isPlanner(db,user,orgId):false;
 const scopes:Scope[]=orgId?(planner?[...SCOPES]:['grows:public','grows:work']):['grows:public'];
 await validateGrant(user,orgId,scopes,db);
 const expires=new Date(Date.now()+15*60000).toISOString();
 const grant=await db.from('connector_grants').insert({user_id:user.id,org_id:orgId,name:'Pruebas web con mi cuenta',channel:'web_console',scopes,expires_at:expires}).select('id').single();
 if(grant.error)throw new ConnectorError(503,'No se pudo conectar tu cuenta. Intentá nuevamente.');
 const token=secret('grows_c_');
 const saved=await db.from('connector_tokens').insert({grant_id:grant.data.id,access_hash:hash(token),resource:resource(),expires_at:expires});
 if(saved.error)throw new ConnectorError(503,'No se pudo preparar la sesión de pruebas.');
 return {id:grant.data.id,token,expires_at:expires};
}
