import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadProyectoVivoForWrite } from '@/lib/proyecto-vivo/loadGrafoSnapshot';
import { insertarPropuestaEnCanvas } from '@/lib/proyecto-vivo/orquestador/insertarPropuestaEnCanvas';
import { proponerDesdeChat } from '@/lib/proyecto-vivo/orquestador/proponerDesdeChat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z.object({
  mensaje: z.string().trim().min(1).max(4000),
});

/**
 * POST /api/obras/[id]/grafo/chat
 * Un turno de habla → una propuesta A→T→B. No receta de obra. No realizada. No wallet.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Escribí algo para seguir.', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const loaded = await loadProyectoVivoForWrite(obraId);
    if (!loaded.ok) return loaded.response;

    const propuesta = proponerDesdeChat({
      canvas: loaded.canvas,
      mensaje: parsed.data.mensaje,
    });

    const result = await insertarPropuestaEnCanvas({
      supabase: loaded.supabase,
      obraId,
      orgId: loaded.orgId,
      canvas: loaded.canvas,
      propuesta,
    });

    const paso = propuesta.pasos[0];
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        reply: propuesta.motivo,
        paso: paso ?? null,
      },
    });
  } catch (e) {
    console.error('[POST /grafo/chat]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
