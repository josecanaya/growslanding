import {
  TareaFsmService,
  type EstadoTarea,
} from '@/lib/services/tarea-fsm.service';
import type { RolActor } from '@/lib/services/permiso.service';

/**
 * Única puerta de escritura para cambios de estado de tarea (FSM).
 * Las rutas y componentes no deben hacer UPDATE tareas.estado directo.
 */
export class TareaComandosService {
  static canTransition(estadoActual: EstadoTarea, nuevoEstado: EstadoTarea, rol: RolActor) {
    return TareaFsmService.canTransition(estadoActual, nuevoEstado, rol);
  }

  static getNextStates(estadoActual: EstadoTarea, rol: RolActor) {
    return TareaFsmService.getNextStates(estadoActual, rol);
  }

  static mapLegacyToOficial(estado: string | null | undefined) {
    return TareaFsmService.mapLegacyToOficial(estado);
  }

  static async transicionar(params: {
    tareaId: string;
    nuevoEstado: EstadoTarea;
    actorId: string;
    rol: RolActor;
    motivo?: string | null;
    socioOperadorId?: string | null;
  }) {
    return TareaFsmService.enforceTransition({
      tareaId: params.tareaId,
      nuevoEstado: params.nuevoEstado,
      actorId: params.actorId,
      rol: params.rol,
      motivo: params.motivo,
      socioOperadorId: params.socioOperadorId,
    });
  }

  static async reconciliarSiTodosBloquesValidados(
    tareaId: string,
    actor: { actorId: string; motivo?: string },
  ) {
    return TareaFsmService.reconciliarTareaSiTodosBloquesValidados(tareaId, actor);
  }
}
