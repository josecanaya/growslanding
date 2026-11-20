import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
export {SCOPES,scopeLabels} from './scopes';
import {SCOPES,type Scope} from './scopes';
export type {Scope} from './scopes';
export class ConnectorError extends Error { constructor(public status:number,message:string,public code='connector_error'){super(message);} }
export const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
export const secret=(prefix:string)=>prefix+randomBytes(32).toString('base64url');
export const challenge=(verifier:string)=>createHash('sha256').update(verifier).digest('base64url');
export function connectorOrigin(){const url=new URL(process.env.GROWS_CONNECTOR_URL||'https://growsapp2.vercel.app');if(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&url.hostname==='localhost'))throw new ConnectorError(503,'La URL del conector requiere HTTPS.');return url.origin;}
export const resource=()=>connectorOrigin()+'/api/mcp';
export function parseScopes(value:unknown):Scope[]{const array=typeof value==='string'?value.trim().split(/\s+/).filter(Boolean):value;return [...new Set(z.array(z.enum(SCOPES)).min(1).max(6).parse(array))];}
export function validateRedirect(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash||!u.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname))throw new ConnectorError(400,'La redirección debe ser una URL HTTPS pública sin credenciales ni fragmento.','invalid_redirect_uri');return value;}
export function requireSameOrigin(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new ConnectorError(403,'La operación debe iniciarse desde GROWS.');}
export function stable(value:unknown):string {if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable((value as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(value)??'null';}
export function oauthFailure(error:unknown){const e=error instanceof ConnectorError?error:new ConnectorError(error instanceof z.ZodError?400:503,error instanceof z.ZodError?'Solicitud inválida.':'No se pudo completar la conexión.',error instanceof z.ZodError?'invalid_request':'temporarily_unavailable');return Response.json({error:e.code,error_description:e.message},{status:e.status,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}
