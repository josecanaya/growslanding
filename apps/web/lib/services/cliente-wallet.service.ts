import { createServiceSupabaseClient } from '../supabase-server';
import { calcularComision, obtenerConfigPlan } from './plan.service';
import { WalletService } from './wallet.service';
import { WalletMvpService } from './wallet-mvp.service';

export type ClienteWalletSaldo = {
  id: string;
  org_id: string;
  cliente_user_id: string | null;
  saldo_disponible: number;
  saldo_reservado: number;
  moneda: string;
  created_at: string;
  updated_at: string;
};

type MontoTarea = {
  monto: number;
  presupuestoId: string | null;
  socioId: string | null;
};

const toMoney = (value: number) => Math.round(value * 100) / 100;

function assertMontoValido(monto: number) {
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('MONTO_INVALIDO');
  }
}

export class ClienteWalletService {
  static async getOrCreateWallet(orgId: string, clienteUserId: string | null): Promise<ClienteWalletSaldo> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny.rpc('ensure_cliente_wallet', {
      p_org_id: orgId,
      p_cliente_user_id: clienteUserId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.mapSaldo(data);
  }

  static async getSaldo(orgId: string): Promise<ClienteWalletSaldo> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny
      .from('cliente_wallets')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return this.getOrCreateWallet(orgId, null);
    }

