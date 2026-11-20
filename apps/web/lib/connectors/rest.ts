import { authenticateConnector } from './auth';
import { executeOperation } from './operations';
import { ENDPOINTS } from './catalog';
import { ConnectorError,connectorOrigin,oauthFailure } from './core';
export async function rest(request:Request,template:string,id?:string){try{
 const endpoint=ENDPOINTS.find(e=>e.path===template&&e.method===request.method);if(!endpoint)throw new ConnectorError(405,'Método no disponible.');
 const p=await authenticateConnector(request);let data:Record<string,unknown>={};
 if(request.method!=='GET'){const raw=await request.text();if(Buffer.byteLength(raw)>1_000_000)throw new ConnectorError(413,'La solicitud supera 1 MB.');try{data=raw?JSON.parse(raw):{};}catch{throw new ConnectorError(400,'JSON inválido.');}if(!data||typeof data!=='object'||Array.isArray(data))throw new ConnectorError(400,'Se requiere un objeto JSON.');}
 const args:Record<string,unknown>=endpoint.direct?{...data}:request.method==='GET'?{}:{datos:data};
 if(endpoint.target)args[endpoint.target]=id;
 if(endpoint.operation==='listar_obras')args.offset=Number(new URL(request.url).searchParams.get('offset')??0);
 if(request.method!=='GET')args.request_id=request.headers.get('Idempotency-Key');
 const result=await executeOperation(p,endpoint.operation,args);return Response.json(result,{status:result.status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Idempotency-Replayed':String(result.replayed)}});
 }catch(e){const r=oauthFailure(e);if(r.status===401)r.headers.set('WWW-Authenticate',`Bearer resource_metadata="${connectorOrigin()}/.well-known/oauth-protected-resource"`);return r;}}
export async function restOptions(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization,Idempotency-Key'}});}
