import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function readAgentContext(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), 'lib/bridge/agent-context.md'),
    path.join(process.cwd(), 'apps/web/lib/bridge/agent-context.md'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return readFile(candidate, 'utf8');
  }
  throw new Error(`agent-context.md no encontrado (cwd=${process.cwd()})`);
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return NextResponse.json({ message: 'Credencial inválida' }, { status: 401 });

  const db = createServiceSupabaseClient() as any;
  const device = await db.from('grows_bridge_devices')
    .select('id').eq('token_hash', createHash('sha256').update(token).digest('hex'))
    .is('revoked_at', null).maybeSingle();
  if (device.error || !device.data) return NextResponse.json({ message: 'PC no autorizada' }, { status: 401 });

  const content = await readAgentContext();
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
