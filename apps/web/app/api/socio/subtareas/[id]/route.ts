import { NextRequest, NextResponse } from 'next/server';

import { resolveSocioSession } from '@/lib/socio/resolve-socio-session';
import { SubtareasRepository, SUBTAREA_AHORA_SELECT } from '@/lib/tareas/infrastructure/subtareas.repository';
import { evidenciaPublicUrl } from '@/lib/cliente/evidencia-display';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/socio/subtareas/[id] — bloque completo o ?vista=evidencia */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const vista = request.nextUrl.searchParams.get('vista');

    if (vista === 'evidencia') {
      const row = await SubtareasRepository.findEvidenciaVista(id);
      if (!row) {
        return NextResponse.json({ ok: false, error: 'Subtarea no encontrada' }, { status: 404 });
      }
      const url = evidenciaPublicUrl(row.evidencia_url as string | null);
      return NextResponse.json({
        ok: true,
        evidencia_url: row.evidencia_url,
        evidencia_cargada: row.evidencia_cargada,
        publicUrl: url,
      });
    }

    const subtarea = await SubtareasRepository.findById(id, SUBTAREA_AHORA_SELECT);
    if (!subtarea) {
      return NextResponse.json({ ok: false, error: 'Subtarea no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, subtarea });
  } catch (e) {
    console.error('[GET /api/socio/subtareas/[id]]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
