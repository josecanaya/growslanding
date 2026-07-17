/**
 * Obra Check — contratos centrales del motor.
 *
 * Todo (Excel, CSV, Project XML, chat) converge a ObraCheckTask[]. El CPM, los bloques,
 * el PDF y los mensajes de WhatsApp consumen SÓLO estos tipos.
 *
 * Identidad: `id` es un string opaco estable generado por el front (client_id). Las
 * predecesoras referencian esos ids. No mezclar con el uuid interno de Supabase.
 */

export type ObraCheckOrigen = 'excel' | 'csv' | 'project_xml' | 'chat';

export type ObraCheckTask = {
  /** client_id: identidad estable dentro de la sesión (no es el uuid de Supabase). */
  id: string;
  nombre: string;
  /** Fase funcional / comercial definida por el usuario antes de ordenar. */
  fase: string | null;
  rubro: string | null;
  duracionDias: number | null;
  inicio: string | null; // ISO date (YYYY-MM-DD)
  fin: string | null;
  /** client_ids de tareas predecesoras. */
  predecesoras: string[];
  responsableLabel: string | null;
  /** client_id del bloque asignado (se completa al ordenar). */
  blockId: string | null;
  origen: ObraCheckOrigen;
  filaOrigen?: number;
  /** Completados por el motor de orden (CPM). */
  orden?: number;
  esCritica?: boolean;
};

export type ObraCheckBlock = {
  /** client_id del bloque. */
  id: string;
  nombre: string;
  rubro: string | null;
  fase: string | null;
  budgetGroupId?: string | null;
  orden: number;
  /** client_ids de las tareas del bloque. */
  taskIds: string[];
};

export type ObraCheckBudgetGroup = {
  id: string;
  nombre: string;
  blockIds: string[];
  /** null = grupo raíz (fase). */
  parentId?: string | null;
  kind?: 'fase' | 'subgrupo';
  orden?: number;
};

export type ObraCheckContact = {
  id: string;
  nombre: string;
  rubro: string | null;
  telefono: string | null;
};

export type ObraCheckWarning = {
  kind:
    | 'sin_dependencias'
    | 'ciclo_detectado'
    | 'sin_duracion'
    | 'columna_no_detectada'
    | 'sin_nombre'
    | 'header_no_detectado';
  message: string;
  taskId?: string;
};

/** Campos que el motor sabe mapear desde una planilla. */
export type ColumnField =
  | 'nombre'
  | 'duracion'
  | 'inicio'
  | 'fin'
  | 'predecesoras'
  | 'responsable'
  | 'avance'
  | 'rubro';

export type ColumnMapping = Partial<Record<ColumnField, number>>;

export type ExcelParseResult = {
  tasks: ObraCheckTask[];
  headerRowIndex: number;
  mapping: ColumnMapping;
  /** Confianza 0–1 del mapeo automático de columnas. La UI debe pedir confirmación. */
  confidence: number;
  warnings: ObraCheckWarning[];
};

export type OrdenarResult = {
  tasks: ObraCheckTask[];
  blocks: ObraCheckBlock[];
  cpm: {
    duracionTotalDias: number;
    tareasCriticas: number;
  };
  warnings: ObraCheckWarning[];
};
