import { cargarObra, vistaContratista } from '@/lib/circuito/lecturas';
import { CircuitoError, responder, sesion } from '@/lib/circuito/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/socio/circuito — todo lo que el contratista tiene en curso: pedidos de cotización, contratos, tareas habilitadas, certificados y cobros. */
export async function GET(request: Request) {
  return responder(async () => {
    const { user, db } = await sesion();
    const corte = new URL(request.url).searchParams.get('corte');
    const socios = await db.from('socios').select('id').eq('user_id', user.id);
    if (socios.error) throw new CircuitoError(503, 'No se pudo leer tu perfil de contratista.');
    const socioIds = (socios.data ?? []).map((s) => s.id as string);
    if (!socioIds.length) return { socio_ids: [], obras: [] };
    const [invitaciones, contratos] = await Promise.all([
      db.from('solicitud_invitados').select('solicitudes_cotizacion(obra_id)').in('socio_id', socioIds),
      db.from('contratos').select('obra_id').in('socio_id', socioIds),
    ]);
    if (invitaciones.error || contratos.error) throw new CircuitoError(503, 'No se pudo leer tu trabajo.');
    const obraIds = [...new Set([
      ...(invitaciones.data ?? []).map((i) => (i as unknown as { solicitudes_cotizacion: { obra_id: string } }).solicitudes_cotizacion?.obra_id),
      ...(contratos.data ?? []).map((c) => c.obra_id as string),
    ].filter(Boolean))].sort();
    const obras = [];
    for (const obraId of obraIds) obras.push(await vistaContratista(db, await cargarObra(db, obraId), socioIds, corte));
    return { socio_ids: socioIds, obras };
  });
}
