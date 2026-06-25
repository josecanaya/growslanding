/**
 * Escribe XML de templates oficiales en public/canvas-templates/.
 * Ejecutar: pnpm exec tsx scripts/generate-canvas-template-xml.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { OFFICIAL_CANVAS_TEMPLATES } from '../lib/canvas/officialCanvasTemplates';
import { buildSimpleLinearPlanTemplateXml } from '../lib/canvas/buildCanvasTemplateProjectXml';

const outDir = join(__dirname, '../public/canvas-templates');
mkdirSync(outDir, { recursive: true });

for (const t of OFFICIAL_CANVAS_TEMPLATES) {
  const xml = buildSimpleLinearPlanTemplateXml({
    projectTitle: t.nombre,
    etapaTitle: t.nombre,
    taskTitles: t.tareas.map((x) => x.titulo),
  });
  const file = join(outDir, `${t.slug}.xml`);
  writeFileSync(file, xml, 'utf8');
  console.log('wrote', file);
}
