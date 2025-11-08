export type Especialidad =
  | 'Albañilería / Estructura'
  | 'Yesería / Terminaciones'
  | 'Carpintería'
  | 'Plomería / Gas'
  | 'Electricidad'
  | 'Pintura';

export type EstadoCuadrilla = 'Disponible' | 'Ocupada' | 'En obra' | 'Inactiva';

export interface Integrante {
  id: string;
  nombre: string;
  rol?: string; // oficial, ayudante, etc.
  seguroVigente?: boolean;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  dni?: string;
  fechaIngreso?: string;
}

export interface Documento {
  id: string;
  tipo: 'ART' | 'Seguro' | 'Certificado' | 'Otro';
  nombre: string;
  url?: string; // mock
  vigente?: boolean;
  fechaVencimiento?: string;
}

export interface KPI {
  tareasAsignadas: number;
  tareasEnEjecucion: number;
  tareasTerminadas: number;
  cumplimientoPct: number; // 0..100
}

export interface Feedback {
  id: string;
  fecha: string;
  obraNombre: string;
  puntuacion: number; // 1-5
  comentario: string;
  autor: string;
}

export interface Badge {
  id: string;
  tipo: 'cumplimiento' | 'velocidad' | 'calidad' | 'antiguedad';
  titulo: string;
  descripcion: string;
  icono: string;
  fechaObtenido: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  encargado: string;
  telefonoEncargado?: string;
  whatsappEncargado?: string;
  emailEncargado?: string;
  fotoEncargado?: string;
  especialidad: Especialidad;
  estado: EstadoCuadrilla;
  antiguedad: string; // ej: "2 años y 5 obras"
  valoracionPromedio: number; // 1-5
  obrasParticipadas: number;
  cumplimientoTiempo: number; // porcentaje
  seguridadAlDia: boolean;
  integrantes: Integrante[];
  documentos: Documento[];
  kpi: KPI;
  feedback: Feedback[];
  badges: Badge[];
  // mock de asignaciones actuales
  asignaciones?: Array<{
    obraNombre: string;
    tareaNombre: string;
    etapa: 'estructura' | 'obra_gris' | 'terminaciones';
    estado: 'ASIGNADA' | 'EN_EJECUCION' | 'TERMINADA' | 'VALIDADA';
    fechaInicio?: string;
    fechaFinEstimada?: string;
  }>;
}

export interface Obra {
  id: string;
  nombre: string;
  estado: string;
}

export interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  estado: 'PENDIENTE' | 'ASIGNADA' | 'EN_EJECUCION' | 'TERMINADA' | 'VALIDADA';
  cuadrillaId?: string;
}

export interface FiltrosCuadrillas {
  especialidad?: Especialidad;
  estado?: EstadoCuadrilla;
  busqueda?: string;
}