    return this.mapSaldo(data);
  }

  static async listarMovimientos(orgId: string, limit = 50, offset = 0) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const wallet = await this.getSaldo(orgId);
    const { data, count, error } = await supabaseAny
      .from('cliente_wallet_movimientos')
      .select('*', { count: 'exact' })
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (error) {
      throw new Error(error.message);
    }

    return {
      movimientos: data ?? [],
      total: count ?? 0,
      limit: safeLimit,
      offset: safeOffset,
    };
  }

  static async acreditarSaldoManual(
    orgId: string,
    monto: number,
    descripcion = 'Carga manual de prueba',
    clienteUserId: string | null = null,
  ): Promise<ClienteWalletSaldo> {
    const montoOk = toMoney(monto);
    assertMontoValido(montoOk);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc('cliente_wallet_acreditar_manual', {
      p_org_id: orgId,
      p_cliente_user_id: clienteUserId,
      p_monto: montoOk,
      p_descripcion: descripcion,
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.mapSaldo(data);
  }

  static async reservarSaldoParaTarea(
    orgId: string,
    tareaId: string,
    monto?: number,
    clienteUserId: string | null = null,
  ): Promise<ClienteWalletSaldo> {
    const montoTarea = await this.resolverMontoTarea(orgId, tareaId, monto);
    const montoOk = toMoney(montoTarea.monto);
    assertMontoValido(montoOk);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc('cliente_wallet_reservar_tarea', {
      p_org_id: orgId,
      p_cliente_user_id: clienteUserId,
      p_tarea_id: tareaId,
      p_monto: montoOk,
      p_descripcion: montoTarea.presupuestoId
        ? `Reserva por presupuesto aprobado ${montoTarea.presupuestoId}`
        : 'Reserva manual de saldo para tarea',
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.mapSaldo(data);
  }

  static async liberarPagoDeTarea(
    orgId: string,
    tareaId: string,
    socioId: string | null,
    monto?: number,
  ): Promise<ClienteWalletSaldo> {
    const montoTarea = await this.resolverMontoTarea(orgId, tareaId, monto);
    const socioFinal = socioId ?? montoTarea.socioId;
    if (!socioFinal) {
      throw new Error('SOCIO_REQUERIDO');
    }

    const montoTotal = toMoney(montoTarea.monto);
    assertMontoValido(montoTotal);

    const plan = await obtenerConfigPlan(orgId);
    const comision = toMoney(Math.min(montoTotal, calcularComision(montoTotal, plan)));
    const montoSocio = toMoney(montoTotal - comision);
    assertMontoValido(montoSocio);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc('cliente_wallet_liberar_tarea', {
      p_org_id: orgId,
      p_tarea_id: tareaId,
      p_socio_id: socioFinal,
      p_monto_total: montoTotal,
      p_monto_pago: montoSocio,
      p_monto_comision: comision,
      p_descripcion: `Pago liberado al socio ${socioFinal}`,
    });

    if (error) {
      throw new Error(error.message);
    }

    await this.creditarWalletSocioSiHaceFalta({
      socioId: socioFinal,
      tareaId,
      presupuestoId: montoTarea.presupuestoId,
      monto: montoSocio,
    });

    return this.mapSaldo(data);
  }

  static async descontarPagoDeSubtareaValidada(params: {
    orgId: string;
    tareaId: string;
    subtareaId: string;
    clienteUserId: string | null;
    socioId?: string | null;
  }): Promise<ClienteWalletSaldo> {
    return this.debitarPorBloqueValidado({
      orgId: params.orgId,
      tareaId: params.tareaId,
      subtareaId: params.subtareaId,
      clienteUserId: params.clienteUserId,
      socioId: params.socioId,
    });
  }

  /**
   * Descuenta saldo del cliente por bloque validado (referencia por subtarea, no por tarea entera).
   */
  static async debitarPorBloqueValidado(params: {
    orgId: string;
    tareaId: string;
    subtareaId: string;
    clienteUserId: string | null;
    socioId?: string | null;
  }): Promise<ClienteWalletSaldo> {
    const montoBloque = await this.resolverMontoSubtarea(
      params.orgId,
      params.subtareaId,
      params.socioId,
    );
    const montoTotal = toMoney(montoBloque.monto);
    assertMontoValido(montoTotal);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: existente } = await supabaseAny
      .from('cliente_wallet_movimientos')
      .select('id')
      .eq('org_id', params.orgId)
      .eq('referencia_tipo', 'subtarea')
      .eq('referencia_id', params.subtareaId)
      .eq('tipo', 'LIBERACION_PAGO')
      .eq('estado', 'confirmado')
      .limit(1);

    if (existente?.length) {
      return this.getSaldo(params.orgId);
    }

    const wallet = await this.getOrCreateWallet(params.orgId, params.clienteUserId);

    const { data: locked, error: lockError } = await supabaseAny
      .from('cliente_wallets')
      .select('id, saldo_disponible, saldo_reservado')
      .eq('id', wallet.id)
      .maybeSingle();

    if (lockError || !locked) {
      throw new Error('WALLET_NO_ENCONTRADA');
    }

    const saldoDisponible = Number(locked.saldo_disponible ?? 0);
    if (saldoDisponible < montoTotal) {
      throw new Error(
        `SALDO_INSUFICIENTE: necesitás ${montoTotal} ARS disponibles (tenés ${saldoDisponible}). Cargá saldo en Billetera.`,
      );
    }

    const plan = await obtenerConfigPlan(params.orgId);
    const comision = toMoney(Math.min(montoTotal, calcularComision(montoTotal, plan)));
    const montoPagoSocio = toMoney(montoTotal - comision);
    assertMontoValido(montoPagoSocio);

    const { error: updateError } = await supabaseAny
      .from('cliente_wallets')
      .update({
        saldo_disponible: toMoney(saldoDisponible - montoTotal),
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const socioFinal = montoBloque.socioId;
    const { error: movError } = await supabaseAny.from('cliente_wallet_movimientos').insert({
      wallet_id: wallet.id,
      org_id: params.orgId,
      tipo: 'LIBERACION_PAGO',
      monto: montoPagoSocio,
      estado: 'confirmado',
      referencia_tipo: 'subtarea',
      referencia_id: params.subtareaId,
      descripcion: `Pago por bloque validado ${params.subtareaId}`,
      metadata: {
        tarea_id: params.tareaId,
        socio_id: socioFinal,
        monto_total: montoTotal,
        comision,
      },
    });

    if (movError) {
      throw new Error(movError.message);
    }

    if (comision > 0) {
      await supabaseAny.from('cliente_wallet_movimientos').insert({
        wallet_id: wallet.id,
        org_id: params.orgId,
        tipo: 'COMISION_GROWS',
        monto: comision,
        estado: 'confirmado',
        referencia_tipo: 'subtarea',
        referencia_id: params.subtareaId,
        descripcion: 'Comisión GROWS por bloque validado',
        metadata: { tarea_id: params.tareaId, socio_id: socioFinal },
      });
    }

    return this.getSaldo(params.orgId);
  }

  static async reconciliarSubtareaValidada(params: {
    subtareaId: string;
    clienteUserId: string | null;
    metodoPago?: 'EFECTIVO' | 'ONLINE';
  }) {
    const contexto = await this.obtenerContextoSubtareaValidada(params.subtareaId);
    const metodoPago = params.metodoPago ?? 'ONLINE';

    const montoInfo = await this.resolverMontoSubtarea(
      contexto.orgId,
      params.subtareaId,
      contexto.socioId,
    );
    if (montoInfo.monto <= 0) {
      throw new Error(
        'MONTO_BLOQUE_INVALIDO: el bloque no tiene monto estimado ni presupuesto aprobado para registrar el pago',
      );
    }

    let socioOk = false;
    let socioError: string | null = null;
    try {
      await WalletMvpService.registrarPagoPorBloque(params.subtareaId, metodoPago);
      socioOk = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error acreditando socio';
      if (msg.includes('ya fue pagado')) {
        socioOk = true;
      } else {
        socioError = msg;
      }
    }

    let clienteOk = metodoPago === 'EFECTIVO';
    let clienteError: string | null = null;
    const clienteOmitido = metodoPago === 'EFECTIVO';

    if (metodoPago === 'ONLINE') {
      try {
        await this.debitarPorBloqueValidado({
          orgId: contexto.orgId,
          tareaId: contexto.tareaId,
          subtareaId: params.subtareaId,
          clienteUserId: params.clienteUserId,
          socioId: contexto.socioId,
        });
        clienteOk = true;
      } catch (error) {
        clienteError = error instanceof Error ? error.message : 'Error descontando wallet cliente';
      }
    }

    if (!socioOk || !clienteOk) {
      throw new Error(
        `RECONCILIACION_INCOMPLETA:${JSON.stringify({
          subtareaId: params.subtareaId,
          metodoPago,
          montoBloque: montoInfo.monto,
          socioOk,
          clienteOk,
          clienteOmitido,
          socioError,
          clienteError,
        })}`,
      );
    }

    return {
      subtareaId: params.subtareaId,
      orgId: contexto.orgId,
      socioId: contexto.socioId,
      metodoPago,
      montoBloque: montoInfo.monto,
      socioOk,
      clienteOk,
      clienteOmitido,
    };
  }

  static async reconciliarSubtareasValidadasOrg(orgId: string, clienteUserId: string | null, limit = 200) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tareas!inner(org_id)')
      .eq('estado', 'validado')
      .eq('tareas.org_id', orgId)
      .order('updated_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 500));

    if (error) {
      throw new Error(error.message);
    }

    const resultados: Array<{ subtareaId: string; ok: boolean; error?: string }> = [];
    for (const row of data ?? []) {
      try {
        await this.reconciliarSubtareaValidada({
          subtareaId: row.id,
          clienteUserId,
        });
        resultados.push({ subtareaId: row.id, ok: true });
      } catch (error) {
        resultados.push({
          subtareaId: row.id,
          ok: false,
          error: error instanceof Error ? error.message : 'Error interno',
        });
      }
    }

    const ok = resultados.filter((r) => r.ok).length;
    return {
      procesadas: resultados.length,
      ok,
      conError: resultados.length - ok,
      resultados,
    };
  }

  static async devolverReserva(orgId: string, referenciaId: string): Promise<ClienteWalletSaldo> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc('cliente_wallet_devolver_reserva', {
      p_org_id: orgId,
      p_referencia_id: referenciaId,
      p_descripcion: 'Devolución de reserva solicitada por cliente',
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.mapSaldo(data);
  }

  static async registrarComisionGrows(
    orgId: string,
    referenciaId: string,
    monto: number,
  ): Promise<void> {
    const wallet = await this.getSaldo(orgId);
    const montoOk = toMoney(monto);
    assertMontoValido(montoOk);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { error } = await supabaseAny.from('cliente_wallet_movimientos').insert({
      wallet_id: wallet.id,
      org_id: orgId,
      tipo: 'COMISION_GROWS',
      monto: montoOk,
      estado: 'confirmado',
      referencia_tipo: 'manual',
      referencia_id: referenciaId,
      descripcion: 'Comisión GROWS registrada manualmente',
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private static async resolverMontoTarea(
    orgId: string,
    tareaId: string,
    montoManual?: number,
  ): Promise<MontoTarea> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, org_id, responsable_socio_id')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tarea || tarea.org_id !== orgId) {
      throw new Error('TAREA_NO_ENCONTRADA');
    }

    const { data: presupuestos, error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, monto, socio_id, estado, created_at')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (presupuestoError) {
      throw new Error(presupuestoError.message);
    }

    const aprobado = (presupuestos ?? []).find((p: any) => String(p.estado ?? '').toUpperCase() === 'APROBADO');
    if (aprobado) {
      return {
        monto: Number(aprobado.monto ?? 0),
        presupuestoId: aprobado.id ?? null,
        socioId: aprobado.socio_id ?? tarea.responsable_socio_id ?? null,
      };
    }

    if (typeof montoManual === 'number') {
      return {
        monto: montoManual,
        presupuestoId: null,
        socioId: tarea.responsable_socio_id ?? null,
      };
    }

    throw new Error('PRESUPUESTO_APROBADO_REQUERIDO');
  }

  private static async resolverMontoSubtarea(
    orgId: string,
    subtareaId: string,
    socioIdHint?: string | null,
  ): Promise<MontoTarea & { socioId: string }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(
        `
        id,
        tarea_id,
        socio_id,
        presupuesto_id,
        monto_estimado,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id
        )
      `,
      )
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !subtarea || subtarea.tareas?.org_id !== orgId) {
      throw new Error('SUBTAREA_NO_ENCONTRADA');
    }

    const socioId = socioIdHint ?? subtarea.socio_id ?? subtarea.tareas?.responsable_socio_id ?? null;
    if (!socioId) {
      throw new Error('SOCIO_REQUERIDO');
    }

    const montoEstimado = Number(subtarea.monto_estimado ?? 0);
    if (Number.isFinite(montoEstimado) && montoEstimado > 0) {
      return {
        monto: montoEstimado,
        presupuestoId: subtarea.presupuesto_id ?? null,
        socioId,
      };
    }

    if (subtarea.presupuesto_id) {
      const { data: presupuesto, error: presupuestoError } = await supabaseAny
        .from('tareas_presupuestos')
        .select('id, monto')
        .eq('id', subtarea.presupuesto_id)
        .maybeSingle();

      if (presupuestoError) {
        throw new Error(presupuestoError.message);
      }

      return {
        monto: await this.calcularMontoPresupuestoPorBloque(subtarea.tarea_id, subtarea.presupuesto_id, Number(presupuesto?.monto ?? 0)),
        presupuestoId: presupuesto?.id ?? subtarea.presupuesto_id,
        socioId,
      };
    }

    const resolved = await this.resolverMontoTarea(orgId, subtarea.tarea_id);
    const { count } = await supabaseAny
      .from('tareas_subtareas')
      .select('id', { count: 'exact', head: true })
      .eq('tarea_id', subtarea.tarea_id);
    const divisor = Math.max(1, Number(count ?? 0));
    return {
      monto: Number((resolved.monto / divisor).toFixed(2)),
      presupuestoId: resolved.presupuestoId,
      socioId: resolved.socioId ?? socioId,
    };
  }

  private static async obtenerContextoSubtareaValidada(subtareaId: string): Promise<{
    orgId: string;
    tareaId: string;
    socioId: string;
  }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data: subtarea, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(
        `
        id,
        tarea_id,
        estado,
        socio_id,
        tareas:tareas (
          org_id,
          responsable_socio_id
        )
      `,
      )
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !subtarea) {
      throw new Error('SUBTAREA_NO_ENCONTRADA');
    }
    if (subtarea.estado !== 'validado') {
      throw new Error('SUBTAREA_NO_VALIDADA');
    }

    const orgId = subtarea.tareas?.org_id;
    const tareaId = subtarea.tarea_id as string | undefined;
    const socioId = subtarea.socio_id ?? subtarea.tareas?.responsable_socio_id ?? null;
    if (!orgId) {
      throw new Error('ORG_NO_ENCONTRADA');
    }
    if (!tareaId) {
      throw new Error('TAREA_NO_ENCONTRADA');
    }
    if (!socioId) {
      throw new Error('SOCIO_REQUERIDO');
    }

    return { orgId, tareaId, socioId };
  }

  private static async calcularMontoPresupuestoPorBloque(
    tareaId: string,
    presupuestoId: string,
    montoPresupuesto: number,
  ): Promise<number> {
    if (!Number.isFinite(montoPresupuesto) || montoPresupuesto <= 0) {
      return 0;
    }
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { count } = await supabaseAny
      .from('tareas_subtareas')
      .select('id', { count: 'exact', head: true })
      .eq('tarea_id', tareaId)
      .eq('presupuesto_id', presupuestoId);
    let divisor = Math.max(1, Number(count ?? 0));
    if (divisor <= 1) {
      const { count: totalTarea } = await supabaseAny
        .from('tareas_subtareas')
        .select('id', { count: 'exact', head: true })
        .eq('tarea_id', tareaId);
      divisor = Math.max(1, Number(totalTarea ?? 0));
    }
    return Number((montoPresupuesto / divisor).toFixed(2));
  }

  private static async creditarWalletSocioSiHaceFalta(params: {
    socioId: string;
    tareaId: string;
    presupuestoId: string | null;
    monto: number;
  }) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const { data: existente } = await supabaseAny
      .from('wallet_movimientos')
      .select('id')
      .eq('owner_tipo', 'SOCIO')
      .eq('owner_id', params.socioId)
      .eq('tarea_id', params.tareaId)
      .eq('origen', 'CLIENTE_WALLET_LIBERACION')
      .limit(1);

    if (existente && existente.length > 0) {
      return;
    }

    const movimiento = await WalletService.crearCredito({
      owner_tipo: 'SOCIO',
      owner_id: params.socioId,
      monto: params.monto,
      concepto: `Pago liberado desde billetera cliente - Tarea ${params.tareaId}`,
      tarea_id: params.tareaId,
      presupuesto_id: params.presupuestoId ?? undefined,
    });

    await supabaseAny
      .from('wallet_movimientos')
      .update({ origen: 'CLIENTE_WALLET_LIBERACION' })
      .eq('id', movimiento.id);
  }

  private static mapSaldo(row: any): ClienteWalletSaldo {
    return {
      id: String(row.id),
      org_id: String(row.org_id),
      cliente_user_id: row.cliente_user_id ?? null,
      saldo_disponible: Number(row.saldo_disponible ?? 0),
      saldo_reservado: Number(row.saldo_reservado ?? 0),
      moneda: row.moneda ?? 'ARS',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
