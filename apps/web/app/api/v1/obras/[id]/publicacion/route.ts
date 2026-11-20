import {rest,restOptions} from '@/lib/connectors/rest';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
export const OPTIONS=restOptions;
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return rest(request,'/api/v1/obras/{id}/publicacion',id);}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return rest(request,'/api/v1/obras/{id}/publicacion',id);}
