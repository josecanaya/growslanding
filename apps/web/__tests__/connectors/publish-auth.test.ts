// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({role:vi.fn(),orgs:vi.fn(),cookieUser:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>({})}));
vi.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:()=>({auth:{getUser:m.cookieUser}})}));
vi.mock('@/lib/orgs',()=>({listAccessibleOrgIds:m.orgs}));
vi.mock('@/lib/services/permiso.service',()=>({PermisoService:{obtenerRolEnOrganizacion:m.role}}));
vi.mock('@/lib/supabase-server',()=>({createServiceSupabaseClient:()=>({from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,limit:()=>q,maybeSingle:async()=>({data:table==='obras'?{org_id:'org',graph_mode:'obra_plan'}:null,error:null}),then:(resolve:any)=>Promise.resolve({data:[],error:null}).then(resolve)};return q;}})}));
import {POST} from '@/app/api/obras/[id]/canvas/publicar-tareas/route';
import {withConnectorActor} from '@/lib/connectors/actor';
import type {NextRequest} from 'next/server';
const request=()=>new Request('https://grows.test/api/publicar',{method:'POST'}) as NextRequest;
const ctx={params:Promise.resolve({id:'obra'})};
beforeEach(()=>{vi.clearAllMocks();m.cookieUser.mockResolvedValue({data:{user:null},error:null});m.role.mockResolvedValue('CLIENTE');m.orgs.mockResolvedValue(['org']);});
it('uses the already verified connector actor without requiring a second browser login',async()=>{const response=await withConnectorActor({id:'architect'} as any,()=>POST(request(),ctx));expect(response.status).toBe(200);expect((await response.json()).ok).toBe(true);expect(m.cookieUser).not.toHaveBeenCalled();expect(m.role).toHaveBeenCalledWith('architect','org');});
it('still rejects an unauthenticated request',async()=>{expect((await POST(request(),ctx)).status).toBe(401);expect(m.role).not.toHaveBeenCalled();});
it('still rejects a contractor despite organization membership',async()=>{m.role.mockResolvedValue('SOCIO');expect((await withConnectorActor({id:'contractor'} as any,()=>POST(request(),ctx))).status).toBe(403);});
it('still rejects another organization',async()=>{m.orgs.mockResolvedValue(['outside']);expect((await withConnectorActor({id:'architect'} as any,()=>POST(request(),ctx))).status).toBe(403);});
