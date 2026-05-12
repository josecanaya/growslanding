import { createServiceSupabaseClient } from '../supabase-server';

type MovimientoOwnerTipo = 'SOCIO' | 'ORG';

type SubtareaPagoRecord = {
  id: string;
  estado: string;
  tarea_id: string;
  socio_id: string | null;
  presupuesto_id?: string | null;
  monto_estimado?: number | null;
  tareas?: {
    id: string;
    org_id: string;
    responsable_socio_id: string | null;
  } | null;
};

type SaldoRecord = {
  id: string;
  saldo_actual: number;
  saldo_pendiente: number;
  moneda: string;
  suspendido?: boolean;
};

export class WalletMvpService {
  static async registrarPagoPorBloque(
    subtareaId: string,
    metodoPago: 'EFECTIVO' | 'ONLINE' = 'EFECTIVO',
  ) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(`
        id,
        estado,
        tarea_id,
        socio_id,
        presupuesto_id,
        monto_estimado,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id
        )
      `)
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !subtarea) {
      throw new Error('Subtarea no encontrada para registrar pago');
    }

    if (subtarea.estado !== 'validado') {
      throw new Error('Solo se acredita billetera cuando el bloque fue validado por el cliente');
    }

    const tarea = subtarea.tareas;
    if (!tarea) {
      throw new Error('La subtarea no tiene tarea asociada');
    }

    const socioId = subtarea.socio_id || tarea.responsable_socio_id;
    if (!socioId) {
      throw new Error('No hay socio asociado al bloque pagable');
    }

    await this.verificarSocioNoSuspendido(socioId);
    await this.assertMovimientoNoDuplicado(subtarea.id);

    const montoBruto = await this.obtenerMontoBrutoBloque(subtarea);
    if (montoBruto <= 0) {
      return;
    }

    await this.ensureSaldo('SOCIO', socioId);

    await this.crearMovimiento({
      owner_tipo: 'SOCIO',
      owner_id: socioId,
      tipo: 'CREDITO',
      estado: 'completado',
      tarea_id: tarea.id,
      subtarea_id: subtarea.id,
      presupuesto_id: subtarea.presupuesto_id,
      origen: 'VALIDACION_BLOQUE',
      concepto: `Pago por validación de bloque (${metodoPago})`,
      monto: montoBruto,
    });

    await this.ajustarSaldo('SOCIO', socioId, montoBruto);
  }

  static async obtenerSaldo(owner_tipo: MovimientoOwnerTipo, owner_id: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: saldo } = await supabaseAny
      .from('wallet_saldos')
      .select('id, saldo_actual, saldo_pendiente, moneda, suspendido')
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .maybeSingle();

    return (
      saldo || {
        id: '',
        saldo_actual: 0,
        saldo_pendiente: 0,
        moneda: 'ARS',
        suspendido: false,
      }
    );
  }

  private static async obtenerMontoBrutoBloque(subtarea: SubtareaPagoRecord): Promise<number> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const montoEstimado = Number(subtarea.monto_estimado ?? 0);
    if (Number.isFinite(montoEstimado) && montoEstimado > 0) {
      return montoEstimado;
    }

    if (subtarea.presupuesto_id) {
      const [{ data }, { count }] = await Promise.all([
        supabaseAny
        .from('tareas_presupuestos')
        .select('monto')
        .eq('id', subtarea.presupuesto_id)
          .maybeSingle(),
        supabaseAny
          .from('tareas_subtareas')
          .select('id', { count: 'exact', head: true })
          .eq('tarea_id', subtarea.tarea_id)
          .eq('presupuesto_id', subtarea.presupuesto_id),
      ]);
      const monto = Number(data?.monto ?? 0);
      const divisor = Math.max(1, Number(count ?? 0));
      return Number.isFinite(monto) ? Number((monto / divisor).toFixed(2)) : 0;
    }

    const { data: rows } = await supabaseAny
      .from('tareas_presupuestos')
      .select('monto, estado')
        .eq('tarea_id', subtarea.tarea_id)
      .eq('socio_id', subtarea.socio_id || subtarea.tareas?.responsable_socio_id || '')
      .order('created_at', { ascending: false })
      .limit(10);

    const aprobado = (rows ?? []).find((row: any) => String(row.estado ?? '').toUpperCase() === 'APROBADO');
    const monto = Number(aprobado?.monto ?? 0);
    return Number.isFinite(monto) ? monto : 0;
  }

  static async verificarSocioNoSuspendido(socioId: string) {
    const saldo = await this.obtenerSaldo('SOCIO', socioId);
    if (saldo.suspendido) {
      throw new Error('SOCIO_SUSPENDIDO');
    }
  }

  static async obtenerMovimientos(
    owner_tipo: MovimientoOwnerTipo,
    owner_id: string,
    limit = 50,
    offset = 0,
  ) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data, count, error } = await supabaseAny
      .from('wallet_movimientos')
      .select('*', { count: 'exact' })
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return {
      movimientos: data || [],
      total: count || 0,
    };
  }

  private static async crearMovimiento(payload: any) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { error } = await supabaseAny.from('wallet_movimientos').insert(payload);

    if (error) {
      throw new Error(`Error creando movimiento de wallet: ${error.message}`);
    }
  }

  private static async ensureSaldo(owner_tipo: MovimientoOwnerTipo, owner_id: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data } = await supabaseAny
      .from('wallet_saldos')
      .select('id')
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .maybeSingle();

    if (!data) {
      await supabaseAny.from('wallet_saldos').insert({
        owner_tipo,
        owner_id,
        saldo_actual: 0,
        saldo_pendiente: 0,
      });
    }
  }

  private static async ajustarSaldo(
    owner_tipo: MovimientoOwnerTipo,
    owner_id: string,
    delta: number,
  ): Promise<void> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data } = await supabaseAny
      .from('wallet_saldos')
      .select('id, saldo_actual')
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .maybeSingle();

    if (!data) {
      await this.ensureSaldo(owner_tipo, owner_id);
      return this.ajustarSaldo(owner_tipo, owner_id, delta);
    }

    await supabaseAny
      .from('wallet_saldos')
      .update({
        saldo_actual: Number((Number(data.saldo_actual || 0) + delta).toFixed(2)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
  }

  private static async assertMovimientoNoDuplicado(subtareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, socio_id, presupuesto_id, tareas:tareas(responsable_socio_id)')
      .eq('id', subtareaId)
      .maybeSingle();

    const socioId = subtarea?.socio_id || subtarea?.tareas?.responsable_socio_id || null;
    if (!subtarea?.tarea_id || !socioId) {
      return;
    }

    let query = supabaseAny
      .from('wallet_movimientos')
      .select('id')
      .eq('subtarea_id', subtarea.id)
      .eq('origen', 'VALIDACION_BLOQUE')
      .eq('owner_tipo', 'SOCIO')
      .eq('owner_id', socioId);

    const { data } = await query.limit(1);

    if (data && data.length > 0) {
      throw new Error('El bloque ya fue pagado previamente');
    }
  }
}
