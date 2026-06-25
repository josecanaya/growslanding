import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import type { CanvasTaskTemplateDef } from '@/lib/canvas/canvasTemplateTypes';

function linearTasks(
  slug: string,
  nombre: string,
  obraProductKind: ObraProductKind,
  titulos: string[],
  descripcion?: string,
): CanvasTaskTemplateDef {
  const tareas = titulos.map((titulo, i) => ({
    id: `${slug}-t${i + 1}`,
    titulo,
    orden: i + 1,
    duracionEstimadaDias: 1,
    tipo: 'tarea',
  }));
  const conexiones = tareas.slice(0, -1).map((t, i) => ({
    sourceTaskId: t.id,
    targetTaskId: tareas[i + 1]!.id,
    tipoConexion: 'FINISH_TO_START',
  }));
  return {
    id: slug,
    slug,
    nombre,
    obraProductKind,
    visibilidad: 'oficial',
    descripcion,
    tareas,
    conexiones,
  };
}

/** Catálogo oficial Sprint 1 (fuente de verdad hasta sincronizar con Supabase). */
export const OFFICIAL_CANVAS_TEMPLATES: CanvasTaskTemplateDef[] = [
  linearTasks(
    'trabajo_simple_colocar_porton',
    'Colocar portón',
    'trabajo_simple',
    [
      'Relevamiento',
      'Presupuesto',
      'Compra / fabricación',
      'Preparación del vano',
      'Colocación',
      'Ajustes finales',
      'Evidencia',
      'Validación',
      'Pago',
    ],
    'Secuencia típica para colocación de portón.',
  ),
  linearTasks(
    'casa_tradicional_base',
    'Casa — plan base',
    'casa',
    [
      'Replanteo general',
      'Movimiento de suelo',
      'Fundación',
      'Estructura',
      'Cubierta',
      'Instalaciones (rough-in)',
      'Cerramientos',
      'Terminaciones',
      'Entrega y evidencia',
      'Validación final',
    ],
  ),
  linearTasks(
    'edificio_base',
    'Edificio — plan base',
    'edificio',
    [
      'Replanteo y gabinete',
      'Excavación y fundaciones',
      'Estructura de hormigón',
      'Mampostería y cerramientos',
      'Instalaciones verticales',
      'Instalaciones horizontales',
      'Terminaciones comunes',
      'Pruebas de sistemas',
      'Habilitación parcial',
      'Validación y entrega',
    ],
  ),
  linearTasks(
    'reforma_base',
    'Reforma — plan base',
    'reforma',
    [
      'Relevamiento del estado actual',
      'Protección de sectores',
      'Demolición selectiva',
      'Instalaciones',
      'Terminaciones',
      'Limpieza y entrega',
      'Evidencia',
      'Validación',
    ],
  ),
  linearTasks(
    'mantenimiento_base',
    'Mantenimiento — plan base',
    'mantenimiento',
    [
      'Diagnóstico',
      'Presupuesto',
      'Coordinación de acceso',
      'Intervención',
      'Prueba de funcionamiento',
      'Evidencia',
      'Validación',
      'Cierre',
    ],
  ),
  linearTasks(
    'puerta_interior',
    'Puerta interior',
    'trabajo_simple',
    [
      'Medición',
      'Verificación de vano',
      'Colocación de marco',
      'Colocación de hoja',
      'Cerradura',
      'Ajustes',
      'Evidencia',
      'Validación',
    ],
    'Pack de librería — puerta interior.',
  ),
];

export function getOfficialTemplateBySlug(slug: string): CanvasTaskTemplateDef | null {
  return OFFICIAL_CANVAS_TEMPLATES.find((t) => t.slug === slug) ?? null;
}

export function listOfficialTemplatesForKind(kind: ObraProductKind): CanvasTaskTemplateDef[] {
  return OFFICIAL_CANVAS_TEMPLATES.filter((t) => t.obraProductKind === kind);
}

export function defaultTemplateSlugForKind(kind: ObraProductKind): string {
  const list = listOfficialTemplatesForKind(kind);
  return list[0]?.slug ?? OFFICIAL_CANVAS_TEMPLATES[0]!.slug;
}
