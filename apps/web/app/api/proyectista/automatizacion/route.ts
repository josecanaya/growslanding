import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session-user';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { ObraAccessError } from '@/lib/obra-access';
export const dynamic='force-dynamic';
async function access() {
 const user=await getSessionUser();if(!user)throw new ObraAccessError(401,'Iniciá sesión.');
 const db=createServiceSupabaseClient() as any;
 const settings=await db.from('project_automation_settings').select('*').eq('id',true).single();
 if(settings.error)throw new Error('Automatización pendiente de habilitación.');
 const owner=await db.from('organizations').select('id').eq('id',settings.data.org_id).eq('user_id',user.id).maybeSingle();
 if(owner.error)throw new Error('No se pudo verificar el permiso.');
 if(!owner.data)throw new ObraAccessError(403,'Solo el titular administra la carga automática.');
 return {db,user,settings:settings.data};
}
const fail=(e:unknown)=>NextResponse.json({error:e instanceof Error?e.message:'Error de automatización'},{status:e instanceof ObraAccessError?e.status:503});
export async function GET(){try{const {db,settings}=await access();const runs=await db.from('project_automation_runs').select('*').order('started_at',{ascending:false}).limit(50);if(runs.error)throw new Error('No se pudo leer el historial.');return NextResponse.json({settings,runs:runs.data,schedule:'09:00 y 18:00 · America/Argentina/Buenos_Aires'},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
export async function POST(request:Request){try{const {db,user}=await access();const parsed=z.object({action:z.enum(['pause','resume','crear','publicar']),requestId:z.string().uuid()}).safeParse(await request.json().catch(()=>null));if(!parsed.success)throw new ObraAccessError(400,'Solicitud inválida.');const result=await db.rpc('project_automation_control',{p_actor:user.id,p_action:parsed.data.action,p_request:parsed.data.requestId});if(result.error)throw new ObraAccessError(result.error.code==='42501'?403:503,result.error.message);return NextResponse.json(result.data);}catch(e){return fail(e);}}
