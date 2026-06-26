import { createServiceSupabaseClient } from '../supabase-server';
import { SOCIO_RETIRO_CONFIG, sumarDiasLiquidacion } from '../wallet/socio-retiro.config';
import { WalletMvpService } from './wallet-mvp.service';
import { WalletService } from './wallet.service';

const toMoney = (value: number) => Math.round(value * 100) / 100;

type MetodoRetiroRow = {
  id: string;
  titular: string;
  banco: string | null;
  cvu: string | null;
  cbu: string | null;
  alias: string | null;
  es_principal: boolean;
};

export type SocioRetiroInfo = {
  saldo_actual: number;
  saldo_pendiente: number;
  moneda: string;
  retiro_disponible: number;
  limites: {
    montoMinimo: number;
    montoMaximoPorOperacion: number;
    montoMaximoDiario: number;
    montoRetiradoHoy: number;
    montoDisponibleHoy: number;
  };
  liquidacion: {
    diasCiclo: number;
    ultima_liquidacion_at: string | null;
    proxima_liquidacion_at: string | null;
    dias_hasta_proxima: number | null;
  };
  metodo_principal: MetodoRetiroRow | null;
  tiene_metodo_retiro: boolean;
};

export class SocioRetiroService {
  static async obtenerInfo(socioId: string): Promise<SocioRetiroInfo> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const [saldo, montoRetiradoHoy, metodo, fechas] = await Promise.all([
      WalletMvpService.obtenerSaldo('SOCIO', socioId),
      this.calcularRetiradoHoy(socioId),
      this.obtenerMetodoPrincipal(socioId),
      this.obtenerFechasLiquidacion(socioId),
    ]);

    const saldoActual = Number(saldo.saldo_actual ?? 0);
    const maxOp = Math.min(
      SOCIO_RETIRO_CONFIG.montoMaximoPorOperacion,
      saldoActual,
      Math.max(0, SOCIO_RETIRO_CONFIG.montoMaximoDiario - montoRetiradoHoy),
    );

    const proxima = fechas.proxima_liquidacion_at
      ? new Date(fechas.proxima_liquidacion_at)
      : sumarDiasLiquidacion(fechas.ultima_liquidacion_at ? new Date(fechas.ultima_liquidacion_at) : new Date());

