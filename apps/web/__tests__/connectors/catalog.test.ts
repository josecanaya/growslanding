// @vitest-environment node
import {expect,it} from 'vitest';
import {OPERATIONS} from '@/lib/connectors/operations';
import {ENDPOINTS} from '@/lib/connectors/catalog';
import {GET} from '@/app/api/v1/openapi/route';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
it('documents every exposed operation once and every REST method exists in code',()=>{expect(new Set(ENDPOINTS.map(e=>e.operation)).size).toBe(OPERATIONS.length);for(const e of ENDPOINTS){expect(OPERATIONS.some(o=>o.name===e.operation)).toBe(true);expect(existsSync(resolve('app',e.path.slice(1).replace('{id}','[id]'),'route.ts'))).toBe(true);}});
it('publishes fields, roles, scopes, idempotency and real HTTP methods in OpenAPI',async()=>{const d=await (await GET()).json();expect(d.openapi).toBe('3.1.0');expect(d.paths['/api/v1/obras/{id}/perfil'].put['x-grows-scope']).toBe('grows:plan');expect(d.paths['/api/v1/obras/{id}/plan'].post.requestBody.content['application/json'].schema.properties.tasks.items.properties.quantity).toBeTruthy();expect(d.paths['/api/v1/bloques/{id}/revision'].post.requestBody.content['application/json'].schema.properties.accion.enum).toEqual(['validar_en_obra','rechazar']);expect(d.paths['/api/v1/obras'].post.parameters.some((p:any)=>p.name==='Idempotency-Key'&&p.required)).toBe(true);expect(d.paths['/api/v1/obras'].post['x-openai-isConsequential']).toBe(true);});
