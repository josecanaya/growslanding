import { createServiceSupabaseClient } from '../supabase-server';
import { obtenerConfigPlan, calcularComision } from './plan.service';

/**
 * Servicio para manejar operaciones de wallet
 */
export class WalletService {
  /**
   * Crea un crédito en wallet_movimientos y actualiza saldo
   */
  static async crearCredito(params: {
    owner_tipo: 'SOCIO' | 'ORG';
    owner_id: string;
    monto: number;
    concepto: string;
    tarea_id?: string;
    presupuesto_id?: string;
  }) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Crear movimiento
    const { data: movimiento, error: movimientoError } = await supabaseAny
      .from('wallet_movimientos')
      .insert({
        owner_tipo: params.owner_tipo,
        owner_id: params.owner_id,
        tipo: 'CREDITO',
        monto: params.monto,
        concepto: params.concepto,
        tarea_id: params.tarea_id ?? null,
        presupuesto_id: params.presupuesto_id ?? null,
        estado: 'completado',
      })
      .select()
      .single();

    if (movimientoError) {
      throw new Error(`Error creando crédito: ${movimientoError.message}`);
    }

    // Actualizar saldo
    await this.actualizarSaldo(params.owner_tipo, params.owner_id, params.monto, 'CREDITO');

    return movimiento;
  }

  /**
   * Crea un débito en wallet_movimientos y actualiza saldo
   */
  static async crearDebito(params: {
    owner_tipo: 'SOCIO' | 'ORG';
    owner_id: string;
    monto: number;
    concepto: string;
    tarea_id?: string;
    presupuesto_id?: string;
  }) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Crear movimiento
    const { data: movimiento, error: movimientoError } = await supabaseAny
      .from('wallet_movimientos')
      .insert({
        owner_tipo: params.owner_tipo,
        owner_id: params.owner_id,
        tipo: 'DEBITO',
        monto: params.monto,
        concepto: params.concepto,
        tarea_id: params.tarea_id ?? null,
        presupuesto_id: params.presupuesto_id ?? null,
        estado: 'completado',
      })
      .select()
      .single();

    if (movimientoError) {
      throw new Error(`Error creando débito: ${movimientoError.message}`);
    }

    // Actualizar saldo
    await this.actualizarSaldo(params.owner_tipo, params.owner_id, params.monto, 'DEBITO');

    return movimiento;
  }

  /**
   * Actualiza el saldo en wallet_saldos
   */
  private static async actualizarSaldo(
    owner_tipo: 'SOCIO' | 'ORG',
    owner_id: string,
    monto: number,
    tipo: 'CREDITO' | 'DEBITO'
  ) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener o crear saldo
    let { data: saldoData, error: saldoError } = await supabaseAny
      .from('wallet_saldos')
      .select('id, saldo_actual')
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .maybeSingle();

    if (!saldoData || saldoError) {
      // Crear saldo en cero si no existe
      const { data: nuevoSaldo, error: insertError } = await supabaseAny
        .from('wallet_saldos')
        .insert({
          owner_tipo,
          owner_id,
          saldo_actual: 0,
          saldo_pendiente: 0,
          moneda: 'ARS',
        })
        .select('id, saldo_actual')
        .single();

      if (insertError) {
        throw new Error(`Error creando saldo: ${insertError.message}`);
      }

      saldoData = nuevoSaldo;
    }

    // Calcular nuevo saldo
    const saldoAnterior = saldoData.saldo_actual ?? 0;
    const nuevoSaldo =
      tipo === 'CREDITO'
        ? saldoAnterior + monto
        : Math.max(0, saldoAnterior - monto);

    // Actualizar saldo
    const { error: updateError } = await supabaseAny
      .from('wallet_saldos')
      .update({
        saldo_actual: nuevoSaldo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saldoData.id);

    if (updateError) {
      throw new Error(`Error actualizando saldo: ${updateError.message}`);
    }
  }

  /**
   * Obtiene el saldo actual de un usuario (SOCIO o ORG)
   */
  static async obtenerSaldo(owner_tipo: 'SOCIO' | 'ORG', owner_id: string): Promise<{
    saldo_actual: number;
    saldo_pendiente: number;
    moneda: string;
  }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: saldo, error } = await supabaseAny
      .from('wallet_saldos')
      .select('saldo_actual, saldo_pendiente, moneda')
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .maybeSingle();

    if (error || !saldo) {
      // Si no existe, crear en cero y retornar
      await this.actualizarSaldo(owner_tipo, owner_id, 0, 'CREDITO');
      return {
        saldo_actual: 0,
        saldo_pendiente: 0,
        moneda: 'ARS',
      };
    }

    return {
      saldo_actual: saldo.saldo_actual ?? 0,
      saldo_pendiente: saldo.saldo_pendiente ?? 0,
      moneda: saldo.moneda || 'ARS',
    };
  }

  /**
   * Obtiene movimientos de wallet con paginación
   */
  static async obtenerMovimientos(
    owner_tipo: 'SOCIO' | 'ORG',
    owner_id: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    movimientos: any[];
    total: number;
  }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener movimientos
    const { data: movimientos, error, count } = await supabaseAny
      .from('wallet_movimientos')
      .select('*', { count: 'exact' })
      .eq('owner_tipo', owner_tipo)
      .eq('owner_id', owner_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error obteniendo movimientos: ${error.message}`);
    }

    return {
      movimientos: movimientos || [],
      total: count || 0,
    };
  }

  /**
   * Registra un pago completo por una tarea validada
   * Crea los movimientos necesarios y actualiza saldos
   */
  static async registrarPagoPorTarea(params: {
    tareaId: string;
    socioId: string;
    orgId: string;
    montoTotal: number;
    metodoPago?: 'EFECTIVO' | 'ONLINE';
    porcentajeComision?: number;
    presupuestoId?: string;
    escrowId?: string;
  }): Promise<{
    creditoSocio: any;
    debitoComision: any;
    creditoGrows: any;
  }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    try {
      // 1. Obtener configuración del plan
      const planConfig = await obtenerConfigPlan(params.orgId);

      // 2. Calcular comisión según plan o override
      const comision =
        typeof params.porcentajeComision === 'number'
          ? params.montoTotal * params.porcentajeComision
          : calcularComision(params.montoTotal, planConfig);
      const montoSocio = params.montoTotal - comision;

      // 3. Asegurar saldos existan
      await this.obtenerSaldo('SOCIO', params.socioId);
      await this.obtenerSaldo('ORG', params.orgId);

      // 4. Crear movimientos en orden

      // Crédito al socio (monto total - comisión)
      const creditoSocio = await this.crearCredito({
        owner_tipo: 'SOCIO',
        owner_id: params.socioId,
        monto: montoSocio,
        concepto: `Pago por tarea validada - Tarea ${params.tareaId}`,
        tarea_id: params.tareaId,
        presupuesto_id: params.presupuestoId,
      });

      // Débito del socio (comisión)
      const debitoComision = await this.crearDebito({
        owner_tipo: 'SOCIO',
        owner_id: params.socioId,
        monto: comision,
        concepto: `Comisión GROWS (${(planConfig.comisionFija || ((planConfig.comisionMin + planConfig.comisionMax) / 2)) * 100}%)`,
        tarea_id: params.tareaId,
        presupuesto_id: params.presupuestoId,
      });

      // Crédito a Grows (comisión)
      const creditoGrows = await this.crearCredito({
        owner_tipo: 'ORG',
        owner_id: params.orgId,
        monto: comision,
        concepto: `Comisión GROWS - Tarea ${params.tareaId}`,
        tarea_id: params.tareaId,
        presupuesto_id: params.presupuestoId,
      });

      // Actualizar campos adicionales que existen en wallet_movimientos real.
      const origen = 'VALIDACION_TAREA';

      const updates = [
        supabaseAny
          .from('wallet_movimientos')
          .update({
            origen: origen,
            escrow_id: params.escrowId || null,
          })
          .eq('id', creditoSocio.id),
        supabaseAny
          .from('wallet_movimientos')
          .update({
            origen: origen,
            escrow_id: params.escrowId || null,
          })
          .eq('id', debitoComision.id),
        supabaseAny
          .from('wallet_movimientos')
          .update({
            origen: origen,
            escrow_id: params.escrowId || null,
          })
          .eq('id', creditoGrows.id),
      ];

      await Promise.all(updates);

      console.log(`[WALLET] Pago registrado para tarea ${params.tareaId}: Socio=${montoSocio}, Comisión=${comision}`);

      return {
        creditoSocio,
        debitoComision,
        creditoGrows,
      };
    } catch (error) {
      console.error('[WALLET] Error registrando pago por tarea:', error);
      throw error;
    }
  }
}

