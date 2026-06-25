import type { ObraProductKind } from '@/lib/canvas/obraProductKind';

export type CanvasTemplateVisibilidad = 'oficial' | 'publico' | 'privado';

export type CanvasTemplateTaskDef = {
  id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  duracionEstimadaDias?: number;
  tipo?: string;
  metadata?: Record<string, unknown>;
};

export type CanvasTemplateConnectionDef = {
  sourceTaskId: string;
  targetTaskId: string;
  tipoConexion?: string;
};

/** Definición portable de template (DB o catálogo oficial en código). */
export type CanvasTaskTemplateDef = {
  id: string;
  slug: string;
  nombre: string;
  obraProductKind: ObraProductKind;
  visibilidad: CanvasTemplateVisibilidad;
  descripcion?: string;
  autorUserId?: string | null;
  orgId?: string | null;
  tareas: CanvasTemplateTaskDef[];
  conexiones: CanvasTemplateConnectionDef[];
};
