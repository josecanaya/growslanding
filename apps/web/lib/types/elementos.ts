export interface Fases {
  estructura: string[];
  obra_gris: string[];
  terminaciones: string[];
}

export interface TipoElemento {
  nombre: string;
  fases: Fases;
}

export interface Elemento {
  categoria: string;
  tipos: TipoElemento[];
}

export interface ElementoSeleccionado {
  id: string;
  categoria: string;
  tipo: string;
  cantidad: number;
  unidad: 'm²' | 'm³' | 'unidad';
  fases: Fases;
}

export interface TareaExpandidada {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
  tiempoEstimado: number; // en días
  dependencias: string[];
  orden: number;
}

export interface TimelineEvent {
  id: string;
  tarea: TareaExpandidada;
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  fase: 'estructura' | 'obra_gris' | 'terminaciones';
}
