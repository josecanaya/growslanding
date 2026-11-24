// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({from:vi.fn(),current:vi.fn(),orgs:vi.fn(),session:vi.fn()}));
vi.mock('@/lib/supabase-server',()=>({createServiceSupabaseClient:()=>({from:m.from,auth:{admin:{getUserById:m.current}}})}));
vi.mock('@/lib/auth/session-user',()=>({getSessionUser:m.session}));
vi.mock('@/lib/orgs',()=>({listAccessibleOrgIds:m.orgs}));
import {authenticateConnector,requireScope} from '@/lib/connectors/auth';
let token:any,grant:any;
const request=()=>new Request('https://grows.test/api',{headers:{authorization:'Bearer grows_c_'+'a'.repeat(43)}});
beforeEach(()=>{vi.clearAllMocks();token={grant_id:'g',resource:'https://growsapp2.vercel.app/api/mcp',expires_at:new Date(Date.now()+60000).toISOString()};grant={id:'g',user_id:'verified',org_id:'org',scopes:['grows:read'],expires_at:token.expires_at};m.current.mockResolvedValue({data:{user:{id:'verified',email:'owner@grows.test'}}});m.orgs.mockResolvedValue(['org']);m.from.mockImplementation(table=>{const q:any={select:()=>q,eq:vi.fn(()=>q),limit:()=>q,maybeSingle:async()=>({data:table==='connector_tokens'?token:table==='connector_grants'?grant:{id:'org'},error:null})};return q;});});
it('resolves the current verified user, rather than an actor chosen by a model',async()=>{const p=await authenticateConnector(request());expect(p.user.id).toBe('verified');expect(m.current).toHaveBeenCalledWith('verified');expect(p.planner).toBe(true);});
it.each(['revoked','expired','wrong-resource'])('rejects a %s bearer before returning private data',async kind=>{if(kind==='revoked')token.revoked_at=new Date().toISOString();if(kind==='expired')token.expires_at='2000-01-01';if(kind==='wrong-resource')token.resource='https://evil.test';await expect(authenticateConnector(request())).rejects.toMatchObject({status:401});expect(m.current).not.toHaveBeenCalled();});
it('rejects a deleted user and a user removed from the authorized organization',async()=>{m.current.mockResolvedValue({data:{user:null},error:Error('deleted')});await expect(authenticateConnector(request())).rejects.toMatchObject({status:401});m.current.mockResolvedValue({data:{user:{id:'verified'}}});m.orgs.mockResolvedValue([]);await expect(authenticateConnector(request())).rejects.toMatchObject({status:403});});
it('a read-only connection cannot write even when its user owns the organization',()=>{expect(()=>requireScope({grant:{scopes:['grows:read']},planner:true} as any,'grows:plan',true)).toThrow();});
it('does not allow a public-only connection to access private project data',()=>{expect(()=>requireScope({grant:{scopes:['grows:public']},planner:false} as any,'grows:read',true)).toThrow();});

it('requires a matching current browser session for console authorizations',async()=>{
 grant.channel='web_console';m.session.mockResolvedValue(null);
 await expect(authenticateConnector(request())).rejects.toMatchObject({status:401});
 m.session.mockResolvedValue({id:'another-user'});
 await expect(authenticateConnector(request())).rejects.toMatchObject({status:401});
 m.session.mockResolvedValue({id:'verified',email:'owner@grows.test'});
 const p=await authenticateConnector(request());expect(p.user.id).toBe('verified');expect(m.current).not.toHaveBeenCalled();
});
it('rejects cross-origin console writes even when a console token is copied',async()=>{
 grant.channel='web_console';m.session.mockResolvedValue({id:'verified'});
 const r=new Request('https://grows.test/api',{method:'POST',headers:{authorization:'Bearer grows_c_'+'a'.repeat(43),origin:'https://foreign.test'}});
 await expect(authenticateConnector(r)).rejects.toMatchObject({status:403});
});
