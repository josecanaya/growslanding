// =============================================
// NUEVOS TIPOS PARA GROWS
// =============================================

export type TipoOrganizacion = 'cliente_tecnico' | 'socio_constructor';

export type TipoObra = 'nueva' | 'reforma' | 'ampliacion';

export type EstadoObra = 'activa' | 'pausada' | 'finalizada' | 'cancelada';

export type EtapaObra = 'estructura' | 'obra_gris' | 'terminaciones';

export type EstadoTarea = 'recibido' | 'presupuestado' | 'pendiente' | 'en_ejecucion' | 'ejecutado' | 'aprobado';

export type PrioridadTarea = 'baja' | 'normal' | 'alta' | 'critica';

export type TipoDependencia = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export type EstadoPago = 'pendiente' | 'pagado' | 'cancelado';

export type TipoEvidencia = 'foto' | 'video' | 'documento' | 'firma';

export type EscrowEstado = 'pendiente' | 'retenido' | 'liberado' | 'reembolsado' | 'cancelado';

export type ActorTipo = 'cliente_tecnico' | 'socio';

// =============================================
// INTERFACES PRINCIPALES
// =============================================

export interface ClienteTecnico {
  id: string;
  name: string;
  tipo_organizacion: TipoOrganizacion;
  telefono?: string;
  localizacion?: string;
  created_at: string;
  updated_at: string;
}

export interface Socio {
  id: string;
  org_id: string;
  nombre: string;
  contacto?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  localizacion?: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  created_at: string;
  updated_at: string;
}

export interface Obra {
  id: string;
  org_id: string;
  nombre: string;
  cliente?: string;
  localizacion?: string;
  tipo_obra: TipoObra;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  presupuesto_total?: number;
  estado: EstadoObra;
  numero_permiso?: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  elementos?: ElementoObra[];
  cliente_tecnico?: ClienteTecnico;
}

export interface ElementoObra {
  id: string;
  obra_id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  duracion_estimada: number;
  costo_estimado?: number;
  etapa: EtapaObra;
  orden: number;
  created_at: string;
  
  // Relaciones
  tareas?: Tarea[];
  obra?: Obra;
}

export interface Tarea {
  id: string;
  elemento_id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  duracion_estimada: number;
  costo_estimado?: number;
  socio_id?: string;
  estado: EstadoTarea;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_inicio_real?: string;
  fecha_fin_real?: string;
  prioridad: PrioridadTarea;
  es_critica: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  elemento?: ElementoObra;
  socio?: Socio;
  estados?: TareaEstado[];
  precedencias?: TareaPrecedencia[];
  pagos?: Pago[];
  evidencias?: EvidenciaTarea[];
}

export interface TareaEstado {
  id: string;
  tarea_id: string;
  estado_anterior?: EstadoTarea;
  estado_nuevo: EstadoTarea;
  actor_id?: string;
  actor_tipo: ActorTipo;
  actor_nombre: string;
  motivo?: string;
  notas?: string;
  created_at: string;
}

export interface TareaPrecedencia {
  id: string;
  tarea_id: string;
  tarea_predecesora_id: string;
  tipo_dependencia: TipoDependencia;
  lag_dias: number;
  created_at: string;
  
  // Relaciones
  tarea?: Tarea;
  tarea_predecesora?: Tarea;
}

export interface Pago {
  id: string;
  tarea_id: string;
  monto: number;
  moneda: string;
  estado: EstadoPago;
  metodo_pago?: string;
  numero_comprobante?: string;
  fecha_pago?: string;
  aprobado_por?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  tarea?: Tarea;
  cliente_tecnico?: ClienteTecnico;
}

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

export interface EvidenciaTarea {
  id: string;
  tarea_id: string;
  tipo: TipoEvidencia;
  archivo_path: string;
  descripcion?: string;
  subido_por?: string;
  subido_por_tipo: ActorTipo;
  created_at: string;
  
  // Relaciones
  tarea?: Tarea;
}

// =============================================
// TIPOS PARA FORMULARIOS
// =============================================

export interface CrearObraData {
  nombre: string;
  cliente?: string;
  localizacion?: string;
  tipo_obra: TipoObra;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  presupuesto_total?: number;
  numero_permiso?: string;
  descripcion?: string;
}

export interface CrearElementoData {
  obra_id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  duracion_estimada: number;
  costo_estimado?: number;
  etapa: EtapaObra;
  orden?: number;
}

export interface CrearTareaData {
  elemento_id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  duracion_estimada: number;
  costo_estimado?: number;
  socio_id?: string;
  prioridad?: PrioridadTarea;
  es_critica?: boolean;
  notas?: string;
}

export interface CambiarEstadoTareaData {
  tarea_id: string;
  estado_nuevo: EstadoTarea;
  motivo?: string;
  notas?: string;
}

// =============================================
// TIPOS PARA DASHBOARDS
// =============================================

export interface DashboardClienteTecnico {
  obras: Obra[];
  elementos: ElementoObra[];
  tareas: Tarea[];
  socios: Socio[];
  pagos: Pago[];
  estadisticas: {
    total_obras: number;
    obras_activas: number;
    tareas_pendientes: number;
    tareas_en_ejecucion: number;
    tareas_aprobadas: number;
    monto_pendiente_pago: number;
    monto_pagado: number;
  };
}

export interface DashboardSocio {
  tareas_asignadas: Tarea[];
  tareas_completadas: Tarea[];
  pagos_recibidos: Pago[];
  estadisticas: {
    tareas_pendientes: number;
    tareas_en_ejecucion: number;
    tareas_completadas: number;
    monto_ganado: number;
    monto_pendiente: number;
  };
}

