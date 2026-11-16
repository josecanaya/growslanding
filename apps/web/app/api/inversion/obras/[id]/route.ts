import { getSessionUser } from '@/lib/auth/session-user';
import { cargarObra, fichaInversion } from '@/lib/circuito/lecturas';
import { CircuitoError, UUID, responder, type Db } from '@/lib/circuito/servidor';
import { readPublication } from '@/lib/obras/publication';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/inversion/obras/:id — ficha de inversión de una obra publicada en el feed. Con sesión agrega la posición propia. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return responder(async () => {
    const { id } = await params;
    if (!UUID.test(id)) throw new CircuitoError(404, 'Obra no encontrada.', 'GR404');
    const db = createServiceSupabaseClient() as Db;
    const m = await cargarObra(db, id);
    // Solo obras que el responsable publicó en el feed.
    if (!readPublication((m.obra.canvas_ui as { publication?: unknown } | null)?.publication)?.visible) throw new CircuitoError(404, 'Obra no publicada.', 'GR404');
    const user = await getSessionUser();
    return fichaInversion(m, user?.id ?? null);
  });
}
