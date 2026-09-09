import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LATEST_VERSION = '0.1.0';
const BASE = `https://github.com/josecanaya/growslanding/releases/download/v${LATEST_VERSION}`;

export async function GET(request: NextRequest) {
  const platform =
    request.nextUrl.searchParams.get('platform') ||
    detectPlatform(request.headers.get('user-agent') || '');
  const map: Record<string, string> = {
    windows: `${BASE}/Grows.Agent_${LATEST_VERSION}_x64-setup.exe`,
    mac: `${BASE}/Grows.Agent_${LATEST_VERSION}_universal.dmg`,
    linux: `${BASE}/Grows.Agent_${LATEST_VERSION}_amd64.AppImage`,
  };
  const url = map[platform];
  if (!url) return NextResponse.json({ error: 'plataforma no soportada' }, { status: 400 });
  return NextResponse.redirect(url, 302);
}

function detectPlatform(ua: string): string {
  if (/windows/i.test(ua)) return 'windows';
  if (/mac/i.test(ua)) return 'mac';
  return 'linux';
}