    const diasHasta = Math.max(
      0,
      Math.ceil((proxima.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    return {
      saldo_actual: saldoActual,
      saldo_pendiente: Number(saldo.saldo_pendiente ?? 0),
      moneda: saldo.moneda ?? SOCIO_RETIRO_CONFIG.moneda,
      retiro_disponible: maxOp,
      limites: {
        montoMinimo: SOCIO_RETIRO_CONFIG.montoMinimo,
        montoMaximoPorOperacion: SOCIO_RETIRO_CONFIG.montoMaximoPorOperacion,
        montoMaximoDiario: SOCIO_RETIRO_CONFIG.montoMaximoDiario,
        montoRetiradoHoy,
        montoDisponibleHoy: Math.max(0, SOCIO_RETIRO_CONFIG.montoMaximoDiario - montoRetiradoHoy),
      },
      liquidacion: {
        diasCiclo: SOCIO_RETIRO_CONFIG.diasLiquidacionAutomatica,
        ultima_liquidacion_at: fechas.ultima_liquidacion_at,
        proxima_liquidacion_at: proxima.toISOString(),
        dias_hasta_proxima: diasHasta,
      },
      metodo_principal: metodo,
      tiene_metodo_retiro: Boolean(metodo),
    };
  }

  static async solicitarRetiroManual(socioId: string, montoInput: number) {
    const monto = toMoney(montoInput);
    const info = await this.obtenerInfo(socioId);

    if (!info.tiene_metodo_retiro) {
      throw new Error('METODO_RETIRO_REQUERIDO: cargá un CVU/CBU/Alias principal en Métodos de retiro');
    }

    if (monto < SOCIO_RETIRO_CONFIG.montoMinimo) {
      throw new Error(`RETIRO_MINIMO: el monto mínimo es $${SOCIO_RETIRO_CONFIG.montoMinimo.toLocaleString('es-AR')}`);
    }

    if (monto > info.retiro_disponible) {
      throw new Error(
        `RETIRO_EXCEDE_LIMITE: podés retirar hasta $${info.retiro_disponible.toLocaleString('es-AR')} (saldo y límites diarios)`,
      );
    }

    if (monto > info.saldo_actual) {
      throw new Error('SALDO_INSUFICIENTE');
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);

    const debito = await WalletService.crearDebito({
      owner_tipo: 'SOCIO',
      owner_id: socioId,
      monto,
      concepto: 'Retiro manual solicitado por el socio',
    });

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    await supabaseAny
      .from('wallet_movimientos')
      .update({ origen: 'RETIRO_MANUAL' })
      .eq('id', debito.id);

    const { data: retiro, error } = await supabaseAny
      .from('socio_retiros')
      .insert({
        socio_id: socioId,
        metodo_retiro_id: info.metodo_principal?.id ?? null,
        monto,
        tipo: 'manual',
        estado: 'pendiente',
        wallet_movimiento_id: debito.id,
        metadata: {
          titular: info.metodo_principal?.titular,
          banco: info.metodo_principal?.banco,
          destino: info.metodo_principal?.alias || info.metodo_principal?.cbu || info.metodo_principal?.cvu,
        },
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`No se pudo registrar el retiro: ${error.message}`);
    }

    return {
      retiro,
      saldo: await WalletMvpService.obtenerSaldo('SOCIO', socioId),
    };
  }

  static async ejecutarLiquidacionesQuincenales(limit = 200) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date().toISOString();

    const { data: candidatos, error } = await supabaseAny
      .from('wallet_saldos')
      .select('id, owner_id, saldo_actual, ultima_liquidacion_at, proxima_liquidacion_at')
      .eq('owner_tipo', 'SOCIO')
      .gt('saldo_actual', 0)
      .order('proxima_liquidacion_at', { ascending: true, nullsFirst: true })
      .limit(Math.min(Math.max(limit, 1), 500));

    if (error) {
      throw new Error(error.message);
    }

    const resultados: Array<{ socioId: string; ok: boolean; monto?: number; error?: string }> = [];

    for (const row of candidatos ?? []) {
      const socioId = String(row.owner_id);
      const debeLiquidar = this.debeLiquidar(
        row.proxima_liquidacion_at,
        row.ultima_liquidacion_at,
      );

      if (!debeLiquidar) {
        continue;
      }

      try {
        const monto = await this.liquidarSocioCompleto(socioId);
        resultados.push({ socioId, ok: true, monto });
      } catch (err) {
        resultados.push({
          socioId,
          ok: false,
          error: err instanceof Error ? err.message : 'Error interno',
        });
      }
    }

    const ok = resultados.filter((r) => r.ok).length;
    return {
      evaluados: candidatos?.length ?? 0,
      liquidados: ok,
      conError: resultados.length - ok,
      resultados,
      ejecutado_en: ahora,
    };
  }

  private static debeLiquidar(
    proxima: string | null,
    ultima: string | null,
  ): boolean {
    const ahora = Date.now();
    if (proxima) {
      return new Date(proxima).getTime() <= ahora;
    }
    if (ultima) {
      return sumarDiasLiquidacion(new Date(ultima)).getTime() <= ahora;
    }
    return true;
  }

  private static async liquidarSocioCompleto(socioId: string): Promise<number> {
    const info = await this.obtenerInfo(socioId);
    const monto = toMoney(info.saldo_actual);

    if (monto <= 0) {
      return 0;
    }

    if (!info.tiene_metodo_retiro) {
      throw new Error('Sin método de retiro configurado');
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);

    const debito = await WalletService.crearDebito({
      owner_tipo: 'SOCIO',
      owner_id: socioId,
      monto,
      concepto: `Liquidación quincenal automática (${SOCIO_RETIRO_CONFIG.diasLiquidacionAutomatica} días)`,
    });

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date();
    const proxima = sumarDiasLiquidacion(ahora);

    await supabaseAny
      .from('wallet_movimientos')
      .update({ origen: 'LIQUIDACION_QUINCENAL' })
      .eq('id', debito.id);

    await supabaseAny.from('socio_retiros').insert({
      socio_id: socioId,
      metodo_retiro_id: info.metodo_principal?.id ?? null,
      monto,
      tipo: 'liquidacion_quincenal',
      estado: 'pendiente',
      wallet_movimiento_id: debito.id,
      metadata: {
        titular: info.metodo_principal?.titular,
        banco: info.metodo_principal?.banco,
        destino: info.metodo_principal?.alias || info.metodo_principal?.cbu || info.metodo_principal?.cvu,
        ciclo_dias: SOCIO_RETIRO_CONFIG.diasLiquidacionAutomatica,
      },
    });

    await supabaseAny
      .from('wallet_saldos')
      .update({
        ultima_liquidacion_at: ahora.toISOString(),
        proxima_liquidacion_at: proxima.toISOString(),
        updated_at: ahora.toISOString(),
      })
      .eq('owner_tipo', 'SOCIO')
      .eq('owner_id', socioId);

    return monto;
  }

  private static async calcularRetiradoHoy(socioId: string): Promise<number> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const { data } = await supabaseAny
      .from('socio_retiros')
      .select('monto')
      .eq('socio_id', socioId)
      .eq('tipo', 'manual')
      .in('estado', ['pendiente', 'procesado'])
      .gte('created_at', inicioDia.toISOString());

    return (data ?? []).reduce((acc: number, row: { monto: number }) => acc + Number(row.monto ?? 0), 0);
  }

  private static async obtenerMetodoPrincipal(socioId: string): Promise<MetodoRetiroRow | null> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data } = await supabaseAny
      .from('socio_metodos_retiro')
      .select('id, titular, banco, cvu, cbu, alias, es_principal')
      .eq('socio_id', socioId)
      .eq('activo', true)
      .order('es_principal', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data ?? null;
  }

  private static async obtenerFechasLiquidacion(socioId: string): Promise<{
    ultima_liquidacion_at: string | null;
    proxima_liquidacion_at: string | null;
  }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data } = await supabaseAny
      .from('wallet_saldos')
      .select('ultima_liquidacion_at, proxima_liquidacion_at')
      .eq('owner_tipo', 'SOCIO')
      .eq('owner_id', socioId)
      .maybeSingle();

    return {
      ultima_liquidacion_at: data?.ultima_liquidacion_at ?? null,
      proxima_liquidacion_at: data?.proxima_liquidacion_at ?? null,
    };
  }
}
