import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { operationSchema } from '@/lib/bridge/operations';

function zodObjectShape(schema: unknown): Record<string, any> {
  const s = schema as any;
  if (typeof s?.shape === 'object') return s.shape;
  if (typeof s?._def?.shape === 'function') return s._def.shape();
  throw new Error('No se pudo introspectar operationSchema (zod)');
}

function zodEnumValues(field: any): string[] {
  // z.enum([...]) o z.enum([...]).nullable().optional()
  let cur = field;
  while (cur?._def) {
    if (Array.isArray(cur._def.values)) return [...cur._def.values];
    if (cur._def.innerType) {
      cur = cur._def.innerType;
      continue;
    }
    break;
  }
  throw new Error('No se pudo extraer enum de un campo zod');
}

function extractJsStringArray(source: string, key: string): string[] {
  const re = new RegExp(`${key}:\\s*\\{[\\s\\S]*?enum:\\s*\\[([^\\]]+)\\]`);
  const m = source.match(re);
  if (!m) throw new Error(`No encontré enum de ${key} en grows-bridge.mjs`);
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'null')
    .map((s) => s.replace(/^['"]|['"]$/g, ''));
}

function extractRustStrSlice(source: string, name: string): string[] {
  const re = new RegExp(`const ${name}:\\s*&\\[&str\\]\\s*=\\s*&\\[([^\\]]+)\\]`);
  const m = source.match(re);
  if (!m) throw new Error(`No encontré ${name} en validate.rs`);
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^"|"$/g, ''));
}

const OP_TYPES = [
  'create_edge',
  'create_node',
  'delete_edge',
  'delete_node',
  'propose_transform',
  'update_node',
];
const NODE_TYPES = ['ambiente', 'etapa', 'planta', 'sector', 'tarea', 'estado'].sort();

describe('schema coherence', () => {
  const shape = zodObjectShape(operationSchema);
  const repoRoot = resolve(__dirname, '../../../../../');
  const nodeSrc = readFileSync(resolve(repoRoot, 'scripts/grows-bridge.mjs'), 'utf8');
  const rustSrc = readFileSync(resolve(repoRoot, 'bridge-tauri/src-tauri/src/validate.rs'), 'utf8');

  it('operationSchema tiene los mismos 6 tipos que el bridge Node y Rust', () => {
    const opts = zodEnumValues(shape.type).sort();
    expect(opts).toEqual(OP_TYPES);

    const nodeOpts = extractJsStringArray(nodeSrc, 'type').sort();
    expect(nodeOpts).toEqual(OP_TYPES);

    const rustOpts = [...extractRustStrSlice(rustSrc, 'OP_TYPES')].sort();
    expect(rustOpts).toEqual(OP_TYPES);
  });

  it('operationSchema tiene los mismos 6 nodeTypes', () => {
    const opts = zodEnumValues(shape.nodeType).sort();
    expect(opts).toEqual(NODE_TYPES);

    const nodeOpts = extractJsStringArray(nodeSrc, 'nodeType').sort();
    expect(nodeOpts).toEqual(NODE_TYPES);

    const rustOpts = [...extractRustStrSlice(rustSrc, 'NODE_TYPES')].sort();
    expect(rustOpts).toEqual(NODE_TYPES);
  });
});
