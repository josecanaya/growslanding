import { test } from 'node:test';
import assert from 'node:assert/strict';
import { childEnvironment, validateResult, resultSchema } from './grows-bridge.mjs';
test('bridge validates operations and excludes secrets from Codex subprocess', () => {
  assert.deepEqual(childEnvironment({ PATH: 'path', GROWS_BRIDGE_TOKEN: 'secret', OPENAI_API_KEY: 'secret', CODEX_HOME: 'auth-home' }), { PATH: 'path', CODEX_HOME: 'auth-home' });
  assert.deepEqual(validateResult({ reply: 'Faltan datos.', operations: [] }), { reply: 'Faltan datos.', operations: [] });
  assert.throws(() => validateResult({ reply: 'Pagar', operations: [{ type: 'pay' }] }));
  const properties = resultSchema.properties.operations.items.properties;
  const op = Object.fromEntries(Object.keys(properties).map((key) => [key, ['sources', 'assumptions'].includes(key) ? [] : null]));
  op.type = 'create_node'; op.title = 'Estado propuesto'; op.nodeType = 'estado'; op.id = 'new-state';
  assert.equal(validateResult({ reply: 'Revisá este estado', operations: [op] }).operations.length, 1);
  assert.throws(() => validateResult({ reply: '', operations: [{ ...op, payment: 20 }] }));
});
