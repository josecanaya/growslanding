import { createServiceSupabaseClient } from '../supabase-server';
import { RolActor } from './permiso.service';
import { WalletMvpService } from './wallet-mvp.service';
import {
  ESTADOS_TAREA,
  ESTADO_BLOQUE_FINAL,
  ESTADO_TAREA_FINAL,
  type EstadoTareaCore,
} from '../domain/estados-core';

export type EstadoTarea = EstadoTareaCore;

const TRANSITIONS: Record<RolActor, Record<EstadoTarea, EstadoTarea[]>> = {
  SOCIO: {
    pendiente: ['en_progreso'],
    en_progreso: ['para_validar'],
    para_validar: [],
    validada: [],
    rechazada: ['en_progreso'],
  },
  CLIENTE: {
    pendiente: [],
    en_progreso: [],
    para_validar: ['validada', 'rechazada'],
    validada: [],
    rechazada: ['en_progreso'],
  },
};

const LEGACY_ESTADO_TO_OFICIAL: Record<string, EstadoTarea> = {
  pendiente: 'pendiente',
  propuesta: 'pendiente',
  presupuestada: 'pendiente',
  asignada: 'pendiente',
  activa: 'pendiente',
  en_progreso: 'en_progreso',
  'en progreso': 'en_progreso',
  en_ejecucion: 'en_progreso',
  'en ejecucion': 'en_progreso',
  para_validar: 'para_validar',
  en_revision: 'para_validar',
  finalizado: 'para_validar',
  finalizada: 'para_validar',
  final: 'para_validar',
  terminada: 'para_validar',
  terminado: 'para_validar',
  validado: 'validada',
  validada: 'validada',
  aprobado: 'validada',
  aprobada: 'validada',
  rechazada: 'rechazada',
  rechazado: 'rechazada',
};

type EnforceParams = {
  tareaId: string;
  nuevoEstado: EstadoTarea;
  actorId: string;
  rol: RolActor;
  motivo?: string | null;
  /** `socios.id` del operador; necesario si `tareas.responsable_socio_id` es null y el socio opera por presupuesto/cuadrilla. */
  socioOperadorId?: string | null;
};

type RegistrarEventoParams = {
  tareaId: string;
  actorId: string;
  actorRol: RolActor;
  estadoAnterior: EstadoTarea;
  estadoNuevo: EstadoTarea;
  motivo?: string | null;
};

export class TareaFsmService {
  static canTransition(
    estadoActual: EstadoTarea,
    nuevoEstado: EstadoTarea,
    rol: RolActor,
  ) {
    const allowed = TRANSITIONS[rol]?.[estadoActual] ?? [];
    return allowed.includes(nuevoEstado);
  }

  static getNextStates(estadoActual: EstadoTarea, rol: RolActor): EstadoTarea[] {
    return TRANSITIONS[rol]?.[estadoActual] ?? [];
  }

  static async enforceTransition(params: EnforceParams) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error } = await supabaseAny
      .from('tareas')
      .select('id, estado, org_id, responsable_socio_id')
      .eq('id', params.tareaId)
      .maybeSingle();

    if (error || !tarea) {
      throw new Error('Tarea no encontrada');
    }

    const estadoActual = this.mapLegacyToOficial(tarea.estado);

    if (estadoActual === params.nuevoEstado) {
      return { id: tarea.id, estado: estadoActual };
    }

    if (!this.canTransition(estadoActual, params.nuevoEstado, params.rol)) {
      throw new Error(
        `Transicion no permitida de ${estadoActual} a ${params.nuevoEstado} para rol ${params.rol}`,
      );
    }

    if (params.nuevoEstado === ESTADO_TAREA_FINAL) {
      await this.assertSubtareasValidadas(params.tareaId);
    }

    if (params.nuevoEstado === 'en_progreso' && params.rol === 'SOCIO') {
      const socioOp = params.socioOperadorId ?? tarea.responsable_socio_id ?? null;
      if (!socioOp) {
        throw new Error(
          'No se pudo resolver el socio operador para iniciar la tarea (falta responsable_socio_id y socioOperadorId)',
        );
      }
      await this.assertSocioPuedeOperar(tarea.id, socioOp);
    }

    if (params.nuevoEstado === 'rechazada' && params.rol !== 'CLIENTE') {
      throw new Error('Solo el cliente puede rechazar una tarea');
    }

    const { data: updated, error: updateError } = await supabaseAny
      .from('tareas')
      .update({
        estado: params.nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.tareaId)
      .select('id, estado')
      .maybeSingle();

    if (updateError || !updated) {
      throw new Error(updateError?.message || 'No se pudo actualizar la tarea');
    }

    await this.registerEvento({
      tareaId: params.tareaId,
      actorId: params.actorId,
      actorRol: params.rol,
      estadoAnterior: estadoActual,
      estadoNuevo: params.nuevoEstado,
      motivo: params.motivo,
    });

    return updated;
  }

  private static async assertSubtareasValidadas(tareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: pendientes, error } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', tareaId)
      .neq('estado', ESTADO_BLOQUE_FINAL)
      .limit(1);

    if (error) {
      throw new Error('No se pudo verificar subtareas de la tarea');
    }

    if (pendientes && pendientes.length > 0) {
      throw new Error('No se puede validar la tarea: existen bloques pendientes');
    }
  }

  private static async assertMaxTareasActivas(socioId: string, tareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { count, error } = await supabaseAny
      .from('tareas')
      .select('*', { count: 'exact', head: true })
      .eq('responsable_socio_id', socioId)
      .eq('estado', 'en_progreso')
      .neq('id', tareaId);

    if (error) {
      throw new Error('No se pudo validar el limite de tareas activas');
    }

    if ((count || 0) >= 2) {
      throw new Error('El socio ya tiene dos tareas en progreso');
    }
  }

  private static async assertSocioPuedeOperar(tareaId: string, socioId: string | null) {
    if (!socioId) {
      throw new Error('La tarea no tiene un socio asignado');
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);
    await this.assertMaxTareasActivas(socioId, tareaId);
  }

  private static async registerEvento(params: RegistrarEventoParams) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const metadata = {
      motivo: params.motivo ?? null,
    };

    await supabaseAny
      .from('tareas_eventos')
      .insert({
        tarea_id: params.tareaId,
        actor_id: params.actorId,
        actor_tipo: params.actorRol,
        estado_anterior: params.estadoAnterior,
        estado_nuevo: params.estadoNuevo,
        metadata,
      })
      .catch((err: unknown) => {
        console.error('[TareaFsmService] Error registrando evento', err);
      });

    await supabaseAny
      .from('tareas_estados')
      .insert({
        tarea_id: params.tareaId,
        estado_anterior: params.estadoAnterior,
        estado_nuevo: params.estadoNuevo,
        actor_id: params.actorId,
        actor_tipo: params.actorRol,
        motivo: params.motivo || null,
        created_at: new Date().toISOString(),
      })
      .catch((err: unknown) => {
        console.error('[TareaFsmService] Error registrando estado legacy', err);
      });
  }

  static mapLegacyToOficial(estado: string | null | undefined): EstadoTarea {
    if (!estado) {
      return 'pendiente';
    }
    const normalized = estado.trim().toLowerCase();
    return LEGACY_ESTADO_TO_OFICIAL[normalized] ?? 'pendiente';
  }

  static getEstadosOficiales(): EstadoTarea[] {
    return [...ESTADOS_TAREA];
  }
}
