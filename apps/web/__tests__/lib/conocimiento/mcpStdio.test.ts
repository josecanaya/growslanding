import { describe, expect, it } from 'vitest';
import {
  argsForQueryTool,
  encodeMcpMessage,
  pushMcpBytes,
  textFromMcpResult,
} from '@/lib/conocimiento/mcpStdio';

describe('mcpStdio', () => {
  it('roundtrip Content-Length', () => {
    const encoded = encodeMcpMessage({ jsonrpc: '2.0', id: 1, result: { ok: true } });
    const { messages } = pushMcpBytes(Buffer.alloc(0), encoded);
    expect(messages).toEqual([{ jsonrpc: '2.0', id: 1, result: { ok: true } }]);
  });

  it('arma query_graph con question', () => {
    expect(
      argsForQueryTool({ properties: { question: { type: 'string' } } }, 'qué es L0'),
    ).toEqual({ question: 'qué es L0' });
  });

  it('lee text de tools/call', () => {
    expect(
      textFromMcpResult({ content: [{ type: 'text', text: 'Orquestador solo propone' }] }),
    ).toBe('Orquestador solo propone');
  });
});
