export type ObraEstado = 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA' | 'PENDIENTE';

export interface Obra {
  id: string;
  nombre: string;
  localizacion?: string;
  estado: ObraEstado | string;
  created_at: string;
  updatedAt?: string;
  fecha_inicio?: string;
  fecha_inicio_estimada?: string; // Fecha de inicio estimada (obligatoria al crear)
  fecha_final_estimada?: string; // Fecha de finalización estimada (calculada automáticamente)
  presupuesto?: number;
  descripcion?: string;
  cliente?: string;
  tipoObra?: 'nueva' | 'reforma' | 'ampliacion';
  numeroPermiso?: string;
  progreso?: number;
  tareasActivas?: number;
  tareasCompletadas?: number;
  legajoTecnico?: unknown[];
}

export interface ObraStats {
  total: number;
  activas: number;
  pausadas: number;
  finalizadas: number;
  canceladas: number;
}

export interface ObraFormState {
  nombre: string;
  localizacion: string;
  fecha_inicio: string;
  fecha_inicio_estimada: string; // Campo obligatorio para fecha de inicio estimada
  presupuesto: string;
  descripcion: string;
}

export const INITIAL_OBRA_FORM_STATE: ObraFormState = {
  nombre: '',
  localizacion: '',
  fecha_inicio: '',
  fecha_inicio_estimada: '',
  presupuesto: '',
  descripcion: '',
};

export interface ObraTimelineTask {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  plantilla: string;
  checklist: string[];
  evidencias: string[];
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  precedencia: string[];
  duracion: number;
  esCritica: boolean;
  tiempoTemprano: number;
  tiempoTardio: number;
  // LEGACY: mantener compatibilidad con mocks actuales
  [key: string]: unknown;
}

export interface ObraDetalle extends Obra {
  fechaInicio?: string;
  fechaFinEstimada?: string;
  tareas?: ObraTimelineTask[];
}
