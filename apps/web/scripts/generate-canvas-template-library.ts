/**
 * Genera 50 XML + index JSON desde templates/canvas-library-catalog-v1.csv
 * Ejecutar: pnpm exec tsx scripts/generate-canvas-template-library.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseCanvasLibraryCatalogCsv } from '../lib/canvas/parseCanvasLibraryCatalog';
import {
  buildSimpleLinearPlanTemplateXml,
  type PlanDurationPreset,
} from '../lib/canvas/buildCanvasTemplateProjectXml';

const root = join(__dirname, '..');
const csvPath = join(root, 'templates/canvas-library-catalog-v1.csv');
const publicRoot = join(root, 'public/canvas-templates');
const indexOut = join(root, 'lib/canvas/generated/canvas-library-catalog.json');

const csv = readFileSync(csvPath, 'utf8');
const entries = parseCanvasLibraryCatalogCsv(csv);

if (entries.length === 0) {
  console.error('Catálogo vacío:', csvPath);
  process.exit(1);
}

mkdirSync(join(root, 'lib/canvas/generated'), { recursive: true });

const indexPayload = entries.map((e) => ({
  segment: e.segment,
  slug: e.slug,
  nombre: e.nombreVisible,
  descripcion: e.duracionGuia,
  obra_product_kind: e.obraProductKind,
  rubro: e.rubro,
  subtipo: e.subtipo,
  filtro_unidad: e.filtroUnidad,
  unidades_min: e.unidadesMin,
  unidades_max: e.unidadesMax,
  m2_min: e.m2Min,
  m2_max: e.m2Max,
  complejidad: e.complejidad,
  plantas: e.plantas,
  ambientes_min: e.ambientesMin,
  ambientes_max: e.ambientesMax,
  plantas_edificio: e.plantasEdificio,
  deptos_por_piso: e.deptosPorPiso,
  pb_comercial: e.pbComercial,
  subsuelo_cocheras: e.subsueloCocheras,
  amenities: e.amenities,
  tags: e.tags,
  task_count: e.tareas.length,
  xml_path: e.xmlPath,
  tareas: e.tareas,
}));

for (const e of entries) {
  const dir = join(publicRoot, e.segment);
  mkdirSync(dir, { recursive: true });
  const preset: PlanDurationPreset =
    e.segment === 'trabajo_comun'
      ? 'trabajo_comun'
      : e.segment === 'casa'
        ? 'casa'
        : e.segment === 'edificio'
          ? 'edificio'
          : 'reforma';

  const xml = buildSimpleLinearPlanTemplateXml({
    projectTitle: e.nombreVisible,
    etapaTitle: e.nombreVisible,
    taskTitles: e.tareas,
    durationPreset: preset,
  });
  const file = join(dir, `${e.slug}.xml`);
  writeFileSync(file, xml, 'utf8');
  console.log('wrote', file);
}

writeFileSync(indexOut, JSON.stringify({ version: 1, count: entries.length, entries: indexPayload }, null, 2), 'utf8');
console.log('wrote', indexOut, `(${entries.length} templates)`);
