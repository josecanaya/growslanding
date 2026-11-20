import { z } from 'zod';
import { timingSafeEqual } from 'node:crypto';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { getSessionUser } from '@/lib/auth/session-user';
import { validateGrant } from './auth';
import { challenge, ConnectorError, hash, parseScopes, requireSameOrigin, resource, secret, validateRedirect } from './core';
const uuid=z.string().uuid();
export async function clientById(id:string){uuid.parse(id);const db=createServiceSupabaseClient() as any;const c=await db.from('connector_clients').select('*').eq('id',id).maybeSingle();if(c.error)throw new ConnectorError(503,'No se pudo leer el cliente.');if(!c.data)throw new ConnectorError(400,'Aplicación desconocida.','invalid_client');return c.data;}
export const authorizeSchema=z.object({client_id:uuid,redirect_uri:z.string().url(),response_type:z.literal('code'),code_challenge:z.string().regex(/^[A-Za-z0-9_-]{43}$/),code_challenge_method:z.literal('S256'),resource:z.string().url(),scope:z.string().max(300).default('grows:public'),state:z.string().max(2048).optional()});
export async function authorizationParams(input:unknown){const p=authorizeSchema.parse(input);const client=await clientById(p.client_id);if(!client.redirect_uris.includes(validateRedirect(p.redirect_uri)))throw new ConnectorError(400,'La redirección no coincide con la aplicación registrada.','invalid_request');if(p.resource!==resource())throw new ConnectorError(400,'El recurso no corresponde a GROWS.','invalid_target');parseScopes(p.scope);return {p,client};}
export async function registerClient(request:Request){
 const input=z.object({client_name:z.string().trim().min(2).max(120).default('Conector externo'),redirect_uris:z.array(z.string().url()).min(1).max(5),token_endpoint_auth_method:z.enum(['none','client_secret_post','client_secret_basic']).default('none'),grant_types:z.array(z.enum(['authorization_code','refresh_token'])).optional(),response_types:z.array(z.literal('code')).optional()}).parse(await request.json());
 const db=createServiceSupabaseClient() as any;
 // Global registration budget is enforced by a serialized database trigger as well.
 const clientSecret=input.token_endpoint_auth_method==='none'?null:secret('grows_s_');
 const r=await db.from('connector_clients').insert({name:input.client_name,redirect_uris:input.redirect_uris.map(validateRedirect),auth_method:input.token_endpoint_auth_method,secret_hash:clientSecret?hash(clientSecret):null}).select('id').single();
 if(r.error)throw new ConnectorError(r.error.code==='53300'?429:503,'No se pudo registrar la aplicación.');
 return {client_id:r.data.id,client_name:input.client_name,redirect_uris:input.redirect_uris,token_endpoint_auth_method:input.token_endpoint_auth_method,grant_types:['authorization_code','refresh_token'],response_types:['code'],...(clientSecret?{client_secret:clientSecret,client_secret_expires_at:0}:{})};
}
export async function consent(request:Request){
 requireSameOrigin(request);const user=await getSessionUser();if(!user)throw new ConnectorError(401,'Iniciá sesión en GROWS.');
 const body=z.object({params:authorizeSchema,org_id:z.string().uuid().nullable(),scopes:z.array(z.string()).min(1),approved:z.boolean()}).parse(await request.json());
 const {p,client}=await authorizationParams(body.params);
 const redirect=new URL(p.redirect_uri);if(p.state!==undefined)redirect.searchParams.set('state',p.state);
 if(!body.approved){redirect.searchParams.set('error','access_denied');return {redirect:redirect.toString()};}
 const scopes=parseScopes(body.scopes),requested=parseScopes(p.scope);if(scopes.some(s=>!requested.includes(s)))throw new ConnectorError(400,'No se puede ampliar el permiso solicitado.','invalid_scope');
 const db=createServiceSupabaseClient() as any;await validateGrant(user,body.org_id,scopes,db);
 const grant=await db.from('connector_grants').insert({user_id:user.id,org_id:body.org_id,client_id:client.id,name:client.name,scopes,expires_at:new Date(Date.now()+30*86400000).toISOString()}).select('id').single();if(grant.error)throw new ConnectorError(503,'No se pudo autorizar la conexión.');
 const code=secret('grows_code_');const saved=await db.from('connector_codes').insert({code_hash:hash(code),grant_id:grant.data.id,client_id:client.id,redirect_uri:p.redirect_uri,challenge:p.code_challenge,resource:p.resource,expires_at:new Date(Date.now()+300000).toISOString()});if(saved.error)throw new ConnectorError(503,'No se pudo preparar la autorización.');
 redirect.searchParams.set('code',code);return {redirect:redirect.toString()};
}
export async function authenticateClient(request:Request,form:FormData){let id=String(form.get('client_id')??''),supplied=String(form.get('client_secret')??'');let method='client_secret_post';
 const basic=request.headers.get('authorization');if(basic){if(!basic.startsWith('Basic '))throw new ConnectorError(401,'Autenticación de cliente inválida.','invalid_client');const credentials=Buffer.from(basic.slice(6),'base64').toString();const colon=credentials.indexOf(':');id=decodeURIComponent(credentials.slice(0,colon));supplied=decodeURIComponent(credentials.slice(colon+1));method='client_secret_basic';}
 const client=await clientById(id);
 if(client.auth_method!=='none'&&(method!==client.auth_method||!client.secret_hash||!timingSafeEqual(Buffer.from(hash(supplied)),Buffer.from(client.secret_hash))))throw new ConnectorError(401,'Credencial del cliente inválida.','invalid_client');
 return client;
}
export async function exchange(request:Request){
 const form=await request.formData();const client=await authenticateClient(request,form);
 const kind=z.enum(['authorization_code','refresh_token']).parse(form.get('grant_type'));
 if(String(form.get('resource')??'')!==resource())throw new ConnectorError(400,'Recurso inválido.','invalid_target');
 const code=kind==='authorization_code'?z.string().regex(/^grows_code_[A-Za-z0-9_-]{43}$/).parse(form.get('code')):z.string().regex(/^grows_r_[A-Za-z0-9_-]{43}$/).parse(form.get('refresh_token'));
 const verifier=kind==='authorization_code'?z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/).parse(form.get('code_verifier')):'';
 const access=secret('grows_c_'),refresh=secret('grows_r_');const db=createServiceSupabaseClient() as any;
 const result=await db.rpc('connector_exchange',{p_kind:kind,p_hash:hash(code),p_client:client.id,p_redirect:String(form.get('redirect_uri')??''),p_challenge:verifier?challenge(verifier):'',p_resource:resource(),p_access:hash(access),p_refresh:hash(refresh)});
 if(result.error)throw new ConnectorError(503,'No se pudo intercambiar el código.');if(result.data?.error)throw new ConnectorError(400,'Código o refresh token inválido, usado o vencido.',result.data.error);
 return {access_token:access,token_type:'Bearer',refresh_token:refresh,...result.data};
}
