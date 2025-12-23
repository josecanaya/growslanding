import { createServiceSupabaseClient } from '../supabase-server';
import { obtenerConfigPlan, calcularComision } from './plan.service';
import { WalletService } from './wallet.service';
import { createTaskEscrowPreference } from '../payments/mercadopago';

export type EscrowEstado = 'pendiente' | 'retenido' | 'liberado' | 'reembolsado' | 'cancelado';

export interface EscrowTransaccion {
  id: string;
  tarea_id: string;
  presupuesto_id?: string | null;
  socio_id: string;
  org_id: string;
  cliente_id?: string | null;
  monto_total: number;
  monto_comision: number;
  monto_socio: number;
  moneda: string;
  estado: EscrowEstado;
  mp_preference_id?: string | null;
  mp_payment_id?: string | null;
  mp_status?: string | null;
  mp_raw_payload?: any;
  proveedor: string;
  fecha_deposito?: string | null;
  fecha_liberacion?: string | null;
  fecha_reembolso?: string | null;
  motivo_reembolso?: string | null;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CrearIntentoPagoTareaInput {
  tareaId: string;
  socioId: string;
  orgId: string;
  clienteId?: string;
  montoTotal: number;
  moneda?: string;
  proveedor?: 'MERCADOPAGO';
  presupuestoId?: string;
}

export interface CrearIntentoPagoTareaOutput {
  escrowId: string;
  checkoutUrl: string;
  mpPreferenceId: string;
}

/**
 * Servicio para manejar transacciones de ESCROW (retención de fondos para tareas)
 */
export class EscrowService {
  /**
   * Crea un intento de pago para una tarea (crea preferencia MP y registro en escrow)
   */
  static async crearIntentoPagoTarea(
    input: CrearIntentoPagoTareaInput
  ): Promise<CrearIntentoPagoTareaOutput> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // 1. Validar que la tarea existe y obtener información básica
    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, obra_id, org_id, title')
      .eq('id', input.tareaId)
      .maybeSingle();

    if (tareaError || !tarea) {
      throw new Error(`Tarea no encontrada: ${input.tareaId}`);
    }

    // Validar que la tarea pertenece a la organización
    if (tarea.org_id !== input.orgId) {
      throw new Error('La tarea no pertenece a la organización especificada');
    }

    // 2. Obtener configuración del plan para calcular comisión
    const planConfig = await obtenerConfigPlan(input.orgId);
    const comision = calcularComision(input.montoTotal, planConfig);
    const montoSocio = input.montoTotal - comision;

    // 3. Crear preferencia de MercadoPago para esta tarea
    const mpPreference = await createTaskEscrowPreference({
      tareaId: input.tareaId,
      socioId: input.socioId,
      orgId: input.orgId,
      clienteId: input.clienteId,
      montoTotal: input.montoTotal,
      moneda: input.moneda || 'ARS',
      descripcion: `Pago de tarea: ${tarea.title || input.tareaId}`,
    });

    // 4. Crear registro en escrow_transacciones
    const { data: escrowData, error: escrowError } = await supabaseAny
      .from('escrow_transacciones')
      .insert({
        tarea_id: input.tareaId,
        presupuesto_id: input.presupuestoId || null,
        socio_id: input.socioId,
        org_id: input.orgId,
        cliente_id: input.clienteId || null,
        monto_total: input.montoTotal,
        monto_comision: comision,
        monto_socio: montoSocio,
        moneda: input.moneda || 'ARS',
        estado: 'pendiente',
        mp_preference_id: mpPreference.preferenceId,
        proveedor: input.proveedor || 'MERCADOPAGO',
        metadata: {
          tareaId: input.tareaId,
          socioId: input.socioId,
          orgId: input.orgId,
          planConfig: {
            plan: planConfig.plan,
            porcentajeComision: planConfig.comisionFija 
              ? planConfig.comisionFija 
              : (planConfig.comisionMin + planConfig.comisionMax) / 2,
          },
        },
      })
      .select()
      .single();

    if (escrowError || !escrowData) {
      throw new Error(`Error creando transacción de escrow: ${escrowError?.message || 'Error desconocido'}`);
    }

    return {
      escrowId: escrowData.id,
      checkoutUrl: mpPreference.checkoutUrl,
      mpPreferenceId: mpPreference.preferenceId,
    };
  }

  /**
   * Marca un pago como aprobado desde el webhook de MercadoPago
   * Se ejecuta cuando MP confirma que el pago quedó "approved"
   */
  static async marcarPagoAprobadoDesdeWebhook(payload: {
    paymentId?: string;
    preferenceId?: string;
    status?: string;
    rawPayload?: any;
  }): Promise<EscrowTransaccion | null> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Buscar transacción por payment_id o preference_id
    let escrowQuery = supabaseAny
      .from('escrow_transacciones')
      .select('*')
      .eq('estado', 'pendiente');

    if (payload.paymentId) {
      escrowQuery = escrowQuery.eq('mp_payment_id', payload.paymentId);
    } else if (payload.preferenceId) {
      escrowQuery = escrowQuery.eq('mp_preference_id', payload.preferenceId);
    } else {
      console.warn('[ESCROW] No se proporcionó paymentId ni preferenceId en el webhook');
      return null;
    }

    const { data: escrowTransaccion, error: escrowError } = await escrowQuery.maybeSingle();

    if (escrowError) {
      console.error('[ESCROW] Error buscando transacción:', escrowError);
      return null;
    }

    if (!escrowTransaccion) {
      console.warn('[ESCROW] Transacción no encontrada para paymentId/preferenceId:', payload.paymentId || payload.preferenceId);
      return null;
    }

