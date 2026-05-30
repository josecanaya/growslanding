/**
 * Módulo de tareas — única puerta de escritura hacia Supabase (objetivo).
 * Extraíble a microservicio más adelante.
 */
export { TareasRepository, TAREA_CAMPOS_FSM } from './infrastructure/tareas.repository';
export type { TareaRow, CrearTareaPayload, CanvasTareaUpsertPayload } from './infrastructure/tareas.repository';

export { SubtareasRepository, SUBTAREA_UI_SELECT } from './infrastructure/subtareas.repository';

export { TareaMetadataService } from './tarea-metadata.service';
export type { ActualizarTareaMetadataInput } from './tarea-metadata.service';

export { TareaAsignacionService } from './tarea-asignacion.service';
export { TareaComandosService } from './tarea-comandos.service';
export { SubtareaEnviarValidarService } from './subtarea-enviar-validar.service';

/** Re-export opcional para imports desde @/lib/tareas */
export type { EstadoTarea } from '@/lib/services/tarea-fsm.service';
