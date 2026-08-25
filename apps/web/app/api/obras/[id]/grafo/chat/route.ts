import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadProyectoVivoForWrite } from '@/lib/proyecto-vivo/loadGrafoSnapshot';
import { insertarNodosCanvasObra } from '@/lib/proyecto-vivo/orquestador/insertarNodosCanvasObra';
import { turnoHorizonteChat } from '@/lib/proyecto-vivo/orquestador/turnoHorizonteChat';
import { mergeCanvasUiHilo, parseHiloCanvasUi, type HiloLinea } from '@/lib/proyecto-vivo/hiloCanvasUi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const bodySchema = z.object({
  mensaje: z.string().trim().min(1).max(4000),
  historial: z
    .array(
      z.object({
        role: z.enum(['user', 'horizonte', 'assistant']),
        text: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

/**
 * POST /api/obras/[id]/grafo/chat
 * Acompaña el Organizar: propone etapa/tarea/precedencia (mismo canvas CPM).
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

    const hiloPrev = parseHiloCanvasUi(loaded.canvasUi);
    const historial =
      parsed.data.historial?.map((h) => ({ role: h.role, text: h.text })) ??
      hiloPrev.map((h) => ({ role: h.role, text: h.text }));

    const turno = await turnoHorizonteChat({
      canvas: loaded.canvas,
      mensaje: parsed.data.mensaje,
      objetivo: loaded.objetivoTexto,
      historial,
    });

    let insert = {
      insertedNodes: 0,
      insertedEdges: 0,
      transformacionIds: [] as string[],
      motivo: turno.motivo,
    };
    if (turno.nodos.length > 0 || turno.edges.length > 0) {
      insert = await insertarNodosCanvasObra({
        supabase: loaded.supabase,
        obraId,
        orgId: loaded.orgId,
        canvas: loaded.canvas,
        nodos: turno.nodos,
        edges: turno.edges,
        motivo: turno.motivo,
      });
    }

    const now = new Date().toISOString();
    const extra: HiloLinea[] = [
      { id: `u-${now}`, role: 'user', text: parsed.data.mensaje.trim(), at: now },
      { id: `h-${now}`, role: 'horizonte', text: turno.reply, at: now },
    ];
    const canvasUi = mergeCanvasUiHilo(loaded.canvasUi, extra);
    await (loaded.supabase as any).from('obras').update({ canvas_ui: canvasUi }).eq('id', obraId);

    return NextResponse.json({
      success: true,
      data: {
        ...insert,
        reply: turno.reply,
        via: turno.via,
        hilo: canvasUi.hilo,
        anotoPaso: turno.anotoPaso,
        tareaId: turno.tareaId,
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
