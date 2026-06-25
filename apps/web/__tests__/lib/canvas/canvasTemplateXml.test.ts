import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canvasImportBundleFromTemplateXml } from '@/lib/canvas/importCanvasTemplateFromXml';

describe('canvas template XML', () => {
  it('colocar_puerta_interior.xml importa etapa y tareas como importación MSP', () => {
    const xml = readFileSync(
      join(__dirname, '../../../public/canvas-templates/trabajo_comun/colocar_puerta_interior.xml'),
      'utf8',
    );
    const bundle = canvasImportBundleFromTemplateXml(xml);
    expect(bundle.projectKind).toBe('simple');
    const etapas = bundle.nodes.filter((n) => n.type === 'etapa' && n.parentId === null);
    const tareas = bundle.nodes.filter((n) => n.type === 'tarea');
    expect(etapas.length).toBeGreaterThanOrEqual(1);
    expect(tareas.length).toBe(10);
    expect(bundle.edges.length).toBeGreaterThanOrEqual(9);
  });
});
