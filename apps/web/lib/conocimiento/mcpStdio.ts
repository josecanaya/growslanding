import { deserializeMessage, serializeMessage } from '@modelcontextprotocol/sdk/shared/stdio.js';
import { JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/** MCP stdio uses newline-delimited JSON, shared with the official SDK. */
export function encodeMcpMessage(payload: unknown): Buffer {
  return Buffer.from(serializeMessage(JSONRPCMessageSchema.parse(payload)), 'utf8');
}

export function pushMcpBytes(
  pending: Uint8Array,
  chunk: Uint8Array,
): { pending: Uint8Array; messages: unknown[] } {
  let buf = Buffer.concat([pending, chunk]);
  if (buf.length > 10 * 1024 * 1024) throw new Error('MCP message buffer exceeded 10 MiB');
  const messages: unknown[] = [];
  let newline: number;
  while ((newline = buf.indexOf('\n')) >= 0) {
    const line = buf.subarray(0, newline).toString('utf8').replace(/\r$/, '');
    messages.push(deserializeMessage(line));
    buf = buf.subarray(newline + 1);
  }
  return { pending: new Uint8Array(buf), messages };
}

export function textFromMcpResult(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const r = result as { content?: unknown; isError?: boolean };
  if (!Array.isArray(r.content)) return JSON.stringify(result);
  const parts = r.content
    .map((c) => {
      if (c && typeof c === 'object' && 'text' in c && typeof (c as { text: unknown }).text === 'string') {
        return (c as { text: string }).text;
      }
      return '';
    })
    .filter(Boolean);
  return parts.join('\n').trim();
}

type JsonSchema = {
  properties?: Record<string, unknown>;
  required?: string[];
};

export function argsForQueryTool(inputSchema: JsonSchema | undefined, pregunta: string): Record<string, unknown> {
  const props = inputSchema?.properties ?? {};
  const keys = Object.keys(props);
  const preferred = ['question', 'query', 'q', 'text', 'prompt'];
  const key = preferred.find((k) => k in props) ?? keys[0] ?? 'question';
  return { [key]: pregunta };
}
