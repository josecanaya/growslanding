import { authenticateConnector } from '@/lib/connectors/auth';
import { executeOperation } from '@/lib/connectors/operations';
import { connectorOrigin,oauthFailure } from '@/lib/connectors/core';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
export async function POST(request:Request,{params}:{params:Promise<{operacion:string}>}){try{const principal=await authenticateConnector(request);const {operacion}=await params;const raw=await request.text();if(Buffer.byteLength(raw)>1_000_000)return Response.json({error:'Solicitud demasiado grande.'},{status:413});let body;try{body=JSON.parse(raw);}catch{return Response.json({error:'JSON inválido.'},{status:400});}if(!body||typeof body!=='object'||Array.isArray(body))return Response.json({error:'Se requiere un objeto JSON.'},{status:400});const result=await executeOperation(principal,operacion,body);return Response.json(result,{status:result.status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}catch(e){const r=oauthFailure(e);if(r.status===401)r.headers.set('WWW-Authenticate',`Bearer resource_metadata="${connectorOrigin()}/.well-known/oauth-protected-resource"`);return r;}}
export async function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}});}
