import { createServiceSupabaseClient } from '../supabase-server';
import { obtenerConfigPlan, calcularPorcentajePlan } from './plan.service';

type MovimientoOwnerTipo = 'SOCIO' | 'ORG';

type SubtareaPagoRecord = {
  id: string;
  estado: string;
  monto_estimado: number | null;
  tarea_id: string;
  socio_id: string | null;
  presupuesto_id?: string | null;
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
        monto_estimado,
        tarea_id,
        socio_id,
        presupuesto_id,
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

    const planConfig = await obtenerConfigPlan(tarea.org_id);
    const montoBruto = subtarea.monto_estimado ?? 0;
    if (montoBruto <= 0) {
      throw new Error('El bloque no tiene monto estimado para pagar');
    }

    const porcentaje = calcularPorcentajePlan(planConfig);
    const montoComision = Number((montoBruto * porcentaje).toFixed(2));
    const montoNeto = Number((montoBruto - montoComision).toFixed(2));

    await this.ensureSaldo('SOCIO', socioId);
    await this.ensureSaldo('ORG', tarea.org_id);

    await this.crearMovimiento({
      owner_tipo: 'SOCIO',
      owner_id: socioId,
      tipo: 'CREDITO',
      metodo_pago: metodoPago,
      estado: 'completado',
      tarea_id: tarea.id,
      subtarea_id: subtarea.id,
      presupuesto_id: subtarea.presupuesto_id,
      origen: 'VALIDACION_BLOQUE',
      descripcion: `Pago bloque ${subtarea.id}`,
      plan_aplicado: planConfig.plan,
      porcentaje_comision: porcentaje,
      reputacion_factor: null,
      oferta_demanda_factor: null,
      monto_bruto: montoBruto,
      monto_comision: montoComision,
      monto_neto: montoNeto,
    });

    await this.ajustarSaldo('SOCIO', socioId, montoNeto);

    await this.crearMovimiento({
      owner_tipo: 'ORG',
      owner_id: tarea.org_id,
      tipo: 'CREDITO',
      metodo_pago: metodoPago,
      estado: 'completado',
      tarea_id: tarea.id,
      subtarea_id: subtarea.id,
      presupuesto_id: subtarea.presupuesto_id,
      origen: 'COMISION',
      descripcion: `Comision bloque ${subtarea.id}`,
      plan_aplicado: planConfig.plan,
      porcentaje_comision: porcentaje,
      reputacion_factor: null,
      oferta_demanda_factor: null,
      monto_bruto: montoComision,
      monto_comision: 0,
      monto_neto: montoComision,
    });

    await this.ajustarSaldo('ORG', tarea.org_id, montoComision);
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

    const { data } = await supabaseAny
      .from('wallet_movimientos')
      .select('id')
      .eq('subtarea_id', subtareaId)
      .eq('origen', 'VALIDACION_BLOQUE')
      .eq('owner_tipo', 'SOCIO')
      .limit(1);

    if (data && data.length > 0) {
      throw new Error('El bloque ya fue pagado previamente');
    }
  }
}
