/**
 * Genera los XML + index JSON de la librería de planes.
 *
 * Dos fuentes:
 *  - `templates/canvas-library-catalog-v1.csv` → trabajos comunes/simples (cadena lineal).
 *  - `lib/canvas/flagshipPlans.ts` → planes flagship CURADOS para casa / reforma / edificio
 *    (secuencias reales, muchas tareas, precedencias ramificadas). Reemplazan a los planes
 *    lineales autogenerados de esos tipos.
 *
 * Ejecutar: pnpm exec tsx scripts/generate-canvas-template-library.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseCanvasLibraryCatalogCsv } from '../lib/canvas/parseCanvasLibraryCatalog';
import {
  buildSimpleLinearPlanTemplateXml,
  type PlanDurationPreset,
} from '../lib/canvas/buildCanvasTemplateProjectXml';
import {
  buildStructuredPlanTemplateXml,
  countStructuredPlanTasks,
} from '../lib/canvas/buildStructuredPlanTemplateXml';
import { FLAGSHIP_PLANS } from '../lib/canvas/flagshipPlans';

const root = join(__dirname, '..');
const csvPath = join(root, 'templates/canvas-library-catalog-v1.csv');
const publicRoot = join(root, 'public/canvas-templates');
const indexOut = join(root, 'lib/canvas/generated/canvas-library-catalog.json');

const csv = readFileSync(csvPath, 'utf8');
const allCsvEntries = parseCanvasLibraryCatalogCsv(csv);

// Los tipos casa/reforma/edificio ahora vienen de planes flagship curados, no de la cadena
// lineal del CSV: los descartamos del CSV para no duplicar slugs ni versionar planes pobres.
const FLAGSHIP_SEGMENTS = new Set(FLAGSHIP_PLANS.map((p) => p.segment));
const entries = allCsvEntries.filter((e) => !FLAGSHIP_SEGMENTS.has(e.segment as never));

if (entries.length === 0 && FLAGSHIP_PLANS.length === 0) {
  console.error('Catálogo vacío:', csvPath);
  process.exit(1);
}

mkdirSync(join(root, 'lib/canvas/generated'), { recursive: true });

const csvIndexPayload = entries.map((e) => ({
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

// Planes flagship curados (casa / reforma / edificio).
const flagshipIndexPayload = FLAGSHIP_PLANS.map((p) => {
  const dir = join(publicRoot, p.segment);
  mkdirSync(dir, { recursive: true });
  const xml = buildStructuredPlanTemplateXml(p.spec);
  const file = join(dir, `${p.slug}.xml`);
  writeFileSync(file, xml, 'utf8');
  const taskCount = countStructuredPlanTasks(p.spec);
  console.log('wrote', file, `(${taskCount} tareas)`);
  return {
    segment: p.segment,
    slug: p.slug,
    nombre: p.nombreVisible,
    descripcion: p.duracionGuia,
    obra_product_kind: p.obraProductKind,
    rubro: p.rubro,
    subtipo: p.subtipo,
    filtro_unidad: p.filtroUnidad,
    unidades_min: p.unidadesMin,
    unidades_max: p.unidadesMax,
    m2_min: p.m2Min,
    m2_max: p.m2Max,
    complejidad: p.complejidad,
    plantas: p.plantas,
    ambientes_min: p.ambientesMin,
    ambientes_max: p.ambientesMax,
    plantas_edificio: p.plantasEdificio,
    deptos_por_piso: p.deptosPorPiso,
    pb_comercial: p.pbComercial,
    subsuelo_cocheras: p.subsueloCocheras,
    amenities: p.amenities,
    tags: p.tags,
    task_count: taskCount,
    xml_path: `/canvas-templates/${p.segment}/${p.slug}.xml`,
    tareas: p.spec.phases.flatMap((ph) => ph.tasks.map((tk) => tk.name)),
  };
});

const indexPayload = [...csvIndexPayload, ...flagshipIndexPayload];

writeFileSync(indexOut, JSON.stringify({ version: 1, count: indexPayload.length, entries: indexPayload }, null, 2), 'utf8');
console.log('wrote', indexOut, `(${indexPayload.length} templates)`);
