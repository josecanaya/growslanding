import {rest,restOptions} from '@/lib/connectors/rest';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=120;
export const OPTIONS=restOptions;
export async function POST(request:Request){return rest(request,'/api/v1/presupuestos/aprobar');}
