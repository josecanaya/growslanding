import type {Route} from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session-user';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { authorizationParams } from '@/lib/connectors/oauth';
import { isPlanner } from '@/lib/connectors/auth';
import { parseScopes } from '@/lib/connectors/core';
import ConnectorConsent from '@/components/grows/ConnectorConsent';
export const dynamic='force-dynamic';
export const metadata={title:'Autorizar conexión · GROWS',referrer:'no-referrer'};
export default async function ConsentPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const input=await searchParams;let validated;
 try{validated=await authorizationParams(input);}catch{return <main className="p-8"><h1>Solicitud de conexión inválida</h1><p>Volvé a iniciar la conexión desde tu aplicación de IA.</p></main>;}
 const {p,client}=validated;const user=await getSessionUser();
 if(!user){const query=new URLSearchParams(Object.entries(p).filter(([,v])=>v!==undefined) as [string,string][]);redirect(('/auth/login?redirect='+encodeURIComponent('/conectar?'+query.toString())) as Route);}
 const db=createServiceSupabaseClient() as any;const ids=await listAccessibleOrgIds(db,user.id,user.email);const orgs=ids.length?await db.from('organizations').select('id,name').in('id',ids):{data:[],error:null};if(orgs.error)throw new Error('No se pudieron verificar tus organizaciones.');
 const organizations=await Promise.all((orgs.data??[]).map(async(o:any)=>({...o,planner:await isPlanner(db,user,o.id)})));
 return <ConnectorConsent params={p} clientName={client.name} organizations={organizations} requested={parseScopes(p.scope)}/>;
}
