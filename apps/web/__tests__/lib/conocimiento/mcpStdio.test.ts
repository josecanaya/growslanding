import { ReadBuffer, serializeMessage } from '@modelcontextprotocol/sdk/shared/stdio.js';
import { describe, expect, it } from 'vitest';
import {
  argsForQueryTool,
  encodeMcpMessage,
  pushMcpBytes,
  textFromMcpResult,
} from '@/lib/conocimiento/mcpStdio';

describe('mcpStdio', () => {
  it('mensajes delimitados por newline', () => {
    const encoded = encodeMcpMessage({ jsonrpc: '2.0', id: 1, result: { ok: true } });
    const { messages } = pushMcpBytes(Buffer.alloc(0), encoded);
    expect(messages).toEqual([{ jsonrpc: '2.0', id: 1, result: { ok: true } }]);
  });

  it('interopera con SDK oficial, incluso UTF-8 fragmentado', () => {
    const payload = { jsonrpc: '2.0' as const, id: 2, result: { text: 'Construcción 🏠' } };
    const official = new ReadBuffer();
    official.append(encodeMcpMessage(payload));
    expect(official.readMessage()).toEqual(payload);
    const wire = Buffer.from(serializeMessage(payload));
    const split = wire.indexOf(Buffer.from('🏠')) + 1;
    const first = pushMcpBytes(Buffer.alloc(0), wire.subarray(0, split));
    expect(first.messages).toEqual([]);
    expect(pushMcpBytes(first.pending, wire.subarray(split)).messages).toEqual([payload]);
  });

  it('separa mensajes consecutivos y rechaza salida ajena al protocolo', () => {
    const payload = { jsonrpc: '2.0' as const, id: 1, result: {} };
    expect(pushMcpBytes(Buffer.alloc(0), Buffer.from(serializeMessage(payload).repeat(2))).messages).toHaveLength(2);
    expect(() => pushMcpBytes(Buffer.alloc(0), Buffer.from('log inesperado\n'))).toThrow();
  });

  it('arma query_graph con question', () => {
    expect(
      argsForQueryTool({ properties: { question: { type: 'string' } } }, 'quÃ© es L0'),
    ).toEqual({ question: 'quÃ© es L0' });
  });

  it('lee text de tools/call', () => {
    expect(
      textFromMcpResult({ content: [{ type: 'text', text: 'Orquestador solo propone' }] }),
    ).toBe('Orquestador solo propone');
  });
});