    // Si el pago está aprobado, actualizar estado a 'retenido'
    if (payload.status === 'approved') {
      const { data: updated, error: updateError } = await supabaseAny
        .from('escrow_transacciones')
        .update({
          estado: 'retenido',
          mp_payment_id: payload.paymentId || escrowTransaccion.mp_payment_id,
          mp_status: payload.status,
          mp_raw_payload: payload.rawPayload || null,
          fecha_deposito: new Date().toISOString(),
        })
        .eq('id', escrowTransaccion.id)
        .select()
        .single();

      if (updateError) {
        console.error('[ESCROW] Error actualizando transacción:', updateError);
        throw new Error(`Error actualizando escrow: ${updateError.message}`);
      }

      console.log(`[ESCROW] Pago marcado como retenido para escrow ${escrowTransaccion.id}`);
      return updated;
    }

    // Si el pago está rechazado o cancelado, actualizar estado
    if (['rejected', 'cancelled', 'refunded'].includes(payload.status || '')) {
      const { error: updateError } = await supabaseAny
        .from('escrow_transacciones')
        .update({
          estado: 'cancelado',
          mp_status: payload.status,
          mp_raw_payload: payload.rawPayload || null,
        })
        .eq('id', escrowTransaccion.id);

      if (updateError) {
        console.error('[ESCROW] Error cancelando transacción:', updateError);
      }
    }

    return escrowTransaccion;
  }

  /**
   * Libera los fondos de escrow cuando una tarea se valida
   * Punto clave: transfiere dinero del escrow a los wallets del socio y Grows
   */
  static async liberarFondosPorTarea(
    tareaId: string,
    actorId: string
  ): Promise<{ liberado: boolean; escrowId?: string }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    try {
      // 1. Buscar transacción de escrow en estado 'retenido' para esta tarea
      const { data: escrowTransaccion, error: escrowError } = await supabaseAny
        .from('escrow_transacciones')
        .select('*')
        .eq('tarea_id', tareaId)
        .eq('estado', 'retenido')
        .maybeSingle();

      // Si no hay escrow, asumimos caso de efectivo - no romper
      if (escrowError || !escrowTransaccion) {
        console.log(`[ESCROW] No se encontró escrow retenido para tarea ${tareaId} - asumiendo pago en efectivo`);
        return { liberado: false };
      }

      // 2. Obtener información de la tarea y presupuesto
      const { data: presupuesto, error: presupuestoError } = await supabaseAny
        .from('tareas_presupuestos')
        .select('id, monto, socio_id')
        .eq('tarea_id', tareaId)
        .eq('estado', 'APROBADO')
        .maybeSingle();

      const socioId = presupuesto?.socio_id || escrowTransaccion.socio_id;
      if (!socioId) {
        throw new Error(`No se pudo determinar el socio_id para la tarea ${tareaId}`);
      }

      // 3. Registrar pago en wallet usando el servicio existente
      await WalletService.registrarPagoPorTarea({
        tareaId,
        socioId,
        orgId: escrowTransaccion.org_id,
        montoTotal: escrowTransaccion.monto_total,
        metodoPago: 'ONLINE', // Digital viene de escrow
        presupuestoId: escrowTransaccion.presupuesto_id || presupuesto?.id,
        escrowId: escrowTransaccion.id,
      });

      // 4. Actualizar transacción de escrow a estado 'liberado'
      const { error: updateError } = await supabaseAny
        .from('escrow_transacciones')
        .update({
          estado: 'liberado',
          fecha_liberacion: new Date().toISOString(),
        })
        .eq('id', escrowTransaccion.id);

      if (updateError) {
        console.error('[ESCROW] Error actualizando estado de escrow:', updateError);
        throw new Error(`Error liberando escrow: ${updateError.message}`);
      }

      // 5. Vincular movimientos de wallet con el escrow
      // (Los movimientos ya fueron creados por registrarPagoPorTarea)
      // Actualizamos el escrow_id en los movimientos
      await supabaseAny
        .from('wallet_movimientos')
        .update({ escrow_id: escrowTransaccion.id })
        .eq('tarea_id', tareaId)
        .is('escrow_id', null);

      console.log(`[ESCROW] Fondos liberados para tarea ${tareaId}, escrow ${escrowTransaccion.id}`);

      return {
        liberado: true,
        escrowId: escrowTransaccion.id,
      };
    } catch (error) {
      console.error('[ESCROW] Error liberando fondos:', error);
      // No lanzar error para no interrumpir el flujo de validación
      return { liberado: false };
    }
  }

  /**
   * (Estructura preparada) Reembolsa un pago de escrow
   * Por ahora solo estructura, implementación completa más adelante
   */
  static async reembolsarPagoEscrow(
    escrowId: string,
    motivo: string
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Implementar reembolso completo
    // Esto incluiría:
    // 1. Verificar que el escrow está en estado 'retenido' o 'liberado'
    // 2. Procesar reembolso en MercadoPago
    // 3. Actualizar estado a 'reembolsado'
    // 4. Crear movimientos reversos en wallet si ya fue liberado
    
    console.warn('[ESCROW] Reembolso no implementado aún para escrow:', escrowId);
    return {
      success: false,
      error: 'Reembolso no implementado aún',
    };
  }

  /**
   * Obtiene el estado de escrow de una tarea
   */
  static async obtenerEstadoEscrowTarea(
    tareaId: string
  ): Promise<EscrowTransaccion | null> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny
      .from('escrow_transacciones')
      .select('*')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[ESCROW] Error obteniendo estado:', error);
      return null;
    }

    return data;
  }
}

