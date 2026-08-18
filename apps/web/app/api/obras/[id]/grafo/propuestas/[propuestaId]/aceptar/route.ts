import { NextRequest, NextResponse } from 'next/server';
import { loadProyectoVivoForWrite } from '@/lib/proyecto-vivo/loadGrafoSnapshot';
import { aceptarPropuestaL0 } from '@/lib/proyecto-vivo/orquestador/aceptarPropuestaL0';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/obras/[id]/grafo/propuestas/[propuestaId]/aceptar
 * Humano acepta. No marca realizada. No wallet.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; propuestaId: string }> },
) {
  try {
    const { id: obraId, propuestaId } = await params;
    const loaded = await loadProyectoVivoForWrite(obraId);
    if (!loaded.ok) return loaded.response;

    const result = await aceptarPropuestaL0({
      supabase: loaded.supabase,
      obraId,
      canvasNodeId: propuestaId,
      actorId: loaded.userId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('[POST /grafo/propuestas/:id/aceptar]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
