import {
  TareasRepository,
  type CanvasTareaUpsertPayload,
  type CrearTareaPayload,
  type TareaRow,
} from './infrastructure/tareas.repository';

export type ActualizarTareaMetadataInput = {
  title?: string;
  descripcion?: string | null;
  responsable?: string | null;
  prioridad?: string;
  fecha_inicio_estimada?: string | null;
  fecha_fin_estimada?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  avance?: number;
  bloques_planificados?: number;
  dias_presupuesto?: number;
};

/**
 * Creación y actualización de campos de tarea que NO son FSM.
 * El estado solo cambia vía TareaComandosService / TareaFsmService.
 */
export class TareaMetadataService {
  static async crearTarea(
    payload: CrearTareaPayload,
    actorId: string,
  ): Promise<TareaRow> {
    const tarea = await TareasRepository.insert(payload);
    await TareasRepository.registrarEstadoInicial(tarea.id, actorId);
    return tarea;
  }

  static async actualizarMetadata(
    tareaId: string,
    orgId: string,
    input: ActualizarTareaMetadataInput,
  ): Promise<TareaRow> {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.descripcion !== undefined) patch.descripcion = input.descripcion;
    if (input.responsable !== undefined) patch.responsable = input.responsable;
    if (input.prioridad !== undefined) patch.prioridad = input.prioridad;
    if (input.fecha_inicio_estimada !== undefined) {
      patch.fecha_inicio_estimada = input.fecha_inicio_estimada;
    }
    if (input.fecha_fin_estimada !== undefined) {
      patch.fecha_fin_estimada = input.fecha_fin_estimada;
    }
    if (input.fecha_inicio_real !== undefined) patch.fecha_inicio_real = input.fecha_inicio_real;
    if (input.fecha_fin_real !== undefined) patch.fecha_fin_real = input.fecha_fin_real;
    if (input.avance !== undefined) patch.avance = input.avance;
    if (input.bloques_planificados !== undefined) {
      patch.bloques_planificados = input.bloques_planificados;
    }
    if (input.dias_presupuesto !== undefined) patch.dias_presupuesto = input.dias_presupuesto;

    if (Object.keys(patch).length === 0) {
      throw new Error('No hay cambios para aplicar');
    }

    return TareasRepository.updateMetadata(tareaId, orgId, patch);
  }

  static async asignarSocioTrasCreacion(
    tareaId: string,
    orgId: string,
    params: { responsable: string; responsable_socio_id: string },
  ): Promise<TareaRow> {
    await TareasRepository.updateAsignacion(tareaId, orgId, {
      responsable: params.responsable,
      responsable_socio_id: params.responsable_socio_id,
    });
    const row = await TareasRepository.findById(tareaId, [orgId]);
    if (!row) throw new Error('Tarea no encontrada tras asignar socio');
    return row;
  }

  /** Publicación desde canvas: crea tarea pendiente o actualiza metadata sin tocar estado. */
  static async upsertDesdeCanvas(params: {
    existingId?: string | null;
    existingElementoId?: string | null;
    payload: CanvasTareaUpsertPayload;
    actorId: string;
  }): Promise<{ id: string; created: boolean }> {
    const { existingId, existingElementoId, payload, actorId } = params;

    if (existingId) {
      const patch: Record<string, unknown> = {
        title: payload.title,
        descripcion: payload.descripcion ?? null,
        dias_presupuesto: payload.dias_presupuesto,
        is_critical: payload.is_critical,
        source: payload.source,
        published_from_canvas_at: payload.published_from_canvas_at,
      };
      if (!existingElementoId) {
        patch.elemento_id = payload.elemento_id;
      }
      await TareasRepository.updateFromCanvas(existingId, patch);
      return { id: existingId, created: false };
    }

    const row = await TareasRepository.insertFromCanvas(payload);
    await TareasRepository.registrarEstadoInicial(row.id, actorId);
    return { id: row.id, created: true };
  }
}
