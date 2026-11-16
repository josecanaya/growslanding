import { cargarObra, vistaContratista, vistaResponsable } from '@/lib/circuito/lecturas';
import { CircuitoError, UUID, responder, rolesEnObra, sesion } from '@/lib/circuito/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras/:id/circuito?corte=YYYY-MM-DD — estado del circuito según el rol de quien consulta.
 * Responsable, coordinador y auditor ven todo; el contratista solo su alcance. Los inversores usan /api/inversion.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return responder(async () => {
    const { id } = await params;
    if (!UUID.test(id)) throw new CircuitoError(404, 'Obra no encontrada.', 'GR404');
    const { user, db } = await sesion();
    const corte = new URL(request.url).searchParams.get('corte');
    if (corte && !/^\d{4}-\d{2}-\d{2}$/.test(corte)) throw new CircuitoError(422, 'corte debe ser YYYY-MM-DD', 'GR422');
    const roles = await rolesEnObra(db, id, user.id);
    if (roles.responsable || roles.coordinador || roles.auditor) return vistaResponsable(db, await cargarObra(db, id), roles, corte);
    if (roles.contratista) return vistaContratista(db, await cargarObra(db, id), roles.socio_ids, corte);
    throw new CircuitoError(403, 'Sin acceso a esta obra.', '42501');
  });
}
