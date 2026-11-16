import { cargarObra, fichaInversion } from '@/lib/circuito/lecturas';
import { redondear } from '@/lib/circuito/finanzas';
import { CircuitoError, responder, sesion } from '@/lib/circuito/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/inversion/posicion — estado de los fondos ficticios del inversor y su posición por obra. */
export async function GET() {
  return responder(async () => {
    const { user, db } = await sesion();
    const [cuenta, posiciones, suscripciones] = await Promise.all([
      db.from('inversor_cuenta_movimientos').select('id, tipo, monto, obra_id, ref_id, descripcion, created_at').eq('user_id', user.id).order('created_at'),
      db.from('mcu_posiciones').select('obra_id').eq('user_id', user.id),
      db.from('mcu_suscripciones').select('obra_id, monto, estado').eq('user_id', user.id),
    ]);
    if (cuenta.error || posiciones.error || suscripciones.error) throw new CircuitoError(503, 'No se pudo leer tu cuenta.');
    const subs = suscripciones.data ?? [];
    const total = (estado: string) => redondear(subs.filter((s) => s.estado === estado).reduce((s, x) => s + Number(x.monto), 0));
    const obraIds = [...new Set([...(posiciones.data ?? []).map((p) => p.obra_id as string), ...subs.map((s) => s.obra_id as string)])].sort();
    const obras = [];
    for (const obraId of obraIds) {
      const ficha = fichaInversion(await cargarObra(db, obraId), user.id);
      obras.push({ obra: ficha.obra, ronda: ficha.ronda && { numero: ficha.ronda.numero, estado: ficha.ronda.estado }, avance_verificado: ficha.avance_verificado,
        planificacion: ficha.planificacion, fondos_obra: ficha.fondos_obra, mi_posicion: ficha.mi_posicion, mercado_secundario: ficha.mercado_secundario });
    }
    const movimientos = (cuenta.data ?? []).map((x) => ({ ...x, monto: Number(x.monto) }));
    return {
      moneda: 'USD ficticio (ensayo)',
      fondos: {
        saldo_disponible: redondear(movimientos.reduce((s, x) => s + x.monto, 0)),
        // Estados separados: lo prometido no salió de la cuenta; lo integrado está en custodia; lo asignado ya es caja de obra.
        prometido_sin_integrar: total('prometida'), en_custodia_de_ronda: total('integrada'), aplicado_a_obras: total('asignada'), devuelto: total('devuelta'),
      },
      movimientos, obras,
    };
  });
}
