import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { childEnvironment, compactJobContext, fetchAgentContext, localGraphProposal, parseAgentJson, validateResult, resultSchema } from './grows-bridge.mjs';

test('agent context file exists with minimum contract', async () => {
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const serverPath = path.join(scriptsDir, '../apps/web/lib/bridge/agent-context.md');
  const localFallback = path.join(scriptsDir, 'grows-agent-context.md');
  assert.equal(existsSync(serverPath), true, 'contexto canónico en apps/web');
  assert.equal(existsSync(localFallback), true, 'fallback local durante transición');
  const content = await readFile(serverPath, 'utf8');
  assert.match(content, /create_node/);
  assert.match(content, /nodeType/);
  assert.match(content, /etapa/);
});

test('fetchAgentContext downloads markdown from the server', async () => {
  const markdown = '# Grows — Contrato del agente\ncreate_node\nnodeType\netapa\n';
  const fetchImpl = async (url, options) => {
    assert.match(String(url), /\/api\/bridge\/agent-context$/);
    assert.equal(options.headers.Authorization, 'Bearer ' + 'a'.repeat(64));
    return { ok: true, text: async () => markdown };
  };
  const text = await fetchAgentContext('https://example.com', 'a'.repeat(64), fetchImpl);
  assert.equal(text, markdown);
  await assert.rejects(
    () => fetchAgentContext('https://example.com', 'a'.repeat(64), async () => ({ ok: false, status: 401, text: async () => '' })),
    /agent-context HTTP 401/,
  );
});

test('bridge validates operations and excludes secrets from Codex subprocess', () => {
  assert.deepEqual(childEnvironment({ PATH: 'path', GROWS_BRIDGE_TOKEN: 'secret', OPENAI_API_KEY: 'secret', CODEX_HOME: 'auth-home' }), { PATH: 'path', CODEX_HOME: 'auth-home' });
  assert.deepEqual(validateResult({ reply: 'Faltan datos.', operations: [] }), { reply: 'Faltan datos.', operations: [] });
  assert.throws(() => validateResult({ reply: 'Pagar', operations: [{ type: 'pay' }] }));
  const properties = resultSchema.properties.operations.items.properties;
  const op = Object.fromEntries(Object.keys(properties).map((key) => [key, ['sources', 'assumptions'].includes(key) ? [] : null]));
  op.type = 'create_node'; op.title = 'Estado propuesto'; op.nodeType = 'estado'; op.id = 'new-state';
  assert.equal(validateResult({ reply: 'Revisá este estado', operations: [op] }).operations.length, 1);
  assert.throws(() => validateResult({ reply: '', operations: [{ ...op, payment: 20 }] }));
  // create_node sin id o con id ya usado debe fallar (contrato de IDs temporales)
  const noId = { ...op, id: null };
  assert.throws(() => validateResult({ reply: '', operations: [noId] }), /Falta el campo|Valor no permitido/);
  const dupA = { ...op, id: 'tmp-1', title: 'A' };
  const dupB = { ...op, id: 'tmp-1', title: 'B' };
  // validateResult acepta cualquier string en id; la unicidad la valida applyBridgeOperations (server-side).
  assert.doesNotThrow(() => validateResult({ reply: '', operations: [dupA, dupB] }));
});
test('bridge accepts JSON wrapped in Claude markdown fences', () => {
  const result = parseAgentJson('```json\n{"reply":"Duración actualizada","operations":[]}\n```');
  assert.equal(result.reply, 'Duración actualizada');
  const wrapper = parseAgentJson(JSON.stringify({ result: '```json\n{"reply":"Lista","operations":[]}\n```' }));
  assert.equal(parseAgentJson(wrapper.result).reply, 'Lista');
});

test('bridge limits model context to the current scope', () => {
  const job = { scopePathIds: ['floor'], selectionIds: [], canvas: { obraNombre: 'Casa', nodes: [
    { id: 'floor', parentId: null, type: 'etapa', title: 'Piso' },
    { id: 'a', parentId: 'floor', type: 'tarea', title: 'A' },
    { id: 'b', parentId: 'floor', type: 'tarea', title: 'B' },
    { id: 'other', parentId: null, type: 'etapa', title: 'Otro piso' },
  ], edges: [{ id: 'ab', sourceId: 'a', targetId: 'b', relation: 'precede' }], budgetGroups: [{ id: 'private-budget' }] } };
  const compact = compactJobContext(job);
  assert.deepEqual(compact.canvas.nodes.map((node) => node.id), ['a', 'b']);
  assert.equal(compact.canvas.edges.length, 1);
  assert.equal('budgetGroups' in compact.canvas, false);
  assert.deepEqual(compact.recentThread, []);
});

test('simple edge cleanup is computed locally without Codex', () => {
  const proposal = localGraphProposal({ prompt: 'Reacomodá las vinculaciones porque no se entienden', scopePathIds: [], selectionIds: [], canvas: {
    nodes: ['a','b','c'].map((id) => ({ id, parentId: null, type: 'etapa', title: id })),
    edges: [
      { id: 'ab', sourceId: 'a', targetId: 'b', relation: 'precede' },
      { id: 'bc', sourceId: 'b', targetId: 'c', relation: 'precede' },
      { id: 'ac', sourceId: 'a', targetId: 'c', relation: 'precede' },
    ],
  }});
  assert.equal(proposal.operations.length, 1);
  assert.equal(proposal.operations[0].id, 'ac');
  assert.equal(proposal.operations[0].type, 'delete_edge');
});
