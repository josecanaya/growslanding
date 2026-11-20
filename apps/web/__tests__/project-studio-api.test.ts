// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({access:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/obra-access',()=>({requireObraAccess:m.access,ObraAccessError:class extends Error {constructor(public status:number,message:string){super(message);}}}));
import {POST,GET} from '@/app/api/obras/[id]/estudio/route';
import {ObraAccessError} from '@/lib/obra-access';
const params={params:Promise.resolve({id:'a0192026-1119-4000-8000-000000000001'})};
const payload={requestId:'b0202026-1120-4000-8000-000000000001',data:{action:'import',tasks:[{code:'A',stage:'Bases',title:'Hormigón',quantity:30,unit:'m3',unitPrice:400,duration:7,dependsOn:[] as string[]}]}};
function request(body=payload){return new Request('https://grows.test/api',{method:'POST',body:JSON.stringify(body)});}
beforeEach(()=>{vi.clearAllMocks();m.access.mockResolvedValue({supabase:{rpc:m.rpc},user:{id:'verified'}});m.rpc.mockResolvedValue({data:{message:'Guardado'},error:null});});
it('uses verified actor and normalized plan, preserving retry key',async()=>{expect((await POST(request(),params)).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('project_studio_action',expect.objectContaining({p_actor:'verified',p_request:payload.requestId,p_data:expect.objectContaining({tasks:[expect.objectContaining({amount:12000,startDay:0,endDay:7})]})}));});
it('denies unauthorized read and write without calling the studio RPC',async()=>{m.access.mockRejectedValue(new ObraAccessError(403,'Sin permiso'));expect((await POST(request(),params)).status).toBe(403);expect((await GET(new Request('https://grows.test'),params)).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
it('rejects invalid plans before persistence',async()=>{expect((await POST(request({...payload,data:{...payload.data,tasks:[{...payload.data.tasks[0],dependsOn:['MISSING']}]}}),params)).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();});
it('reports locked scope and idempotency conflicts without success',async()=>{m.rpc.mockResolvedValue({error:{code:'23514',message:'Alcance congelado'}});expect((await POST(request(),params)).status).toBe(409);});
