import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadProyectoVivoForWrite } from '@/lib/proyecto-vivo/loadGrafoSnapshot';
import { aplicarPropuestasL0 } from '@/lib/proyecto-vivo/orquestador/aplicarPropuestasL0';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bodySchema = z
  .object({
    objetivo_texto: z.string().max(4000).optional(),
  })
  .optional();

/**
 * POST /api/obras/[id]/grafo/propuestas
 * Orquestador L0: inserta transformaciones `propuesta` + estados fantasma (actor agente).
 * No marca realizada. No crea tareas. No toca wallet.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: obraId } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const loaded = await loadProyectoVivoForWrite(obraId);
    if (!loaded.ok) return loaded.response;

    const objetivo =
      parsed.data?.objetivo_texto?.trim() || loaded.objetivoTexto || null;

    if (parsed.data?.objetivo_texto?.trim()) {
      await (loaded.supabase as any)
        .from('obras')
        .update({ objetivo_texto: parsed.data.objetivo_texto.trim() })
        .eq('id', obraId);
    }

    const result = await aplicarPropuestasL0({
      supabase: loaded.supabase,
      obraId,
      orgId: loaded.orgId,
      canvas: loaded.canvas,
      objetivoTexto: objetivo,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('[POST /grafo/propuestas]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
