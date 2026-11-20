// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({auth:vi.fn()}));
vi.mock('@/lib/connectors/auth',async importOriginal=>({...await importOriginal<any>(),authenticateConnector:m.auth}));
import {POST} from '@/app/api/mcp/route';
import {ConnectorError} from '@/lib/connectors/core';
const req=(method:string,params:unknown={})=>new Request('https://growsapp2.vercel.app/api/mcp',{method:'POST',headers:{authorization:'Bearer grows_c_'+'a'.repeat(43),'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
beforeEach(()=>{vi.clearAllMocks();m.auth.mockResolvedValue({grant:{scopes:['grows:public']},planner:false,user:{id:'verified'}});});
it('negotiates a real streamable HTTP MCP initialize request',async()=>{const r=await POST(req('initialize',{protocolVersion:'2025-03-26',clientInfo:{name:'integration-test',version:'1.0'},capabilities:{}}));expect(r.status).toBe(200);const d=await r.json();expect(d.result.serverInfo.name).toBe('grows-plataforma');expect(d.result.serverInfo.version).toBe('2.0.0');});
it('returns only the tools authorized by the user grant',async()=>{const r=await POST(req('tools/list'));expect(r.status).toBe(200);const d=await r.json();expect(d.result.tools.map((t:any)=>t.name)).toContain('explorar_obras');expect(d.result.tools.map((t:any)=>t.name)).not.toContain('guardar_canvas');expect(d.result.tools.find((t:any)=>t.name==='participar_feed').annotations.destructiveHint).toBe(true);});
it('advertises OAuth discovery when a credential is missing or expired',async()=>{m.auth.mockRejectedValue(new ConnectorError(401,'Conectar','invalid_token'));const r=await POST(req('tools/list'));expect(r.status).toBe(401);expect(r.headers.get('WWW-Authenticate')).toContain('/.well-known/oauth-protected-resource');});
