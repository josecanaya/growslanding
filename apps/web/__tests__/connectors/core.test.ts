// @vitest-environment node
import {expect,it,vi,afterEach} from 'vitest';
import {challenge,parseScopes,stable,hash,validateRedirect,requireSameOrigin,resource} from '@/lib/connectors/core';
import {connectorActor,withConnectorActor} from '@/lib/connectors/actor';
afterEach(()=>vi.unstubAllEnvs());
it('uses the RFC 7636 S256 test vector',()=>{expect(challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');});
it('rejects unknown scopes instead of widening permission',()=>{expect(()=>parseScopes('grows:public admin:all')).toThrow();expect(parseScopes('grows:read grows:read')).toEqual(['grows:read']);});
it.each(['http://evil.com/callback','https://user:pass@example.com/callback','https://example.com/callback#fragment','https://127.0.0.1/callback','https://10.0.0.1/callback','https://192.168.1.1/callback','https://localhost/callback'])('rejects unsafe redirect %s',url=>expect(()=>validateRedirect(url)).toThrow());
it('accepts an exact public HTTPS callback and hashes stable request bodies',()=>{expect(validateRedirect('https://chatgpt.com/connector_platform_oauth_redirect')).toBe('https://chatgpt.com/connector_platform_oauth_redirect');expect(hash(stable({a:1,b:2}))).toBe(hash(stable({b:2,a:1})));});
it('requires a same-origin browser action for issuing credentials',()=>{expect(()=>requireSameOrigin(new Request('https://grows.test/api',{headers:{origin:'https://evil.test'}}))).toThrow();expect(()=>requireSameOrigin(new Request('https://grows.test/api',{headers:{origin:'https://grows.test'}}))).not.toThrow();});
it('binds to the configured resource, never to an expired legacy application URL',()=>{vi.stubEnv('NEXT_PUBLIC_APP_URL','https://expired.example.com');vi.stubEnv('GROWS_CONNECTOR_URL','');expect(resource()).toBe('https://growsapp2.vercel.app/api/mcp');});
it('isolates delegated identities across simultaneous requests',async()=>{const users=[{id:'one'},{id:'two'}];const values=await Promise.all(users.map(u=>withConnectorActor(u as any,async()=>{await Promise.resolve();return connectorActor()?.id;})));expect(values).toEqual(['one','two']);expect(connectorActor()).toBeUndefined();});
