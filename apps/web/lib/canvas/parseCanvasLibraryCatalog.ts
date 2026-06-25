import type { ObraProductKind } from '@/lib/canvas/obraProductKind';

export type CanvasLibrarySegment = 'trabajo_comun' | 'casa' | 'edificio' | 'reforma';

export type CanvasLibraryCatalogEntry = {
  segment: CanvasLibrarySegment;
  slug: string;
  nombreVisible: string;
  rubro: string;
  subtipo: string;
  obraProductKind: ObraProductKind | 'reforma' | 'edificio';
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
  tareas: string[];
  duracionGuia: string | null;
  xmlPath: string;
};

function parseNum(v: string | undefined): number | null {
  const t = (v ?? '').trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseBoolSi(v: string | undefined): boolean {
  return (v ?? '').trim().toLowerCase() === 'si';
}

function splitPipe(v: string | undefined): string[] {
  if (!v?.trim()) return [];
  return v
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** CSV aprobado (sep `;`, tareas/tags con ` | `). */
export function parseCanvasLibraryCatalogCsv(csvText: string): CanvasLibraryCatalogEntry[] {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0]!.split(';').map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const rows: CanvasLibraryCatalogEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(';');
    const get = (name: string) => cols[idx(name)]?.trim() ?? '';

    const segment = get('segment') as CanvasLibrarySegment;
    const slug = get('slug');
    if (!slug || !segment) continue;

    const tareasRaw = get('tareas') || get('tareas_separadas_por_punto_y_coma');
    const tareas = tareasRaw.includes('|')
      ? splitPipe(tareasRaw)
      : tareasRaw
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);

    rows.push({
      segment,
      slug,
      nombreVisible: get('nombre_visible'),
      rubro: get('rubro'),
      subtipo: get('subtipo'),
      obraProductKind: (get('obra_product_kind') || 'trabajo_simple') as CanvasLibraryCatalogEntry['obraProductKind'],
      filtroUnidad: get('filtro_unidad'),
      unidadesMin: parseNum(get('unidades_min')),
      unidadesMax: parseNum(get('unidades_max')),
      m2Min: parseNum(get('m2_min')),
      m2Max: parseNum(get('m2_max')),
      complejidad: get('complejidad') || null,
      plantas: parseNum(get('plantas')),
      ambientesMin: parseNum(get('ambientes_min')),
      ambientesMax: parseNum(get('ambientes_max')),
      plantasEdificio: parseNum(get('plantas_edificio')),
      deptosPorPiso: parseNum(get('deptos_por_piso')),
      pbComercial: parseBoolSi(get('pb_comercial')),
      subsueloCocheras: parseBoolSi(get('subsuelo_cocheras')),
      amenities: parseBoolSi(get('amenities')),
      tags: splitPipe(get('tags')),
      tareas,
      duracionGuia: get('duracion_guia') || null,
      xmlPath: `/canvas-templates/${segment}/${slug}.xml`,
    });
  }

  return rows;
}
