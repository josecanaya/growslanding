import { registerClient } from '@/lib/connectors/oauth';
import { oauthFailure } from '@/lib/connectors/core';
export const runtime='nodejs';
export async function POST(request:Request){try{return Response.json(await registerClient(request),{status:201,headers:{'Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}catch(e){return oauthFailure(e);}}
export async function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});}
