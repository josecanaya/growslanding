// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({orgs:vi.fn(),planner:vi.fn(),validate:vi.fn()}));
vi.mock('@/lib/orgs',()=>({listAccessibleOrgIds:m.orgs}));
vi.mock('@/lib/connectors/auth',()=>({isPlanner:m.planner,validateGrant:m.validate}));
import {issueConsoleSession} from '@/lib/connectors/console-session';
let inserted:any[];
const db={from:(table:string)=>({insert:(data:any)=>{inserted.push({table,data});if(table==='connector_tokens')return Promise.resolve({error:null});return {select:()=>({single:async()=>({data:{id:'grant'},error:null})})};}})};
beforeEach(()=>{vi.clearAllMocks();inserted=[];m.orgs.mockResolvedValue(['org']);m.planner.mockResolvedValue(true);m.validate.mockResolvedValue(true);});
it('creates a short-lived browser-only authorization with server-derived permissions',async()=>{const start=Date.now();const r=await issueConsoleSession({id:'user'} as any,db,'org');expect(r.token).toMatch(/^grows_c_/);expect(Date.parse(r.expires_at)-start).toBeLessThanOrEqual(15*60000+50);expect(inserted[0].data).toMatchObject({channel:'web_console',org_id:'org',user_id:'user'});expect(inserted[0].data.scopes).toContain('grows:plan');expect(inserted[1].data.access_hash).not.toBe(r.token);expect(JSON.stringify(inserted)).not.toContain(r.token);});
it('does not grant planning or investment rights to a contractor or public-only account',async()=>{m.planner.mockResolvedValue(false);await issueConsoleSession({id:'user'} as any,db,'org');expect(inserted[0].data.scopes).toEqual(['grows:public','grows:work']);inserted=[];await issueConsoleSession({id:'user'} as any,db,null);expect(inserted[0].data.scopes).toEqual(['grows:public']);});
it('rejects another organization before issuing any credential',async()=>{await expect(issueConsoleSession({id:'user'} as any,db,'outside')).rejects.toMatchObject({status:403});expect(inserted).toHaveLength(0);});
