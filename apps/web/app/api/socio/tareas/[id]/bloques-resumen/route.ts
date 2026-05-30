import { NextRequest, NextResponse } from 'next/server';

import { resolveSocioSession } from '@/lib/socio/resolve-socio-session';
import { SubtareasRepository } from '@/lib/tareas/infrastructure/subtareas.repository';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/socio/tareas/[id]/bloques-resumen */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveSocioSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const bloques = await SubtareasRepository.listResumenByTareaId(id);

    return NextResponse.json({ ok: true, bloques });
  } catch (e) {
    console.error('[GET /api/socio/tareas/[id]/bloques-resumen]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
