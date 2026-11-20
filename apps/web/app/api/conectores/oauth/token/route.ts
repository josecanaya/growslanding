import { exchange } from '@/lib/connectors/oauth';
import { oauthFailure } from '@/lib/connectors/core';
export const runtime='nodejs';
export async function POST(request:Request){try{return Response.json(await exchange(request),{headers:{'Cache-Control':'no-store','Pragma':'no-cache','Access-Control-Allow-Origin':'*'}});}catch(e){return oauthFailure(e);}}
export async function OPTIONS(){return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'}});}
