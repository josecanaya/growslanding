import { createServiceSupabaseClient } from '../supabase-server';
import { calcularComision, obtenerConfigPlan } from './plan.service';
import { WalletService } from './wallet.service';

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
      throw new Error('MONTO_BLOQUE_INVALIDO: no hay monto para acreditar al socio');
    }

    const orgId = tarea.org_id;
    const plan = orgId ? await obtenerConfigPlan(orgId) : null;
    const comision = plan ? calcularComision(montoBruto, plan) : 0;
    const montoNeto = Number(Math.max(0, montoBruto - comision).toFixed(2));
    if (montoNeto <= 0) {
      throw new Error('MONTO_NETO_INVALIDO: la comisión consume todo el pago del bloque');
    }

    const creditoSocio = await WalletService.crearCredito({
      owner_tipo: 'SOCIO',
      owner_id: socioId,
      monto: montoNeto,
      concepto: `Pago por validación de bloque (${metodoPago})`,
      tarea_id: tarea.id,
      presupuesto_id: subtarea.presupuesto_id ?? undefined,
    });

    await this.marcarMovimientoBloque(creditoSocio.id, {
      subtareaId: subtarea.id,
      metodoPago,
    });

    if (comision > 0 && orgId) {
      const comisionRedondeada = Number(comision.toFixed(2));
      const creditoOrg = await WalletService.crearCredito({
        owner_tipo: 'ORG',
        owner_id: orgId,
        monto: comisionRedondeada,
        concepto: `Comisión GROWS por bloque validado`,
        tarea_id: tarea.id,
        presupuesto_id: subtarea.presupuesto_id ?? undefined,
      });

      // Sin subtarea_id en ORG: evita colisión UNIQUE (subtarea_id, tipo) con el crédito del socio.
      await this.marcarMovimientoBloque(creditoOrg.id, { metodoPago });
    }
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

    const socioFiltro = subtarea.socio_id || subtarea.tareas?.responsable_socio_id || null;

    let q = supabaseAny
      .from('tareas_presupuestos')
      .select('monto, estado')
      .eq('tarea_id', subtarea.tarea_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (socioFiltro) {
      q = q.eq('socio_id', socioFiltro);
    }

    const { data: rows } = await q;

    const aprobado = (rows ?? []).find((row: any) => String(row.estado ?? '').toUpperCase() === 'APROBADO');
    const monto = Number(aprobado?.monto ?? 0);
    if (!Number.isFinite(monto) || monto <= 0) {
      return 0;
    }
    const { count } = await supabaseAny
      .from('tareas_subtareas')
      .select('id', { count: 'exact', head: true })
      .eq('tarea_id', subtarea.tarea_id);
    const divisor = Math.max(1, Number(count ?? 0));
    return Number((monto / divisor).toFixed(2));
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

  private static async marcarMovimientoBloque(
    movimientoId: string,
    params: { subtareaId?: string; metodoPago: 'EFECTIVO' | 'ONLINE' },
  ) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const patch: Record<string, unknown> = {
      origen: 'VALIDACION_BLOQUE',
    };
    if (params.subtareaId) {
      patch.subtarea_id = params.subtareaId;
    }

    const { error } = await supabaseAny
      .from('wallet_movimientos')
      .update(patch)
      .eq('id', movimientoId);

    if (error) {
      console.warn('[WalletMvpService] No se pudo marcar movimiento de bloque:', error.message);
      return;
    }

    if (params.metodoPago) {
      const { error: metodoError } = await supabaseAny
        .from('wallet_movimientos')
        .update({ metodo_pago: params.metodoPago })
        .eq('id', movimientoId);
      if (metodoError) {
        console.warn('[WalletMvpService] metodo_pago no disponible:', metodoError.message);
      }
    }
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

    const { data } = await supabaseAny
      .from('wallet_movimientos')
      .select('id')
      .eq('subtarea_id', subtarea.id)
      .eq('origen', 'VALIDACION_BLOQUE')
      .eq('owner_tipo', 'SOCIO')
      .eq('owner_id', socioId)
      .limit(1);

    if (data && data.length > 0) {
      throw new Error('El bloque ya fue pagado previamente');
    }
  }
}
