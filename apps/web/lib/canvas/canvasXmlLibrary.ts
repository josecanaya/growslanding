import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import type { CanvasLibrarySegment } from '@/lib/canvas/parseCanvasLibraryCatalog';
import catalogJson from '@/lib/canvas/generated/canvas-library-catalog.json';
import type { TrabajoSimpleDetalle } from './canvasXmlLibraryFilters';

export type { TrabajoSimpleDetalle };

export type CanvasXmlLibraryEntry = {
  slug: string;
  nombre: string;
  descripcion?: string;
  segment: CanvasLibrarySegment;
  obraProductKind: string;
  rubro: string;
  subtipo: string;
  filtroUnidad: string;
  unidadesMin: number | null;
  unidadesMax: number | null;
  m2Min: number | null;
  m2Max: number | null;
  complejidad: string | null;
  plantas: number | null;
  ambientesMin: number | null;
  ambientesMax: number | null;
  plantasEdificio: number | null;
  deptosPorPiso: number | null;
  pbComercial: boolean;
  subsueloCocheras: boolean;
  amenities: boolean;
  tags: string[];
  taskCount: number;
  xmlPath: string;
};

type RawEntry = (typeof catalogJson)['entries'][number];

function mapEntry(r: RawEntry): CanvasXmlLibraryEntry {
  return {
    slug: r.slug,
    nombre: r.nombre,
    descripcion: r.descripcion ?? undefined,
    segment: r.segment as CanvasLibrarySegment,
    obraProductKind: r.obra_product_kind,
    rubro: r.rubro,
    subtipo: r.subtipo,
    filtroUnidad: r.filtro_unidad,
    unidadesMin: r.unidades_min,
    unidadesMax: r.unidades_max,
    m2Min: r.m2_min,
    m2Max: r.m2_max,
    complejidad: r.complejidad,
    plantas: r.plantas,
    ambientesMin: r.ambientes_min,
    ambientesMax: r.ambientes_max,
    plantasEdificio: r.plantas_edificio,
    deptosPorPiso: r.deptos_por_piso,
    pbComercial: r.pb_comercial,
    subsueloCocheras: r.subsuelo_cocheras,
    amenities: r.amenities,
    tags: r.tags ?? [],
    taskCount: r.task_count,
    xmlPath: r.xml_path,
  };
}

export function listCanvasXmlLibrary(): CanvasXmlLibraryEntry[] {
  return catalogJson.entries.map(mapEntry);
}

export function getCanvasXmlLibraryEntry(slug: string): CanvasXmlLibraryEntry | null {
  const r = catalogJson.entries.find((e) => e.slug === slug);
  return r ? mapEntry(r) : null;
}

export { filterCanvasXmlLibrary, scoreCatalogMatch, nearestCanvasXmlLibrary } from './canvasXmlLibraryFilters';
