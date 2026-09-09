import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {createServiceSupabaseClient} from '@/lib/supabase-server';
import {listAccessibleOrgIds} from '@/lib/orgs';
import type {Database} from '@/lib/types/supabase.gen';

export const runtime='nodejs';

export async function GET(){
 const cookieStore=await cookies();
 const auth=createRouteHandlerClient<Database>({cookies:()=>cookieStore as any});
 const {data:{user}}=await auth.auth.getUser();
 if(!user)return NextResponse.json({message:'No autenticado'},{status:401});
 const db=createServiceSupabaseClient();
 const orgIds=await listAccessibleOrgIds(db,user.id,user.email);
 if(!orgIds.length)return NextResponse.json({planId:'FREE',orgId:null});
 const {data,error}=await db.from('organizations').select('id,plan_actual').in('id',orgIds).limit(1).maybeSingle();
 if(error)return NextResponse.json({planId:'FREE',orgId:null});
 return NextResponse.json({planId:data?.plan_actual??'FREE',orgId:data?.id??null});
}
