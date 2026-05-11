import { createServiceSupabaseClient } from '../supabase-server';
import { WalletMvpService } from './wallet-mvp.service';
import { TareaFsmService } from './tarea-fsm.service';
import { PermisoService, RolActor } from './permiso.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  ESTADO_TAREA_FINAL,
  type EstadoBloqueCore,
} from '../domain/estados-core';

export type EstadoSubtarea = EstadoBloqueCore;

type SubtareaRecord = {
  id: string;
  tarea_id: string;
  estado: EstadoSubtarea;
  socio_id: string | null;
  evidencia_obligatoria: boolean;
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
  monto_estimado: number | null;
  monto_validado?: number | null;
  tareas?: {
    id: string;
    org_id: string;
    responsable_socio_id: string | null;
    estado: string;
  } | null;
};

type ActorContext = {
  id: string;
  rol: RolActor;
  socioId?: string | null;
};

type ValidarParams = ActorContext & {
  metodoPago?: 'EFECTIVO' | 'ONLINE';
  accion?: 'validar' | 'rechazar';
  motivo?: string | null;
};

export class SubtareaMvpService {
  /**
   * Genera subtareas (bloques) en base al presupuesto aprobado.
   */
  static async generarBloquesDesdePresupuesto(tareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, dias_presupuesto, bloques_planificados, responsable_socio_id')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tarea) {
      throw new Error('Tarea no encontrada para generar bloques');
    }

    const { data: presupuesto } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, monto, dias_reales')
      .eq('tarea_id', tareaId)
      .eq('estado', 'APROBADO')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const dias = presupuesto?.dias_reales || tarea.dias_presupuesto || tarea.bloques_planificados || 1;

    const { data: existentes } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', tareaId)
      .limit(1);

    if (existentes && existentes.length > 0) {
      return;
    }

    const montoTotal = presupuesto?.monto || 0;
    const montoPorDia = dias > 0 ? Number((montoTotal / dias).toFixed(2)) : montoTotal;

    const bloques = Array.from({ length: Math.max(1, dias) }).map((_, index) => ({
      tarea_id: tareaId,
      bloque_index: index + 1,
      estado: 'pendiente',
      // NOT NULL en DB: si no hay monto en presupuesto, usar 0 para cumplir constraint.
      monto_estimado: montoTotal > 0 ? montoPorDia : 0,
      evidencia_obligatoria: true,
      socio_id: tarea.responsable_socio_id,
      presupuesto_id: presupuesto?.id || null,
    }));

    const { error: insertError } = await supabaseAny.from('tareas_subtareas').insert(bloques);

