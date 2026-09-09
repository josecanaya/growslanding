import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { ObraAccessError, requireObraAccess } from '@/lib/obra-access';
import { readCanvasSnapshot, saveCanvasSnapshot, canvasPersistenceError } from '@/lib/canvas/canvasPersistenceServer';
import { supabaseRowsToPersisted, persistedToSupabaseRows } from '@/lib/canvas/canvasSupabaseMapper';
import { applyBridgeOperations, bridgeResultSchema } from '@/lib/bridge/operations';
import { z } from 'zod';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const bodySchema=z.object({action:z.enum(['pair','enqueue','cancel','apply','revoke']),jobId:z.string().uuid().optional(),deviceId:z.string().uuid().optional(),prompt:z.string().min(1).max(8000).optional(),provider:z.enum(['local','openai','claude','cursor']).optional(),model:z.string().max(120).optional(),scopePathIds:z.array(z.string().max(100)).max(50).optional(),selectionIds:z.array(z.string().max(100)).max(100).optional()});
const failure=(e:unknown)=>NextResponse.json({message:e instanceof ObraAccessError?e.message:'No se pudo completar la operación del puente.'},{status:e instanceof ObraAccessError?e.status:500});

export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 try {
  const {id}=await params; const {supabase}=await requireObraAccess(id,true); const db=supabase as any;
  const [devices,jobs]=await Promise.all([db.from('grows_bridge_devices').select('id,last_seen_at,created_at,capabilities,usage,activity').eq('obra_id',id).is('revoked_at',null),db.from('grows_bridge_jobs').select('id,prompt,status,result,error,created_at,updated_at,context,usage,activity').eq('obra_id',id).order('created_at',{ascending:false}).limit(30)]);
  if(devices.error||jobs.error) throw new ObraAccessError(503,'El puente está pendiente de habilitación en el servidor.');
  return NextResponse.json({devices:devices.data,jobs:jobs.data});
 }catch(e){return failure(e);}
}

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 try {
  const {id}=await params; const {supabase,user,orgId}=await requireObraAccess(id,true);const db=supabase as any;
  const parsed=bodySchema.safeParse(await request.json()); if(!parsed.success) throw new ObraAccessError(400,'Solicitud inválida.');const input=parsed.data;
  if(input.action==='pair') {
   const token=randomBytes(32).toString('hex');
   const result=await db.from('grows_bridge_devices').insert({obra_id:id,org_id:orgId,user_id:user.id,token_hash:createHash('sha256').update(token).digest('hex')}).select('id').single();
   if(result.error) throw result.error;
   return NextResponse.json({deviceId:result.data.id,token});
  }
  if(input.action==='revoke') {
   if(!input.deviceId) throw new ObraAccessError(400,'Falta la PC.');
   const result=await db.from('grows_bridge_devices').update({revoked_at:new Date().toISOString()}).eq('id',input.deviceId).eq('obra_id',id);
   if(result.error) throw result.error;return NextResponse.json({ok:true});
  }
  if(input.action==='enqueue') {
   if(!input.prompt?.trim()) throw new ObraAccessError(400,'Escribí un pedido.');
   const provider=input.provider??'local';
   const model=input.model??'automatico';
   if(provider!=='local') {
    const connected=await db.from('grows_bridge_devices').select('capabilities').eq('obra_id',id).is('revoked_at',null).gte('last_seen_at',new Date(Date.now()-30000).toISOString());
    if(connected.error) throw connected.error;
    const available=(connected.data??[]).some((device:any)=>(device.capabilities??[]).some((cap:any)=>cap.id===provider&&(cap.models??[]).some((item:any)=>item.id===model)));
    if(!available) throw new ObraAccessError(409,'Ese proveedor o modelo no está conectado en tu PC.');
   }
   const snapshot=await readCanvasSnapshot(supabase,id,orgId);if(snapshot.error) throw new ObraAccessError(503,'No se pudo leer el canvas.');
   const result=await db.from('grows_bridge_jobs').insert({obra_id:id,org_id:orgId,user_id:user.id,prompt:input.prompt.trim(),activity:'Esperando a tu PC',context:{revision:snapshot.data.revision,scopePathIds:input.scopePathIds??[],selectionIds:input.selectionIds??[],provider,model}}).select('id').single();
   if(result.error) throw result.error;return NextResponse.json({jobId:result.data.id},{status:202});
  }
  if(!input.jobId) throw new ObraAccessError(400,'Falta el trabajo.');
  if(input.action==='cancel') {
   const result=await db.from('grows_bridge_jobs').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',input.jobId).eq('obra_id',id).in('status',['queued','running','completed']).select('id');
   if(result.error) throw result.error;return NextResponse.json({ok:result.data.length>0});
  }
  const jobResult=await db.from('grows_bridge_jobs').select('*').eq('id',input.jobId).eq('obra_id',id).single();
  if(jobResult.error||!jobResult.data) throw new ObraAccessError(404,'Trabajo no encontrado.'); const job=jobResult.data;
  if(job.status==='applied') return NextResponse.json({ok:true});
  if(job.status!=='completed') throw new ObraAccessError(409,'La propuesta todavía no está disponible.');
  const snapshot=await readCanvasSnapshot(supabase,id,orgId);if(snapshot.error) throw snapshot.error;
  const appliedJobs=(snapshot.data.obra.canvas_ui?.bridgeAppliedJobs??[]) as string[];
  if(!appliedJobs.includes(job.id)) {
   if(snapshot.data.revision!==job.context.revision) throw new ObraAccessError(409,'La obra cambió desde el pedido. Pedí una nueva propuesta para conservar tus cambios.');
   const output=bridgeResultSchema.parse(job.result);
   let canvas;try{canvas=applyBridgeOperations(supabaseRowsToPersisted(snapshot.data),output);}catch(e){throw new ObraAccessError(400,e instanceof Error?e.message:'Propuesta inválida.');}
   const rows=persistedToSupabaseRows(id,orgId,canvas);
   rows.obrasPatch.canvas_ui={...(rows.obrasPatch.canvas_ui as object),bridgeAppliedJobs:[...appliedJobs,job.id].slice(-100)};
   const saved=await db.rpc('apply_grows_bridge_job',{p_job_id:job.id,p_obra_id:id,p_org_id:orgId,p_expected_revision:snapshot.data.revision,p_snapshot:rows});
   if(saved.error){const mapped=canvasPersistenceError(saved.error);throw new ObraAccessError(mapped.status,mapped.message);}
  }
  const updated=await db.from('grows_bridge_jobs').update({status:'applied',updated_at:new Date().toISOString()}).eq('id',job.id).eq('status','completed');if(updated.error)throw updated.error;
  return NextResponse.json({ok:true});
 }catch(e){return failure(e);}
}

