import { createServiceSupabaseClient } from '../supabase-server';

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
}

