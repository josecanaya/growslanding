import { ACCIONES } from '@/lib/circuito/acciones';
import { CircuitoError, UUID, claveIdempotencia, responder, sesion } from '@/lib/circuito/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/obras/:id/circuito/:accion — acciones del circuito de obra para los tres roles.
 * Idempotency-Key (opcional pero recomendada): el reintento con la misma clave devuelve el mismo resultado sin duplicar.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; accion: string }> }) {
  return responder(async () => {
    const { id, accion } = await params;
    const definicion = Object.hasOwn(ACCIONES, accion) ? ACCIONES[accion] : null;
    if (!definicion || !UUID.test(id)) throw new CircuitoError(404, 'Acción u obra inexistente.', 'GR404');
    const { user, db } = await sesion();
    const parsed = definicion.schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new CircuitoError(422, 'Datos inválidos: ' + parsed.error.issues.slice(0, 3).map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.') || 'cuerpo'} ${i.message}`).join('; '), 'GR422');
    }
    return definicion.run({ db, user, obraId: id, idem: claveIdempotencia(request) }, parsed.data);
  });
}
