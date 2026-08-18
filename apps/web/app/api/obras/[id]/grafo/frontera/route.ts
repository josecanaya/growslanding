import { NextRequest, NextResponse } from 'next/server';
import { loadGrafoSnapshotForRequest } from '@/lib/proyecto-vivo/loadGrafoSnapshot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras/[id]/grafo/frontera — subset del snapshot (misma auth que GET /grafo).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const loaded = await loadGrafoSnapshotForRequest(obraId);
    if (!loaded.ok) return loaded.response;
    return NextResponse.json({ success: true, data: loaded.snapshot.frontera });
  } catch (e) {
    console.error('[GET /api/obras/[id]/grafo/frontera]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
