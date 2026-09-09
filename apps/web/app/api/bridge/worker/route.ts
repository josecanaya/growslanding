import {NextRequest,NextResponse} from 'next/server';
import {createHash} from 'crypto';
import {createServiceSupabaseClient} from '@/lib/supabase-server';
import {readCanvasSnapshot} from '@/lib/canvas/canvasPersistenceServer';
import {supabaseRowsToPersisted} from '@/lib/canvas/canvasSupabaseMapper';
import {bridgeResultSchema} from '@/lib/bridge/operations';
import {z} from 'zod';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const capabilitySchema=z.array(z.object({id:z.enum(['openai','claude','cursor']),label:z.string().max(40),models:z.array(z.object({id:z.string().max(120),label:z.string().max(80),description:z.string().max(240)})).max(20),limitDescription:z.string().max(240)})).max(3);
const usageSchema=z.object({provider:z.string().max(40).optional(),model:z.string().max(120).optional(),inputTokens:z.number().int().nonnegative().optional(),cachedInputTokens:z.number().int().nonnegative().optional(),outputTokens:z.number().int().nonnegative().optional(),durationMs:z.number().int().nonnegative().optional(),local:z.boolean().optional(),limitDescription:z.string().max(240).optional()}).optional();
const schema=z.object({action:z.enum(['claim','heartbeat','complete','fail']),jobId:z.string().uuid().optional(),leaseToken:z.string().uuid().optional(),result:bridgeResultSchema.optional(),error:z.string().max(2000).optional(),capabilities:capabilitySchema.optional(),usage:usageSchema,activity:z.string().max(240).optional()});
export async function POST(request:NextRequest){
 try{
  const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if(!token)return NextResponse.json({message:'Credencial inválida'},{status:401});
  const db=createServiceSupabaseClient() as any;
  const deviceResult=await db.from('grows_bridge_devices').select('*').eq('token_hash',createHash('sha256').update(token).digest('hex')).is('revoked_at',null).maybeSingle();
  if(deviceResult.error||!deviceResult.data)return NextResponse.json({message:'PC no autorizada'},{status:401});const device=deviceResult.data;
  const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({message:'Solicitud inválida'},{status:400});const input=parsed.data;
  const ping=await db.from('grows_bridge_devices').update({last_seen_at:new Date().toISOString(),...(input.capabilities?{capabilities:input.capabilities}:{}),...(input.usage?{usage:input.usage}:{}),...(input.activity!==undefined?{activity:input.activity}: {})}).eq('id',device.id);if(ping.error)throw ping.error;
  if(input.action==='claim'){
   const claim=await db.rpc('claim_grows_bridge_job',{p_device_id:device.id});if(claim.error)throw claim.error;
   const job=claim.data;if(!job)return NextResponse.json({job:null});
   const snapshot=await readCanvasSnapshot(db,device.obra_id,device.org_id);if(snapshot.error)throw snapshot.error;
   if (snapshot.data.revision !== job.context.revision) {
    const contextUpdate = await db.from('grows_bridge_jobs').update({context:{...job.context,revision:snapshot.data.revision}}).eq('id',job.id).eq('lease_token',job.lease_token).eq('status','running').select('id');
    if (contextUpdate.error) throw contextUpdate.error;
    if (!contextUpdate.data.length) return NextResponse.json({job:null});
   }
   return NextResponse.json({job:{id:job.id,prompt:job.prompt,canvas:supabaseRowsToPersisted(snapshot.data),scopePathIds:job.context.scopePathIds??[],selectionIds:job.context.selectionIds??[],provider:job.context.provider??'local',model:job.context.model??'automatico'},leaseToken:job.lease_token});
  }
  if(!input.jobId||!input.leaseToken)return NextResponse.json({message:'Falta trabajo o reserva'},{status:400});
  const patch=input.action==='heartbeat'?{lease_until:new Date(Date.now()+600000).toISOString(),activity:input.activity??'Procesando'}:input.action==='complete'?{status:'completed',result:input.result,usage:input.usage??{},activity:'Propuesta lista para revisar'}: {status:'failed',error:input.error??'El agente no pudo completar el trabajo.',usage:input.usage??{},activity:'No se pudo completar'};
  if(input.action==='complete'&&!input.result)return NextResponse.json({message:'Falta resultado'},{status:400});
  const updated=await db.from('grows_bridge_jobs').update({...patch,updated_at:new Date().toISOString()}).eq('id',input.jobId).eq('device_id',device.id).eq('lease_token',input.leaseToken).eq('status','running').gt('lease_until',new Date().toISOString()).select('id');
  if(updated.error)throw updated.error;
  return NextResponse.json({ok:updated.data.length>0,cancelled:updated.data.length===0});
 }catch{return NextResponse.json({message:'El puente no pudo completar la solicitud.'},{status:503});}
}
