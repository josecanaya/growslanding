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
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

export type EstadoSubtarea = EstadoBloqueCore;

export class GenerarBloquesError extends Error {
  constructor(
    message: string,
    public readonly debug: Record<string, unknown>,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'GenerarBloquesError';
  }
}

type GenerarBloquesResult = {
  created: boolean;
  existing: boolean;
  bloquesCount: number;
  debug: Record<string, unknown>;
};

type SubtareaRecord = {
  id: string;
  tarea_id: string;
  estado: EstadoSubtarea;
  socio_id: string | null;
  presupuesto_id?: string | null;
  evidencia_obligatoria: boolean;
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
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
  static async generarBloquesDesdePresupuesto(tareaId: string): Promise<GenerarBloquesResult> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, dias_presupuesto, bloques_planificados, responsable_socio_id')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tarea) {
      throw new GenerarBloquesError('Tarea no encontrada para generar bloques', {
        tareaId,
        motivo: tareaError?.message ?? 'TAREA_NO_ENCONTRADA',
      });
    }

    const { data: presupuestoRows, error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, monto, dias_reales, cantidad, unidad, notas, socio_id, estado')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(12);

    if (presupuestoError) {
      throw new GenerarBloquesError('No se pudo leer el presupuesto aprobado', {
        tareaId,
        motivo: presupuestoError.message,
      }, presupuestoError.details ?? undefined);
    }

    const socioTarea = tarea.responsable_socio_id ?? null;
    const presupuestosAprobados = (presupuestoRows ?? []).filter((row: any) =>
      estadoPresupuestoEsAprobado(row.estado),
    );
    const presupuesto =
      presupuestosAprobados.find((row: any) => !socioTarea || row.socio_id === socioTarea) ??
      null;

    if (!presupuesto) {
      throw new GenerarBloquesError(
        'No hay presupuesto aprobado para la tarea y el socio asignado',
        {
          tareaId,
          socioId: socioTarea,
          presupuestoId: null,
          bloquesPlanificados: tarea.bloques_planificados ?? tarea.dias_presupuesto ?? 1,
          motivo: 'PRESUPUESTO_APROBADO_NO_ENCONTRADO',
          presupuestosEncontrados: (presupuestoRows ?? []).map((row: any) => ({
            id: row.id,
            estado: row.estado,
            socio_id: row.socio_id,
          })),
        },
      );
    }

    let diasNotas: number | null = null;
    if (presupuesto?.notas) {
      try {
        const parsed = typeof presupuesto.notas === 'string' ? JSON.parse(presupuesto.notas) : presupuesto.notas;
        const valor = Number(parsed?.dias_reales ?? parsed?.dias ?? parsed?.bloques_planificados);
        diasNotas = Number.isFinite(valor) && valor > 0 ? valor : null;
      } catch {
        diasNotas = null;
      }
    }

    const bloquesPlanificados = Number(
      tarea.bloques_planificados ||
      tarea.dias_presupuesto ||
      presupuesto?.dias_reales ||
      diasNotas ||
      1,
    );
    const totalBloques = Math.max(1, Number.isFinite(bloquesPlanificados) ? Math.round(bloquesPlanificados) : 1);
    const socioId = tarea.responsable_socio_id || presupuesto.socio_id || null;
    const presupuestoId = presupuesto?.id ?? null;
    const cantidad = Number(presupuesto?.cantidad ?? 1);
    const unidad = String(presupuesto?.unidad || 'unidad');

    const { data: existentes, error: existentesError } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, orden, bloque_index, estado, socio_id, presupuesto_id, cantidad, unidad, evidencia_obligatoria, evidencia_cargada')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });

    if (existentesError) {
      throw new GenerarBloquesError(
        'No se pudo verificar si la tarea ya tiene bloques',
        {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: totalBloques,
          motivo: existentesError.message,
          supabaseError: existentesError,
        },
        existentesError.details ?? undefined,
      );
    }

    if (existentes && existentes.length > 0) {
      return {
        created: false,
        existing: true,
        bloquesCount: existentes.length,
        debug: {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: totalBloques,
          motivo: 'YA_EXISTEN_BLOQUES',
        },
      };
    }

    const bloques = Array.from({ length: totalBloques }).map((_, index) => {
      return {
        tarea_id: tareaId,
        bloque_index: index + 1,
        orden: index + 1,
        estado: 'pendiente',
        cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
        unidad,
        evidencia_obligatoria: true,
        evidencia_cargada: false,
        socio_id: socioId,
        presupuesto_id: presupuestoId,
      };
    });

    const { error: insertError } = await supabaseAny.from('tareas_subtareas').insert(bloques);

    if (insertError) {
      throw new GenerarBloquesError(
        'No se pudieron generar las subtareas automaticamente',
        {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: totalBloques,
          insertPayload: bloques,
          supabaseError: insertError,
          cantidad: bloques[0]?.cantidad,
          unidad,
          motivo: insertError.message,
        },
        insertError.details ?? undefined,
      );
    }

    return {
      created: true,
      existing: false,
      bloquesCount: bloques.length,
      debug: {
        tareaId,
        socioId,
        presupuestoId,
        bloquesPlanificados: totalBloques,
        insertPayload: bloques,
        cantidad: bloques[0]?.cantidad,
        unidad,
        motivo: 'BLOQUES_CREADOS',
      },
    };
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

    const select = await this.buildSubtareaSelect(supabaseAny);
    const { data: subtarea, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(select)
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
      const rejectPatch: Record<string, unknown> = {
        estado: 'rechazado',
        updated_at: ahora,
      };

      const { error: rejectError } = await supabaseAny
        .from('tareas_subtareas')
        .update(rejectPatch)
        .eq('id', subtareaId);

      if (rejectError) {
        throw new Error(rejectError.message);
      }

      return { tareaValidada: false };
    }

    const updatePatch: Record<string, unknown> = {
      estado: 'validado',
      updated_at: ahora,
    };

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update(updatePatch)
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

    const select = await this.buildSubtareaSelect(supabaseAny);
    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(select)
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

  private static async buildSubtareaSelect(_supabaseAny: any): Promise<string> {
    return `
        id,
        tarea_id,
        estado,
        socio_id,
        presupuesto_id,
        evidencia_obligatoria,
        evidencia_cargada,
        evidencia_url,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id,
          estado
        )
      `;
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
