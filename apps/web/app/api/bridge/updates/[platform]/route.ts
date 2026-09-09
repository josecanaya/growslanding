import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LATEST = {
  version: '0.1.0',
  notes: 'Release inicial',
  pub_date: '2026-09-09T00:00:00Z',
};
const BASE = `https://github.com/josecanaya/growslanding/releases/download/v${LATEST.version}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const url = platform.includes('windows')
    ? `${BASE}/Grows%20Agent_${LATEST.version}_x64-setup.nsis.zip`
    : platform.includes('darwin') || platform.includes('mac')
      ? `${BASE}/Grows%20Agent.app.tar.gz`
      : `${BASE}/grows-agent_${LATEST.version}_amd64.AppImage.tar.gz`;
  return NextResponse.json({
    ...LATEST,
    url,
    // Placeholder: firma real cuando exista pipeline de signing (Fase 10+).
    signature: 'pending-updater-signature',
  });
}