    if (insertError) {
      throw new Error('No se pudieron generar las subtareas automaticamente');
    }
  }

  static async iniciarBloque(subtareaId: string, actor: ActorContext) {
    if (actor.rol !== 'SOCIO') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const subtarea = await this.obtenerSubtarea(subtareaId);
    this.assertSocioOperaBloque(subtarea, actor);

    if (!['pendiente', 'rechazado'].includes(subtarea.estado)) {
      throw new Error('Solo se pueden iniciar bloques pendientes o rechazados');
    }

    const socioId = await this.obtenerSocioAsignado(subtarea, actor);
    if (!socioId) {
      throw new Error('No hay un socio asignado al bloque');
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);
    await this.assertMaxBloquesActivos(socioId, subtareaId);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date().toISOString();

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update({
        estado: 'en_progreso',
        hora_inicio: ahora,
        updated_at: ahora,
      })
      .eq('id', subtareaId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  static async enviarParaValidar(subtareaId: string, actor: ActorContext) {
    if (actor.rol !== 'SOCIO') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const subtarea = await this.obtenerSubtarea(subtareaId);
    this.assertSocioOperaBloque(subtarea, actor);

    if (subtarea.estado !== 'en_progreso') {
      throw new Error('El bloque debe estar en progreso para ser enviado a validacion');
    }

    if (subtarea.evidencia_obligatoria && !this.tieneEvidencia(subtarea)) {
      throw new Error('Debes cargar evidencia antes de enviar el bloque a validacion');
    }

    const socioId = await this.obtenerSocioAsignado(subtarea, actor);
    if (!socioId) {
      throw new Error('No hay un socio asignado al bloque');
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date().toISOString();

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update({
        estado: 'para_validar',
        hora_fin: ahora,
        updated_at: ahora,
      })
      .eq('id', subtareaId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  /**
   * Valida o rechaza un bloque pagable.
   */
  static async validarSubtarea(
    subtareaId: string,
    actor: ValidarParams,
  ) {
    if (actor.rol !== 'CLIENTE') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(`
        id,
        tarea_id,
        estado,
        socio_id,
        evidencia_obligatoria,
        evidencia_cargada,
        evidencia_url,
        monto_estimado,
        monto_validado,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id,
          estado
        )
      `)
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !subtarea) {
      throw new Error('Subtarea no encontrada');
    }

    if (subtarea.estado !== ESTADO_BLOQUE_PARA_VALIDAR) {
      throw new Error('El bloque debe estar en estado para_validar para que el cliente opere');
    }

    if (subtarea.evidencia_obligatoria && !this.tieneEvidencia(subtarea)) {
      throw new Error('No se puede validar el bloque sin evidencia cargada');
    }

    const socioId = subtarea.socio_id || subtarea.tareas?.responsable_socio_id;
    if (!socioId) {
      throw new Error('La subtarea no tiene socio asociado');
    }

    const accion = actor.accion ?? 'validar';
    const ahora = new Date().toISOString();

    if (accion === 'rechazar') {
      const { error: rejectError } = await supabaseAny
        .from('tareas_subtareas')
        .update({
          estado: 'rechazado',
          validado_por: null,
          monto_validado: null,
          fecha_validacion: null,
          updated_at: ahora,
        })
        .eq('id', subtareaId);

      if (rejectError) {
        throw new Error(rejectError.message);
      }

      return { tareaValidada: false };
    }

    const monto = subtarea.monto_estimado ?? 0;

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update({
        estado: 'validado',
        monto_validado: monto,
        fecha_validacion: ahora,
        validado_por: actor.id,
      })
      .eq('id', subtareaId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);
    await WalletMvpService.registrarPagoPorBloque(subtareaId, actor.metodoPago ?? 'EFECTIVO');

    const { data: restantes } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', subtarea.tarea_id)
      .neq('estado', ESTADO_BLOQUE_FINAL)
      .limit(1);

    const tareaValidada = !restantes || restantes.length === 0;

    if (tareaValidada) {
      await TareaFsmService.enforceTransition({
        tareaId: subtarea.tarea_id,
        nuevoEstado: ESTADO_TAREA_FINAL,
        actorId: actor.id,
        rol: 'CLIENTE',
        motivo: 'Validacion automatica por bloques',
      });
    }

    return { tareaValidada };
  }

  /**
   * El actor SOCIO debe ser el asignado al bloque/tarea (no confiar solo en IDs del cliente).
   */
  private static assertSocioOperaBloque(subtarea: SubtareaRecord, actor: ActorContext) {
    if (actor.rol !== 'SOCIO' || !actor.socioId) {
      throw new Error('FORBIDDEN_ACTION');
    }
    const socioAsignado = subtarea.socio_id || subtarea.tareas?.responsable_socio_id || null;
    if (!socioAsignado || socioAsignado !== actor.socioId) {
      throw new Error('No tenés permiso para operar este bloque');
    }
  }

  private static async obtenerSubtarea(subtareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(`
        id,
        tarea_id,
        estado,
        socio_id,
        evidencia_obligatoria,
        evidencia_cargada,
        evidencia_url,
        monto_estimado,
        monto_validado,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id,
          estado
        )
      `)
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Subtarea no encontrada');
    }

    return data;
  }

  private static tieneEvidencia(subtarea: SubtareaRecord) {
    return Boolean(subtarea.evidencia_cargada || subtarea.evidencia_url);
  }

  private static async assertMaxBloquesActivos(socioId: string, subtareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { count, error } = await supabaseAny
      .from('tareas_subtareas')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId)
      .eq('estado', 'en_progreso')
      .neq('id', subtareaId);

    if (error) {
      throw new Error('No se pudo validar el limite de bloques activos');
    }

    if ((count || 0) >= 2) {
      throw new Error('El socio ya tiene dos bloques en ejecucion');
    }
  }

  private static async obtenerSocioAsignado(subtarea: SubtareaRecord, actor: ActorContext) {
    if (subtarea.socio_id) {
      return subtarea.socio_id;
    }

    const orgId = subtarea.tareas?.org_id;
    if (!orgId) {
      return null;
    }

    if (actor.socioId) {
      return actor.socioId;
    }

    return PermisoService.obtenerSocioIdPorUsuario(actor.id, orgId);
  }
}
