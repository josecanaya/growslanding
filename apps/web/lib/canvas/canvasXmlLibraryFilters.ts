import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import type { CanvasLibrarySegment } from '@/lib/canvas/parseCanvasLibraryCatalog';
import type { CanvasXmlLibraryEntry } from './canvasXmlLibrary';

export type TrabajoSimpleDetalle = 'porton' | 'puerta' | 'otro';

export type CanvasXmlLibraryFilter = {
  segment?: CanvasLibrarySegment;
  obraProductKind?: ObraProductKind | 'reforma' | 'edificio';
  rubro?: string;
  trabajoSimpleDetalle?: TrabajoSimpleDetalle;
  search?: string;
  unidades?: number;
  m2?: number;
  complejidad?: 'baja' | 'media' | 'alta';
  plantas?: number;
  ambientes?: number;
  plantasEdificio?: number;
  deptosPorPiso?: number;
  pbComercial?: boolean;
  subsueloCocheras?: boolean;
  amenities?: boolean;
};

function complejidadMatches(entryVal: string | null, chosen: string | undefined): boolean {
  if (!chosen) return true;
  if (!entryVal) return true;
  const parts = entryVal.split('|').map((s) => s.trim().toLowerCase());
  return parts.includes(chosen.toLowerCase());
}

function inRange(value: number | undefined, min: number | null, max: number | null): boolean {
  if (value == null || Number.isNaN(value)) return true;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function filterCanvasXmlLibrary(
  entries: CanvasXmlLibraryEntry[],
  filter: CanvasXmlLibraryFilter,
): CanvasXmlLibraryEntry[] {
  let out = entries;

  if (filter.segment) out = out.filter((e) => e.segment === filter.segment);
  if (filter.obraProductKind) out = out.filter((e) => e.obraProductKind === filter.obraProductKind);

  if (filter.rubro) {
    const r = filter.rubro.toLowerCase();
    out = out.filter((e) => e.rubro.toLowerCase() === r || e.subtipo.toLowerCase().includes(r));
  }

  if (filter.trabajoSimpleDetalle === 'porton') {
    out = out.filter((e) => e.slug.includes('porton') || e.tags.some((t) => t.includes('porton')));
  } else if (filter.trabajoSimpleDetalle === 'puerta') {
    out = out.filter((e) => e.slug === 'puerta_interior' || e.slug.includes('puerta'));
  }

  if (filter.unidades != null) {
    out = out.filter((e) => inRange(filter.unidades, e.unidadesMin, e.unidadesMax));
  }
  if (filter.m2 != null) {
    out = out.filter((e) => inRange(filter.m2, e.m2Min, e.m2Max));
  }
  if (filter.complejidad) {
    out = out.filter((e) => complejidadMatches(e.complejidad, filter.complejidad));
  }
  if (filter.plantas != null) {
    out = out.filter((e) => e.plantas == null || e.plantas === filter.plantas);
  }
  if (filter.ambientes != null) {
    out = out.filter(
      (e) =>
        (e.ambientesMin == null || filter.ambientes! >= e.ambientesMin) &&
        (e.ambientesMax == null || filter.ambientes! <= e.ambientesMax),
    );
  }
  if (filter.plantasEdificio != null) {
    out = out.filter((e) => e.plantasEdificio == null || e.plantasEdificio === filter.plantasEdificio);
  }
  if (filter.deptosPorPiso != null) {
    out = out.filter((e) => e.deptosPorPiso == null || e.deptosPorPiso === filter.deptosPorPiso);
  }
  if (filter.pbComercial === true) out = out.filter((e) => e.pbComercial);
  if (filter.subsueloCocheras === true) out = out.filter((e) => e.subsueloCocheras);
  if (filter.amenities === true) out = out.filter((e) => e.amenities);

  const q = filter.search?.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.descripcion ?? '').toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.rubro.toLowerCase().includes(q),
    );
  }

  return out;
}

/** Puntaje para “3 más cercanos” cuando no hay match exacto (D.1). */
export function scoreCatalogMatch(entry: CanvasXmlLibraryEntry, filter: CanvasXmlLibraryFilter): number {
  let score = 0;
  if (filter.segment && entry.segment === filter.segment) score += 10;
  if (filter.obraProductKind && entry.obraProductKind === filter.obraProductKind) score += 8;
  if (filter.rubro && entry.rubro.toLowerCase() === filter.rubro.toLowerCase()) score += 6;
  if (filter.m2 != null && inRange(filter.m2, entry.m2Min, entry.m2Max)) score += 4;
  if (filter.unidades != null && inRange(filter.unidades, entry.unidadesMin, entry.unidadesMax)) score += 4;
  if (filter.plantas != null && entry.plantas === filter.plantas) score += 3;
  if (filter.complejidad && complejidadMatches(entry.complejidad, filter.complejidad)) score += 2;
  return score;
}

export function nearestCanvasXmlLibrary(
  entries: CanvasXmlLibraryEntry[],
  filter: CanvasXmlLibraryFilter,
  limit = 3,
): CanvasXmlLibraryEntry[] {
  const sameSegment = filter.segment
    ? entries.filter((e) => e.segment === filter.segment)
    : entries;
  return [...sameSegment]
    .map((e) => ({ e, score: scoreCatalogMatch(e, filter) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
