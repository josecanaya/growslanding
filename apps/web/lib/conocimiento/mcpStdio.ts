/** Framing MCP stdio (Content-Length). Sin API keys. */

export function encodeMcpMessage(payload: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'utf8');
  return Buffer.concat([header, body]);
}

export function pushMcpBytes(
  pending: Uint8Array,
  chunk: Uint8Array,
): { pending: Uint8Array; messages: unknown[] } {
  let buf = Buffer.concat([pending, chunk]);
  const messages: unknown[] = [];

  while (buf.length > 0) {
    const crlf = buf.indexOf('\r\n\r\n');
    const lf = buf.indexOf('\n\n');
    let headerEnd = -1;
    let sepLen = 0;
    if (crlf >= 0 && (lf < 0 || crlf <= lf)) {
      headerEnd = crlf;
      sepLen = 4;
    } else if (lf >= 0) {
      headerEnd = lf;
      sepLen = 2;
    }

    if (headerEnd < 0) {
      const asText = buf.toString('utf8');
      const nl = asText.indexOf('\n');
      if (nl > 0 && asText.trimStart().startsWith('{')) {
        const line = asText.slice(0, nl).trim();
        try {
          messages.push(JSON.parse(line));
          buf = Buffer.from(asText.slice(nl + 1), 'utf8');
          continue;
        } catch {
          break;
        }
      }
      break;
    }

    const header = buf.subarray(0, headerEnd).toString('utf8');
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buf = buf.subarray(headerEnd + sepLen);
      continue;
    }
    const len = Number(match[1]);
    const start = headerEnd + sepLen;
    if (buf.length < start + len) break;
    const json = buf.subarray(start, start + len).toString('utf8');
    messages.push(JSON.parse(json));
    buf = buf.subarray(start + len);
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
