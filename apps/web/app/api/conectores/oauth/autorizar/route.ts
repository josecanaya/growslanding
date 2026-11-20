import { consent } from '@/lib/connectors/oauth';
import { oauthFailure } from '@/lib/connectors/core';
export const runtime='nodejs';
export async function POST(request:Request){try{return Response.json(await consent(request),{headers:{'Cache-Control':'no-store'}});}catch(e){return oauthFailure(e);}}
